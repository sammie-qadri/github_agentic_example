---
name: impl-check
description: "Verify implementation against project coding standards and anti-patterns. Scans Java files for magic strings, @Autowired in processors/tasklets, System.out usage, wrong packages, missing constants, improper exception handling, and other violations from copilot-instructions.md §14. Use when: reviewing code, before committing, or after implementing a feature."
argument-hint: "Optional: file path or directory to check (defaults to all recently changed files)"
---

# Implementation Verification

Automated compliance check against batch-migration-example coding standards (copilot-instructions.md §14).

## When to Use

- After implementing a new component (processor, tasklet, model)
- Before committing changes
- During code review
- To audit existing code for standards compliance

## Scope Detection

If an argument is provided, check that specific file or directory.
If no argument, detect changed files:
```bash
git diff --name-only HEAD~1 -- "*.java"
git diff --cached --name-only -- "*.java"
```

Fall back to scanning all of `src/main/java/` if no recent changes are detected.

## Checks Performed

### 1. Anti-Pattern Detection

Scan Java source files for these violations:

| Anti-Pattern | How to Detect | Severity |
|-------------|---------------|----------|
| `@Autowired` in processor/tasklet | Search `@Autowired` in `batch/process/` and `batch/tasklet/` | **ERROR** |
| `System.out` or `System.err` | Search `System.out` or `System.err` in `src/main/` | **ERROR** |
| `@Slf4j` or SLF4J logging | Search `@Slf4j`, `log.info`, `log.debug`, `log.warn`, `log.error` in `src/main/` | **ERROR** |
| `@Bean` Job or Step | Search `@Bean` in `src/main/` and verify not creating Job/Step beans | **ERROR** |
| Magic strings/numbers | Review processor/tasklet logic for inline literals | **WARNING** |
| Empty catch blocks | Search `catch` blocks with empty or comment-only bodies | **ERROR** |
| Unused imports | Compile warnings or pattern-match unused imports | **WARNING** |
| Raw types | Search for unparameterized generic types (`List `, `Map `) | **WARNING** |

### 2. Package Boundary Verification

Verify all classes are in their required packages:

| Component | Required Package |
|-----------|-----------------|
| Processors | `com.example.bst.fit.batch.process` |
| Tasklets | `com.example.bst.fit.batch.tasklet` |
| Models | `com.example.bst.fit.model` |
| Constants | `com.example.bst.fit.batch.utils` |
| Config | `com.example.bst.fit.config` |
| REST clients | `com.example.bst.fit.batch.webclient` |

**Forbidden packages** (should not exist under `com.example.bst.fit`):
- `service/`
- `reader/`
- `writer/`
- `listener/`

### 3. Processor Compliance

For each class extending `BstItemProcessor`:
- [ ] Calls `super.process(model)` as the first operation
- [ ] Sets `uniqueKey` on output model
- [ ] Sets `businessDate` via `getBusinessDateAsSqlDate()`
- [ ] Sets `processTS` with `ZoneId.of(BatchConstants.US_EASTERN_ZONE)`
- [ ] Uses `ContextAwareClass.getBean()` for Spring bean access (NOT `@Autowired`)
- [ ] Uses engine logger `getLogger().builder(...)` (NOT SLF4J or System.out)
- [ ] Wraps validation logic in try-catch where appropriate
- [ ] All methods ≤ 50 lines (extract private helpers if longer)

### 4. Tasklet Compliance

For each class extending `BstTasklet`:
- [ ] Returns `RepeatStatus.FINISHED`
- [ ] Re-throws exceptions from `execute()` (no swallowing)
- [ ] Closes JDBC resources (`Connection`, `CallableStatement`, `ResultSet`) in `finally` with null checks
- [ ] Uses `con` for Connection variable name (project convention)
- [ ] Checks `DataSource` for null before use
- [ ] Uses constants from `BatchConstants` for stored procedure names
- [ ] Uses engine logger for all logging
- [ ] `EntityManager` lifecycle managed in `beforeStep()`/`afterStep()` if used

### 5. Model/Entity Compliance

For each class with `@Entity`:
- [ ] Has `@Data` annotation (Lombok) — no manual getters/setters
- [ ] Has `@Entity` and `@Table` annotations
- [ ] `@Entity(name = ...)` matches the table name
- [ ] Column names use UPPER_SNAKE_CASE in `@Column(name = "...")`
- [ ] `@Transient` fields used for raw file input (suffixed with `In`)
- [ ] `@Id` field present (UNIQUE_KEY for staging, natural key for views)
- [ ] Implements `Serializable` with `@IdClass` for composite keys
- [ ] `@NamedQuery` present if entity is used for DB→NAS unload

### 6. YAML Job Configuration Compliance

For each job under `bst.bstJobs` in `application.yml`:
- [ ] `jobName` is unique across all jobs and uses camelCase
- [ ] `jobDescription` is present and descriptive
- [ ] `channel.input` and `channel.output` are set (even for TASKLET jobs)
- [ ] `stepType` is exactly `CHUNK` or `TASKLET` (case-sensitive)
- [ ] CHUNK jobs specify `processor.processorClass` with correct FQCN
- [ ] File paths use `${bst.fileDirectory}` (not hardcoded)
- [ ] SPOS buckets use `${bst.spos.*BucketName}` (not hardcoded)
- [ ] `skipLimit` is set to define error tolerance
- [ ] Load jobs have `archiveDir` and `archiveRetentionDays`

### 7. Constants Compliance

Check `BatchConstants.java`:
- [ ] No magic strings or numbers in processor/tasklet code (all in constants)
- [ ] All constants use `UPPER_SNAKE_CASE` naming
- [ ] String constants are typed as `String` (not `Object`)
- [ ] Private constructor throws `IllegalStateException("BatchConstants is a Utility class")`
- [ ] Constructor guard message matches the actual class name (common copy-paste trap)
- [ ] Stored procedure names are defined as constants

### 8. Test Compliance

For each test class:
- [ ] Uses JUnit 5 (`org.junit.jupiter`) — no JUnit 4 (`org.junit`)
- [ ] Uses `@ExtendWith(MockitoExtension.class)` — no `@SpringBootTest`
- [ ] Uses `@Spy` on class under test, stubs inherited engine methods
- [ ] Has `@DisplayName` on test class and each method
- [ ] Uses `@Nested` inner classes for behavior categories
- [ ] Follows AAA pattern: Arrange → Act → Assert
- [ ] Mirrors main source tree in `src/test/java/`

## Output Format

```
## Implementation Check Results

### ❌ Errors (must fix before commit)
1. {file}:{line}: {violation description}
2. ...

### ⚠️ Warnings (should fix)
1. {file}:{line}: {warning description}
2. ...

### ✅ Passing Checks
- Package boundaries: All classes in correct packages
- Anti-patterns: No violations found
- {N} processors checked — all compliant
- {N} tasklets checked — all compliant
- {N} models checked — all compliant
- {N} test classes checked — all compliant

### Summary
{X} errors, {Y} warnings across {Z} files checked
```

## Integration

- Invoked automatically as part of `/review`
- Should be run before `/commit`
