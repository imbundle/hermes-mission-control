#!/usr/bin/env bash
# Phase 5.1 (issue #72): vendor @mcui/react into this repo as a local tarball.
#
# Usage:
#   scripts/vendor-mcui.sh [path-to-mission-control-ui-library-repo]
#
# The mcui repo path may also be supplied via MCUI_REPO_PATH. No default
# absolute path is hardcoded here (portability across checkouts/reviewers).
#
# Steps (subplan Scope item 1 / issue #72):
#   1. Abort if the mcui repo has uncommitted changes.
#   2. Capture its short commit SHA.
#   3. Build mcui (`pnpm run build`).
#   4. `pnpm pack` it into this repo's vendor/ directory.
#   5. Rename the tarball to vendor/mcui-react-0.1.0-<SHA>.tgz.
#   6. Remove any other stale mcui-react-*.tgz already present.
#   7. Point package.json's @mcui/react dependency at the new tarball via file:.
#   8. `pnpm install` in this repo.

set -euo pipefail

MC_REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MCUI_REPO="${1:-${MCUI_REPO_PATH:-}}"

if [[ -z "${MCUI_REPO}" ]]; then
  echo "error: mcui repo path not provided. Pass it as \$1 or set MCUI_REPO_PATH." >&2
  exit 1
fi

if [[ ! -d "${MCUI_REPO}/.git" ]]; then
  echo "error: '${MCUI_REPO}' is not a git repository." >&2
  exit 1
fi

VENDOR_DIR="${MC_REPO_ROOT}/vendor"
mkdir -p "${VENDOR_DIR}"

# 1. Abort on dirty mcui working tree — refuse to vendor unreproducible state.
if [[ -n "$(git -C "${MCUI_REPO}" status --short)" ]]; then
  echo "error: uncommitted mcui changes, commit first — refusing to vendor unreproducible state." >&2
  git -C "${MCUI_REPO}" status --short >&2
  exit 1
fi

# 2. Capture the mcui commit SHA.
SHA="$(git -C "${MCUI_REPO}" rev-parse --short HEAD)"
echo "mcui commit: ${SHA}"

# 3. Build mcui.
echo "Building mcui (pnpm run build)..."
( cd "${MCUI_REPO}" && pnpm run build )

# 4. Pack it into this repo's vendor/ dir.
echo "Packing mcui into ${VENDOR_DIR}..."
PACK_OUTPUT="$( cd "${MCUI_REPO}" && pnpm pack --pack-destination "${VENDOR_DIR}" )"
# `pnpm pack` prints the absolute tarball path as its last non-empty line.
PACKED_PATH="$(echo "${PACK_OUTPUT}" | awk 'NF{last=$0} END{print last}' | tr -d '[:space:]')"

if [[ ! -f "${PACKED_PATH}" ]]; then
  echo "error: expected packed tarball at '${PACKED_PATH}' but it does not exist." >&2
  echo "pnpm pack output was:" >&2
  echo "${PACK_OUTPUT}" >&2
  exit 1
fi

# 5. Rename to the pinned convention.
TARGET_NAME="mcui-react-0.1.0-${SHA}.tgz"
TARGET_PATH="${VENDOR_DIR}/${TARGET_NAME}"
mv "${PACKED_PATH}" "${TARGET_PATH}"
echo "Vendored tarball: ${TARGET_PATH}"

# 6. Remove any other stale mcui-react-*.tgz already present.
find "${VENDOR_DIR}" -maxdepth 1 -name 'mcui-react-*.tgz' ! -name "${TARGET_NAME}" -print -delete

# 7. Point package.json's @mcui/react dependency at the new tarball.
node -e "
const fs = require('fs');
const path = '${MC_REPO_ROOT}/package.json';
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
pkg.dependencies = pkg.dependencies || {};
pkg.dependencies['@mcui/react'] = 'file:./vendor/${TARGET_NAME}';
fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
"
echo "package.json updated: @mcui/react -> file:./vendor/${TARGET_NAME}"

# 8. Install.
echo "Running pnpm install..."
( cd "${MC_REPO_ROOT}" && pnpm install )

echo "Done. Verify with: node -e \"require('@mcui/react')\""
