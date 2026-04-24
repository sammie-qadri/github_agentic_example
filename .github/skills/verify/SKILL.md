---
name: verify
description: "Build verification loop (Ralph Loop). Runs mvn clean compile, mvn clean test, and mvn clean verify in sequence. Reports compilation status, test results, and JaCoCo coverage. Use when: validating code changes, running the full build cycle, checking test coverage, or after implementing a feature."
argument-hint: "Optional: specific test class name (e.g., 'CustomerDataLoadProcessorTest') or 'all' for full suite"
---

# Build Verification Loop (Ralph Loop)

Run the full Red-Green-Refactor verification cycle: compile → test → coverage.

## When to Use

- After implementing any code changes
- Before committing (pre-commit check)
- When debugging test failures
- To check JaCoCo coverage meets the ≥80% threshold
- During TDD iterations (quick mode with specific test class)

## Execution Steps

### Step 1: Clean Compile

```bash
mvn clean compile -DskipTests
```

**Pass criteria:** Zero compilation errors.
**On failure:** Report the compilation errors with file paths and line numbers. Do NOT proceed to testing.

### Step 2: Run Tests

If an argument is provided (specific test class):
```bash
mvn test -Dtest={TestClassName}
```

If no argument or `all`:
```bash
mvn clean test
```

**Pass criteria:** All tests pass (0 failures, 0 errors).
**On failure:** Report failing tests with:
- Test class and method name
- Expected vs actual values
- Stack trace summary (first meaningful frame)
- Suggested fix if the cause is obvious

### Step 3: Coverage Verification

```bash
mvn clean verify
```

Then check the JaCoCo report:
- Report location: `target/site/jacoco/index.html`
- **Threshold:** ≥80% line coverage on new/changed code
- Parse the report and summarize coverage by package

### Step 4: Results Summary

Report in this format:
```
## Verification Results

| Check          | Status | Details                    |
|----------------|--------|----------------------------|
| Compilation    | ✅/❌  | {error count or clean}     |
| Tests          | ✅/❌  | {pass}/{fail}/{skip} tests |
| Coverage       | ✅/❌  | {%} line coverage          |

### Failures (if any)
- {details per failure}
```

## Quick Mode (TDD Iterations)

For rapid Red-Green iteration during TDD, run only Steps 1-2 with a specific test class:
```bash
mvn clean test -Dtest={TestClassName}
```

This skips the full suite and coverage report for speed.

## Integration with Other Skills

- Run `/verify` before `/commit` to ensure code is clean
- Run `/verify all` before `/push` to ensure the full suite passes
- The `/commit` and `/push` skills invoke verification checks automatically
- During `/convert-job1` or `/convert-job2` shard execution, verification is Phase 3
