#!/usr/bin/env bash
# One-time setup for the FotoOwl testimonial pipeline (macOS Apple Silicon or Linux).
# Installs ffmpeg/node/python if missing (Homebrew on macOS), a Python venv, the engine's npm
# packages, and the models (~1.3 GB, cached in ~/.cache/fotoowl-testimonial/models).
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$SKILL/../../.." && pwd)"
MODELS="${FOTOOWL_MODELS:-$HOME/.cache/fotoowl-testimonial/models}"
VENV="$REPO/.venv"

say() { printf '\n\033[1m▸ %s\033[0m\n' "$*"; }

say "System tools"
if [[ "$(uname)" == "Darwin" ]]; then
  command -v brew >/dev/null || { echo "Homebrew is required: https://brew.sh"; exit 1; }
  for p in ffmpeg node python@3.12; do brew list "$p" >/dev/null 2>&1 || brew install "$p"; done
  PY="$(brew --prefix)/bin/python3.12"
else
  for b in ffmpeg node python3; do command -v $b >/dev/null || { echo "Please install $b"; exit 1; }; done
  PY=python3
fi
ffmpeg -hide_banner -filters 2>/dev/null | grep -q vidstabdetect || echo "⚠ ffmpeg has no vid.stab — stabilisation will be skipped"

say "Python venv → $VENV"
[[ -d "$VENV" ]] || "$PY" -m venv "$VENV"
"$VENV/bin/pip" install -q --upgrade pip
"$VENV/bin/pip" install -q numpy scipy pillow soundfile opencv-python onnxruntime sherpa-onnx faster-whisper

say "Engine packages"
(cd "$SKILL/engine" && npm install --silent)

say "Models → $MODELS"
mkdir -p "$MODELS"
gh="https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models"
get() { # url dest
  [[ -e "$2" ]] && return 0
  echo "  downloading $(basename "$2")"; curl -fL --retry 3 -o "$2.part" "$1" && mv "$2.part" "$2"
}
if [[ ! -d "$MODELS/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8" ]]; then
  get "$gh/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8.tar.bz2" "$MODELS/parakeet.tar.bz2"
  tar -xjf "$MODELS/parakeet.tar.bz2" -C "$MODELS" && rm "$MODELS/parakeet.tar.bz2"
fi
if [[ ! -d "$MODELS/sherpa-onnx-whisper-turbo" ]]; then
  get "$gh/sherpa-onnx-whisper-turbo.tar.bz2" "$MODELS/whisper.tar.bz2"
  tar -xjf "$MODELS/whisper.tar.bz2" -C "$MODELS" && rm "$MODELS/whisper.tar.bz2"
fi
get "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx" "$MODELS/yunet.onnx"
get "https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_mobilenetv3_fp32.onnx" "$MODELS/rvm.onnx"
# faster-whisper (multilingual word timings, used for Hindi/Marathi) downloads its own model on first use.

mkdir -p "$REPO/work" "$REPO/output"
say "Done. Run scripts with: $VENV/bin/python $SKILL/scripts/<step>.py"
