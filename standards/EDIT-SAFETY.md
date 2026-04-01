# EDIT-SAFETY.md

## Purpose
Define the exact protocol for safe, verifiable edits to files. Prevents silent failures, ensures changes are traceable, and catches edge cases in file modification.

---

## Pre-Edit Protocol

### 1. Re-Read the Target File
- **Timing**: Immediately before the edit (within the same tool call batch if possible)
- **Scope**: Read the section containing your target + 5 lines of context on each side (if available)
- **Exception**: If you wrote the file in the same turn (<2 min ago) and have not context-swapped, you may skip the re-read
- **Purpose**: Catch stale context, intervening edits, truncation, or misremembered line numbers

### 2. Confirm Target Text Exists
- Exact match the text you plan to replace
- Include sufficient context (5+ lines) to make match unambiguous
- If `oldText` appears multiple times: Use unique context to target exactly one match
- If uncertain which occurrence: Ask operator rather than guessing

### 3. Verify No Overlaps
- If making multiple edits: Ensure `oldText` blocks do not overlap
- If blocks are nearby: Consider merging into single edit to avoid ordering issues
- If editing same file 3+ times: Plan consolidated edits or use explicit sequencing

---

## Edit Execution

### Single-Edit Mode (One Change)
Use `oldText` + `newText` for straightforward replacements.

**Example:**
```
oldText: "const API_TIMEOUT = 5000;"
newText: "const API_TIMEOUT = 10000;"
```

**Constraints:**
- `oldText` must match exactly (whitespace, case, everything)
- `oldText` must be unique in the file (or have sufficient unique context)
- `newText` is the complete replacement (not a diff, not a patch)

### Multi-Edit Mode (2+ Changes, Same File)
Use `edits` array for disjoint changes to the same file.

**Example:**
```json
"edits": [
  {
    "oldText": "import { foo } from './foo'",
    "newText": "import { foo, bar } from './foo'"
  },
  {
    "oldText": "function main() {\n  foo();\n}",
    "newText": "function main() {\n  foo();\n  bar();\n}"
  }
]
```

**Constraints:**
- Each `oldText` must be unique and non-overlapping
- Each `oldText` must match exactly
- Order of edits does not matter (they are matched against original, not sequentially applied)
- Maximum recommended: 5 edits per call (keep related changes together)

### Avoiding Unsafe Replacements

**❌ Too Broad:**
```
oldText: "function test"
newText: "function test"
```
Will match many functions. Use unique context.

**✅ Safe:**
```
oldText: "function test() {\n  return 'hello';\n}"
newText: "function test() {\n  return 'world';\n}"
```

**❌ Too Fragile:**
```
oldText: "const x = 1;"
newText: "const x = 2;"
```
If the line changed elsewhere, match fails silently. Use context.

**✅ Robust:**
```
oldText: "const x = 1;\nconst y = 2;"
newText: "const x = 1;\nconst y = 3;"
```

---

## Post-Edit Verification

### 1. Re-Read the Modified Section
- Use `offset` + `limit` to read the exact lines you edited
- Confirm the new text is in place
- Confirm the old text is gone
- Do this immediately after the edit (same tool call batch)

**Example:**
```
Read the file with offset=120, limit=20 to verify lines 120–140
```

### 2. Check for Silent Mismatches
- If re-read shows unexpected content:
  - **Do not assume success**
  - Report the mismatch
  - Attempt a corrective edit or escalate
  - Never claim "done" if verification failed

### 3. Diff Reporting (Important Changes)
- For critical changes (configs, logic, security), include before/after in working message
- Example:
  ```
  Before: const API_TIMEOUT = 5000;
  After:  const API_TIMEOUT = 10000;
  ```

---

## Partial Edits (Chunk-Based Changes)

### When to Chunk
- File is very large (>3000 lines)
- Target change is in a specific section (e.g., "update the test suite")
- You need to understand the context before editing

### How to Chunk
1. **Read** the relevant section with offset/limit
2. **Identify** all locations that need changes
3. **Plan** the edit (list all oldText/newText pairs)
4. **Execute** with edits array (all at once)
5. **Verify** by re-reading the same section

### Example: Large Config File
```
// Read lines 1–50 to understand structure
// Read lines 100–150 to find targets
// Build edit list: [edit1, edit2, edit3]
// Execute all at once
// Re-read lines 100–150 to verify
```

---

## Silent Edit Mismatch Response

### Scenario: Edit Appears to Fail
- You issued the edit, got a successful response, but re-read shows old text still there

### Immediate Actions
1. **Confirm the re-read is accurate**: Did you read the right line numbers?
2. **Check if text was subtly different**: Whitespace, case, hidden characters?
3. **Consider if edit was actually applied**: Sometimes context window lag causes stale re-reads

### Recovery Options
1. **Re-read to confirm mismatch** (not your imagination)
2. **Attempt corrective edit** with refined `oldText` (add more context, check for hidden chars)
3. **If still failing**: Report the failure to operator with exact evidence (the oldText you tried, what actually appears)
4. **Never claim success** if verification fails

### Prevention
- Always re-read immediately after editing
- Use unique context in `oldText` to avoid ambiguity
- For large files, use offset/limit to target exact section

---

## Handling Concurrent Edits

### Scenario: Another Agent Modified the File
- You re-read, the file is different from what you expected
- Your edit targets may no longer exist or be in wrong place

### Response
1. **Stop editing**
2. **Re-read the entire affected section** to understand new state
3. **Decide**: Is the other agent's change compatible with yours?
4. **If compatible**: Adjust `oldText` to match new state and retry
5. **If conflicting**: Escalate to Governor for merge strategy

---

## Commit Protocol After Edits

After a phase completes with multiple edits:
1. **Verify all files** with final read-through
2. **Summarize changes** (which files, what changed)
3. **Confirm rollback plan** (operator knows how to revert)
4. **Document** in phase completion summary

If using git: commit with clear message referencing the phase and operator approval.

---

## Edit Safety Checklist

- [ ] Re-read file before editing (unless exception applies)
- [ ] Confirm `oldText` exists exactly as written
- [ ] Confirm `oldText` is unique (or has unique context)
- [ ] Confirm no edit overlaps with others
- [ ] Execute edit (single or multi-edit mode)
- [ ] Re-read modified section immediately
- [ ] Confirm changes applied correctly
- [ ] If verification fails: Report and recover
- [ ] Document edit in completion summary

---

## Common Mistakes

**Mistake**: Editing without re-reading
→ **Fix**: Always re-read immediately before

**Mistake**: Using partial `oldText` that matches multiple locations
→ **Fix**: Add context lines to make unique

**Mistake**: Assuming edit succeeded without verifying
→ **Fix**: Re-read the modified section

**Mistake**: Continuing work after edit verification failed
→ **Fix**: Stop, report, recover or escalate

**Mistake**: Editing same file 5+ times sequentially
→ **Fix**: Batch into single multi-edit call

---

## Integration with ENGINEERING-EXECUTION.md

This standard is part of the "Verify-After-Edit Discipline" defined in ENGINEERING-EXECUTION.md. Every edit must be verified before proceeding.

Non-negotiable for all file modifications.
