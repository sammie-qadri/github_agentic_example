---
name: review
description: "Pre-PR code review against project standards. Analyzes changed files for coding standards compliance, test coverage, documentation completeness, and anti-patterns. Generates a structured review report. Use when: preparing a PR, reviewing your own changes, or auditing code quality."
argument-hint: "Optional: base branch to diff against (defaults to 'main')"
---

# Pre-PR Code Review

Comprehensive review of changed files against batch-migration-example project standards.

## When to Use

- Before creating a Pull Request
- To self-review changes before pushing
- To audit code quality on a branch
- After a shard implementation to verify completeness

## Review Process

### Step 1: Identify Changed Files

```bash
git diff --name-only {base_branch}...HEAD
```

Default base: `main`. If an argument is provided, use that as the base branch.

Categorize changes:
- **Java source files** (new / modified) — under `src/main/java/`
- **Test files** (new / modified) — under `src/test/java/`
- **YAML configuration** — `application.yml`, `application-*.yml`
- **Documentation** — `.md` files under `.github/memory/`, `existing-mainframe/Documentation/`
- **Other** — anything else (pom.xml, scripts, etc.)

### Step 2: Per-File Standards Review

For each changed Java source file, check against §14 coding standards:

**Structure & Standards**
- No raw types (always parameterize generics)
- No unused imports
- No empty catch blocks (at minimum, log the exception)
- No `System.out` / `System.err`
- No `@Slf4j` / `log.info()` — use engine logger
- No `@Autowired` in processors/tasklets — use `ContextAwareClass.getBean()`
- No `@Bean Job` or `@Bean Step` — engine creates from YAML
- Method length ≤ 50 lines
- No magic numbers/strings — use `BatchConstants`
- JDBC resources closed in `finally`
- `entityManager.flush()` before `commit()`

**Component-Specific**
- **Processors:** `super.process(model)` called first, `uniqueKey`/`businessDate`/`processTS` set
- **Tasklets:** `RepeatStatus.FINISHED` returned, exceptions re-thrown, `con` for Connection
- **Models:** `@Data`, `@Entity`, `@Table`, UPPER_SNAKE_CASE column names, `@Transient` with `In` suffix

### Step 3: Test Coverage Review

For each new or modified source file, verify:
- Corresponding test file exists in the mirror path under `src/test/java/`
- Test class named `{ClassName}Test.java`
- Test uses JUnit 5 (`org.junit.jupiter`) — NOT JUnit 4
- Test uses `@ExtendWith(MockitoExtension.class)` — NOT `@SpringBootTest`
- Test covers: happy path, validation errors, filter conditions, edge cases
- `@Nested` inner classes used for behavior categories
- `@DisplayName` on test class and all methods
- Uses AAA pattern: Arrange → Act → Assert

### Step 4: YAML Configuration Review

If `application.yml` was modified:
- New/changed jobs have `jobName`, `jobDescription`, `stepType`, `channel`
- FQCNs in `processorClass` and `taskletClass` match actual class locations
- No hardcoded file paths (use `${bst.fileDirectory}`)
- No hardcoded bucket names (use `${bst.spos.*BucketName}`)
- `skipLimit` set for error tolerance
- Load jobs have `archiveDir` and `archiveRetentionDays`

### Step 5: Documentation Review

Check for required documentation updates:
- If migration components changed → `migration-status.md` must be updated (§0.1)
- If corrections/bugs occurred → `lessons.md` must have a new entry (§0)
- If architecture or behavior changed → relevant spec docs should be updated
- Cross-check migration-status.md section counts for consistency (§15 sums match §6/§7/§8/§10)

### Step 6: Security Review

- No secrets, credentials, or API keys in code or config
- No SQL injection vectors (use JPA criteria queries or parameterized stored procedures)
- No hardcoded URLs or connection strings
- Input validation at system boundaries
- No `--no-verify` or safety-bypass flags in scripts

## Output Format

```
## Code Review Report

### Summary
- **Files changed:** {count}
- **New files:** {count}
- **Lines added/removed:** +{added} / -{removed}
- **Test coverage:** {assessment}

---

### ❌ Errors (Block Merge)
1. [{file}]({path}#L{line}): {description}
2. ...

### ⚠️ Warnings (Should Fix)
1. [{file}]({path}#L{line}): {description}
2. ...

### 💡 Suggestions (Optional Improvements)
1. {description}

### ✅ Passing Checks
- {list of passed checks}

---

### Documentation Status
- [ ] migration-status.md updated (if applicable)
- [ ] lessons.md updated (if applicable)
- [ ] Spec docs updated (if applicable)

### Verdict
**{APPROVE / REQUEST CHANGES / NEEDS DISCUSSION}**

{Brief rationale for verdict}
```

## Integration

- Run `/review` before creating any Pull Request
- Combines the output of `/impl-check` with documentation and coverage analysis
- The `/push` skill recommends running `/review` first
