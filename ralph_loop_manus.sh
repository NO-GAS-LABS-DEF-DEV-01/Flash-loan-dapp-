#!/usr/bin/env bash
# ============================================
# RALPH LOOP for Manus (Wiggum-Style Systems)
# Completion is empirical. Filesystem is truth.
# "I'm helping!" (but only if tests say so)
# ============================================
set -euo pipefail

# --- Usage ---
#   ./ralph_loop_manus.sh "OBJECTIVE"
# Env:
#   MAX_ITERS=60 SLEEP_SECS=0 MANUS_CMD="manus" CHECK_CMD="npm test" ./ralph_loop_manus.sh "Do the thing"
OBJECTIVE="${1:-Do the thing}"
ROOT="${ROOT:-$PWD}"
WORK="${WORK:-$ROOT/.ralph}"
LOG="${LOG:-$WORK/logs}"
STATE="${STATE:-$WORK/state}"
MAX_ITERS="${MAX_ITERS:-50}"
SLEEP_SECS="${SLEEP_SECS:-0}"

# How we call Manus (placeholder). Must read PROMPT file and apply edits to filesystem.
# Replace with your real Manus invocation (CLI/API wrapper) that can *edit files*.
MANUS_CMD="${MANUS_CMD:-manus}"

# Empirical check command (override per project). Must be deterministic & cheap.
# Examples: "npm test --silent", "pytest -q", "make test", "./scripts/ci.sh"
CHECK_CMD="${CHECK_CMD:-:}"

# Exact completion signal Manus is allowed to emit ONLY when checks are green:
DONE_SIGNAL="COMPLETION_SIGNAL:OK"

mkdir -p "$LOG" "$STATE"

ts(){ date -u +"%Y-%m-%dT%H:%M:%SZ"; }
say(){ printf "[%s] %s\n" "$(ts)" "$*" | tee -a "$LOG/run.log" >/dev/null; }

# --------- RALPH DIRECTIVES (NON-NEGOTIABLE) ----------
# 1) COMPLETION IS EMPIRICAL, NOT CONVERSATIONAL
# 2) FILESYSTEM SUPREMACY
# 3) ITERATION OVER PROMPT PERFECTION
# 4) EXIT IS A PRIVILEGE (only on DONE_SIGNAL + green checks)
# ------------------------------------------------------

# ---- Snapshot "truth" each loop (cheap, repeatable) ----
snapshot_truth() {
  local out="$LOG/truth_snapshot.txt"
  {
    echo "### TRUTH SNAPSHOT $(ts)"
    echo "PWD: $ROOT"
    echo
    echo "GIT STATUS (porcelain):"
    git -C "$ROOT" status --porcelain=v1 2>/dev/null || echo "(no git)"
    echo
    echo "RECENT FILES (top 200):"
    find "$ROOT" -maxdepth 3 -type f \
      ! -path "*/.git/*" ! -path "*/node_modules/*" ! -path "*/.ralph/*" \
      -printf "%TY-%Tm-%Td %TH:%TM %p\n" 2>/dev/null | sort -r | head -n 200
    echo
  } > "$out"
}

# ---- Run empirical checks and capture output ----
run_checks() {
  local out="$LOG/checks.log"
  {
    echo "### CHECKS $(ts)"
    echo "CMD: $CHECK_CMD"
    echo
    bash -lc "$CHECK_CMD"
    echo
    echo "CHECKS_STATUS:GREEN"
  } > "$out" 2>&1 || {
    echo "CHECKS_STATUS:RED" >> "$out"
    return 1
  }
}

# ---- Decide "done" only if checks are green AND Manus claims DONE_SIGNAL ----
is_done() {
  grep -q "CHECKS_STATUS:GREEN" "$LOG/checks.log" 2>/dev/null || return 1
  grep -q "$DONE_SIGNAL" "$LOG/last_response.txt" 2>/dev/null || return 1
  return 0
}

# ---- STOP-HOOK: keep the model from yapping ----
# If Manus output contains "CONVERSATIONAL ASIDE", we treat it as non-authoritative noise.
strip_conversational_aside() {
  local in="$1"
  local out="$2"
  # Drop everything from a STOP-HOOK marker onward (if present).
  awk '
    BEGIN{stop=0}
    /CONVERSATIONAL ASIDE \(STOP-HOOK\)/{stop=1}
    stop==0{print}
  ' "$in" > "$out"
}

# ---- Prompt construction (truth + last failures + next action) ----
write_prompt() {
  local iter="$1"
  local prompt="$LOG/prompt_${iter}.txt"

  # Prior failures are fuel.
  local last_fail="$STATE/last_fail.txt"
  [ -f "$last_fail" ] || : > "$last_fail"

  cat > "$prompt" <<EOF
SYSTEM:
You are Manus running inside the RALPH LOOP.
Non-negotiables:
- COMPLETION IS EMPIRICAL: You may only output "$DONE_SIGNAL" if the project checks will pass.
- FILESYSTEM SUPREMACY: Treat repository files + logs as truth, not your memory.
- ITERATION OVER PROMPT PERFECTION: If uncertain, do the smallest reversible change.
- EXIT IS A PRIVILEGE: Otherwise output "$DONE_SIGNAL:NO".

OBJECTIVE:
$OBJECTIVE

TRUTH SOURCES:
- $LOG/truth_snapshot.txt
- $LOG/checks.log
- $STATE/last_fail.txt

TASK (do all):
1) Diagnose why checks are RED or progress is blocked.
2) Choose ONE smallest executable action that increases done-ness.
3) Apply changes to filesystem (code/tests/config/docs). Be concrete.
4) Update or create any missing artifacts (tests, scripts, readme, changelog).
5) Provide commands you ran (or instruct which to run next) AND expected outputs.
6) Output EXACTLY ONE completion line at end:
   - "$DONE_SIGNAL"  (only if checks will pass)
   - "$DONE_SIGNAL:NO" (default)

OUTPUT FORMAT (STRICT):
PLAN:
ACTIONS_TAKEN:
FILES_CHANGED:
COMMANDS_RUN:
OBSERVATIONS:
NEXT:
COMPLETION_LINE:
EOF
}

# ---- Call Manus (placeholder adapter) ----
call_manus() {
  local iter="$1"
  local prompt="$LOG/prompt_${iter}.txt"
  local raw="$LOG/response_raw_${iter}.txt"
  local clean="$LOG/response_${iter}.txt"

  # Replace this block with your real Manus runner.
  # It must (A) read the prompt, (B) edit files, (C) write response.
  # Example:
  #   "$MANUS_CMD" --prompt-file "$prompt" --apply --out "$raw"
  #
  # For now, we just echo prompt to raw to show wiring.
  if command -v "$MANUS_CMD" >/dev/null 2>&1; then
    # If Manus CLI exists, try a generic call:
    # Adjust flags to your actual Manus interface.
    "$MANUS_CMD" "$prompt" > "$raw" 2>&1 || true
  else
    {
      echo "PLAN:"
      echo "- (placeholder) No Manus CLI found; replace MANUS_CMD call."
      echo "ACTIONS_TAKEN:"
      echo "- None"
      echo "FILES_CHANGED:"
      echo "- None"
      echo "COMMANDS_RUN:"
      echo "- None"
      echo "OBSERVATIONS:"
      echo "- MANUS_CMD not available."
      echo "NEXT:"
      echo "- Set MANUS_CMD to your Manus runner."
      echo "COMPLETION_LINE:"
      echo "$DONE_SIGNAL:NO"
      echo
      echo "CONVERSATIONAL ASIDE (STOP-HOOK)"
      echo "I choo-choo-choose you."
    } > "$raw"
  fi

  strip_conversational_aside "$raw" "$clean"
  ln -sf "$(basename "$clean")" "$LOG/last_response.txt"
}

# ---- Persist last failure slice for next iteration ----
update_last_fail() {
  local out="$STATE/last_fail.txt"
  {
    echo "### LAST_FAIL $(ts)"
    echo "--- checks ---"
    tail -n 120 "$LOG/checks.log" 2>/dev/null || true
    echo "--- manus ---"
    tail -n 200 "$LOG/last_response.txt" 2>/dev/null || true
  } > "$out"
}

# ===================== MAIN LOOP ======================
say "RALPH_LOOP_START objective: $OBJECTIVE"
say "MAX_ITERS=$MAX_ITERS CHECK_CMD='$CHECK_CMD' MANUS_CMD='$MANUS_CMD'"

for ((i=1; i<=MAX_ITERS; i++)); do
  say "ITERATION $i/$MAX_ITERS"

  snapshot_truth

  # Always run checks first: truth before talk.
  if run_checks; then
    say "CHECKS: GREEN"
  else
    say "CHECKS: RED"
  fi

  write_prompt "$i"
  call_manus "$i"
  update_last_fail

  if is_done; then
    say "DONE: empirical checks GREEN + Manus emitted $DONE_SIGNAL"
    echo "$DONE_SIGNAL"
    exit 0
  fi

  # If checks are already GREEN, force Manus to produce the exact signal next iteration (no drift).
  if grep -q "CHECKS_STATUS:GREEN" "$LOG/checks.log"; then
    say "Checks are GREEN but missing $DONE_SIGNAL — loop continues (EXIT is a privilege)."
  fi

  [ "$SLEEP_SECS" -gt 0 ] && sleep "$SLEEP_SECS"
done

say "STOP: MAX_ITERS reached without empirical completion."
echo "$DONE_SIGNAL:NO"
exit 1