#!/bin/bash
# Ralph Loop — tool-agnostic autonomous AI coding loop
# Runs a fresh AI agent instance per iteration until all tasks are complete.
#
# Usage: ./loop.sh [options] [max_iterations]
#
# Options:
#   --tool <claude|codex|kiro>   AI tool to use (default: claude)
#   --mode <plan|build>          Prompt mode (default: build)
#   --model <model_id>           Model override (tool-specific)
#   -h, --help                   Show this help
#
# Examples:
#   ./loop.sh                          # claude, build mode, 10 iterations
#   ./loop.sh --tool codex 20          # codex, build mode, 20 iterations
#   ./loop.sh --mode plan 3            # claude, plan mode, 3 iterations
#   ./loop.sh --tool kiro --mode build # kiro, build mode, 10 iterations

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────────
TOOL="claude"
MODE="build"
MODEL=""
MAX_ITERATIONS=10
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
PLAN_FILE="$SCRIPT_DIR/IMPLEMENTATION_PLAN.md"
ARCHIVE_DIR="$SCRIPT_DIR/archive"

# ── Parse arguments ───────────────────────────────────────────────────
show_help() {
  sed -n '2,/^$/s/^# \?//p' "$0"
  exit 0
}

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)    show_help ;;
    --tool)       TOOL="$2";  shift 2 ;;
    --tool=*)     TOOL="${1#*=}"; shift ;;
    --mode)       MODE="$2";  shift 2 ;;
    --mode=*)     MODE="${1#*=}"; shift ;;
    --model)      MODEL="$2"; shift 2 ;;
    --model=*)    MODEL="${1#*=}"; shift ;;
    *)
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        MAX_ITERATIONS="$1"
      else
        echo "Unknown option: $1" >&2
        exit 1
      fi
      shift ;;
  esac
done

# ── Validate ──────────────────────────────────────────────────────────
if [[ "$TOOL" != "claude" && "$TOOL" != "codex" && "$TOOL" != "kiro" ]]; then
  echo "Error: --tool must be claude, codex, or kiro (got '$TOOL')" >&2
  exit 1
fi
if [[ "$MODE" != "plan" && "$MODE" != "build" && "$MODE" != "specs" ]]; then
  echo "Error: --mode must be specs, plan, or build (got '$MODE')" >&2
  exit 1
fi

PROMPT_FILE="$SCRIPT_DIR/PROMPT_${MODE}.md"
if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "Error: prompt file not found: $PROMPT_FILE" >&2
  exit 1
fi

# ── Initialize progress log ──────────────────────────────────────────
if [[ ! -f "$PROGRESS_FILE" ]]; then
  {
    echo "# Ralph Progress Log"
    echo "Started: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "---"
  } > "$PROGRESS_FILE"
fi

# ── Build tool command ────────────────────────────────────────────────
build_cmd() {
  local prompt_file="$1"

  case "$TOOL" in
    claude)
      local cmd="claude --print --dangerously-skip-permissions --verbose"
      [[ -n "$MODEL" ]] && cmd+=" --model $MODEL"
      echo "cat '$prompt_file' | $cmd"
      ;;
    codex)
      local cmd="codex --full-auto"
      [[ -n "$MODEL" ]] && cmd+=" --model $MODEL"
      # codex reads prompt from stdin
      echo "cat '$prompt_file' | $cmd"
      ;;
    kiro)
      local cmd="kiro-cli --dangerously-skip-permissions"
      [[ -n "$MODEL" ]] && cmd+=" --model $MODEL"
      echo "cat '$prompt_file' | $cmd"
      ;;
  esac
}

# ── Archive previous run ─────────────────────────────────────────────
archive_if_needed() {
  local branch_file="$SCRIPT_DIR/.last-branch"
  local current_branch
  current_branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"

  if [[ -f "$branch_file" ]]; then
    local last_branch
    last_branch="$(cat "$branch_file")"
    if [[ -n "$current_branch" && -n "$last_branch" && "$current_branch" != "$last_branch" ]]; then
      local date_stamp folder_name archive_folder
      date_stamp="$(date +%Y-%m-%d)"
      folder_name="$(echo "$last_branch" | sed 's|^ralph/||')"
      archive_folder="$ARCHIVE_DIR/$date_stamp-$folder_name"

      echo "Archiving previous run ($last_branch) → $archive_folder"
      mkdir -p "$archive_folder"
      [[ -f "$PROGRESS_FILE" ]] && cp "$PROGRESS_FILE" "$archive_folder/"
      [[ -f "$PLAN_FILE" ]]     && cp "$PLAN_FILE" "$archive_folder/"

      # Reset progress for new run
      {
        echo "# Ralph Progress Log"
        echo "Started: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
        echo "---"
      } > "$PROGRESS_FILE"
    fi
  fi

  [[ -n "$current_branch" ]] && echo "$current_branch" > "$branch_file"
}

archive_if_needed

# ── Main loop ─────────────────────────────────────────────────────────
STOP_TAG="<ralph>COMPLETE</ralph>"

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Ralph Loop                                                  ║"
echo "║  Tool: $TOOL | Mode: $MODE | Max: $MAX_ITERATIONS iterations$(printf '%*s' $((14 - ${#TOOL} - ${#MODE} - ${#MAX_ITERATIONS})) '')║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

CMD="$(build_cmd "$PROMPT_FILE")"

for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo "┌───────────────────────────────────────────────────────────────┐"
  echo "│  Iteration $i / $MAX_ITERATIONS — $(date +%H:%M:%S)$(printf '%*s' $((42 - ${#i} - ${#MAX_ITERATIONS})) '')│"
  echo "└───────────────────────────────────────────────────────────────┘"

  OUTPUT=$(eval "$CMD" 2>&1 | tee /dev/stderr) || true

  if echo "$OUTPUT" | grep -q "$STOP_TAG"; then
    echo ""
    echo "✓ Ralph completed all tasks at iteration $i."
    exit 0
  fi

  echo ""
  echo "Iteration $i complete. Continuing..."
  echo ""
  sleep 2
done

echo ""
echo "⚠ Ralph reached max iterations ($MAX_ITERATIONS) without completing."
echo "Check $PROGRESS_FILE and $PLAN_FILE for status."
exit 1
