#!/usr/bin/env bash
#
# Generate the TypeScript Angular API client from the backend OpenAPI contract.
#
# The backend contract is vendored in openapi/family-budget.yaml. Re-copy it
# from the backend repository whenever the contract changes:
#
#   cp ../../family-budget/docs/openapi.yaml openapi/family-budget.yaml
#
# Requirements: Node.js/npm (used via npx) and Java 11+ on PATH or JAVA_HOME.
# The generated client is committed to the repository so builds do not need
# Java or the generator; only regeneration does.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

SPEC_FILE="${PROJECT_ROOT}/openapi/family-budget.yaml"
OUTPUT_DIR="${PROJECT_ROOT}/src/app/core/api/generated"
OPENAPI_GENERATOR_CLI_VERSION="2.42.0"
LOCAL_JDK_DIR="${PROJECT_ROOT}/.tools/jdk-21"

download_local_jdk() {
  local os arch url archive extracted
  local tmp_dir

  case "$(uname -s)" in
    Linux) os="linux" ;;
    Darwin) os="mac" ;;
    *)
      echo "error: automatic JDK download is not supported on $(uname -s)." >&2
      return 1
      ;;
  esac

  case "$(uname -m)" in
    x86_64 | amd64) arch="x64" ;;
    arm64 | aarch64) arch="aarch64" ;;
    *)
      echo "error: automatic JDK download is not supported on $(uname -m)." >&2
      return 1
      ;;
  esac

  if command -v curl >/dev/null 2>&1; then
    download() { curl -fsSL "$1" -o "$2"; }
  elif command -v wget >/dev/null 2>&1; then
    download() { wget -q "$1" -O "$2"; }
  else
    echo "error: curl or wget is required to download a JDK." >&2
    return 1
  fi

  url="https://api.adoptium.net/v3/binary/latest/21/ga/${os}/${arch}/jdk/hotspot/normal/eclipse"
  tmp_dir="$(mktemp -d)"
  archive="${tmp_dir}/jdk.tar.gz"

  echo "Java not found; downloading Temurin JDK 21 to ${LOCAL_JDK_DIR}" >&2
  if ! download "${url}" "${archive}"; then
    echo "error: failed to download a JDK from ${url}" >&2
    rm -rf "${tmp_dir}"
    return 1
  fi

  tar -xzf "${archive}" -C "${tmp_dir}"
  extracted="$(find "${tmp_dir}" -mindepth 1 -maxdepth 1 -type d -name 'jdk-*' -print -quit)"

  if [[ -z "${extracted}" ]]; then
    echo "error: downloaded JDK archive had an unexpected layout." >&2
    rm -rf "${tmp_dir}"
    return 1
  fi

  mkdir -p "$(dirname "${LOCAL_JDK_DIR}")"
  rm -rf "${LOCAL_JDK_DIR}"
  mv "${extracted}" "${LOCAL_JDK_DIR}"
  rm -rf "${tmp_dir}"
}

if ! command -v java >/dev/null 2>&1; then
  if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/java" ]]; then
    export PATH="${JAVA_HOME}/bin:${PATH}"
  elif [[ -x "${LOCAL_JDK_DIR}/bin/java" ]]; then
    export JAVA_HOME="${LOCAL_JDK_DIR}"
    export PATH="${JAVA_HOME}/bin:${PATH}"
  elif download_local_jdk; then
    export JAVA_HOME="${LOCAL_JDK_DIR}"
    export PATH="${JAVA_HOME}/bin:${PATH}"
  else
    echo "error: Java 11+ is required to run openapi-generator-cli." >&2
    echo "       Install a JDK or set JAVA_HOME, then re-run this script." >&2
    exit 1
  fi
fi

if [[ ! -f "${SPEC_FILE}" ]]; then
  echo "error: OpenAPI spec not found at ${SPEC_FILE}" >&2
  exit 1
fi

echo "Generating Angular client from ${SPEC_FILE}"
rm -rf "${OUTPUT_DIR}"

npx --yes "@openapitools/openapi-generator-cli@${OPENAPI_GENERATOR_CLI_VERSION}" generate \
  --input-spec "${SPEC_FILE}" \
  --generator-name typescript-angular \
  --output "${OUTPUT_DIR}" \
  --additional-properties "providedInRoot=true,useSingleRequestParameter=true,enumPropertyNaming=UPPERCASE,ngVersion=19.2.0" \
  --global-property "apiDocs=false,modelDocs=false,apiTests=false,modelTests=false"

# Files that only make sense when the generated package is published on its own.
rm -f "${OUTPUT_DIR}/git_push.sh" "${OUTPUT_DIR}/README.md"

echo "Generated client written to ${OUTPUT_DIR}"
