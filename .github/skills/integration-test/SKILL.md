---
name: integration-test
description: "Generate integration tests for a converted mainframe job. Creates H2 schema, seed data, a Spring Boot integration test class with TestWatcher report generation, and optionally a PowerShell orchestration script. Use when: all unit-tested shards for a job are complete and you need end-to-end validation."
argument-hint: "Job identifier (e.g., 'JOB001', 'JOB002') and optional test scope ('full' or 'tasklets-only')"
---

# Integration Test Generator

Generate a complete integration test suite for a converted mainframe job, including H2 schema, seed data, the test class, and a markdown report generator.

## When to Use

- After all shards for a job are DONE (all unit tests passing)
- As the final phase of `/convert-job`
- To add integration tests to an already-converted job
- To regenerate integration tests after model changes

## Prerequisites

- All models (entities) for the job must be implemented and compiling
- All processors and tasklets must have passing unit tests
- `application.yml` must have all YAML job descriptors for the job
- The project must build cleanly: `mvn clean compile`

## Reference Implementations

Two integration tests already exist and serve as the pattern to follow:

| Test | Location | Pattern |
|------|----------|---------|
| `Job001IntegrationTest` | `src/test/java/com/example/bst/fit/Job001IntegrationTest.java` | Engine-managed job launch + direct tasklet spy testing |
| `Job002IntegrationTest` | `src/test/java/com/example/bst/fit/batch/tasklet/Job002IntegrationTest.java` | Tasklet-focused with H2 + entity validation |

## Execution Phases

### Phase 1: Inventory

Delegate to `@explorer`:
- List all entities under `com.example.bst.fit.model` that belong to this job
- List all processors under `com.example.bst.fit.batch.process` for this job
- List all tasklets under `com.example.bst.fit.batch.tasklet` for this job
- Read `application.yml` to identify all YAML jobs for this job
- Read `migration-status.md` to get the COBOL→Java mapping for the coverage matrix
- Read existing integration tests to understand the pattern

### Phase 2: H2 Schema Generation

Create `src/test/resources/h2/schema-{job-id}.sql`:

For each entity with `@Table`:
```sql
-- Schema for {TABLE_NAME}
-- Source: {EntityClassName}.java
CREATE TABLE IF NOT EXISTS {SCHEMA}.{TABLE_NAME} (
    {COLUMN_NAME} {H2_TYPE} {NULL_CONSTRAINT},
    ...
);
```

**Type Mapping:**

| Java Type | H2 Type |
|-----------|---------|
| `String` | `VARCHAR({length})` — derive from `@Column(length=...)` or default 255 |
| `Integer` | `INT` |
| `Long` | `BIGINT` |
| `BigDecimal` | `DECIMAL(precision, scale)` — derive from `@Column` |
| `Date` (java.sql) | `DATE` |
| `Timestamp` | `TIMESTAMP` |
| `Double` | `DOUBLE` |

**Schema prefix:** Use `SAMS` as the default schema (matching production SQL Server). Create schema if not exists:
```sql
CREATE SCHEMA IF NOT EXISTS SAMS;
```

**Important H2 notes (from lessons.md):**
- Do NOT use `MODE=MSSQLServer` unless a specific SQL Server dialect feature is required (it breaks `LIMIT` keyword used by Hibernate)
- Cross-check columns referenced by SQL constants in `BatchConstants` — entities may be missing columns that queries need
- Use `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` for `PROCESS_TS` columns

### Phase 3: Seed Data Generation

Create `src/test/resources/h2/data-{job-id}.sql`:

Generate INSERT statements that represent:
1. **Happy path data** — Valid records that exercise the main processing flow
2. **Edge case data** — Records that trigger filters, validations, and skip conditions
3. **Reference data** — Lookup table records needed for processors/tasklets to function

```sql
-- Seed data for {JOB-ID} integration tests
-- Happy path: enrolled master with sub-accounts
INSERT INTO SAMS.{TABLE_NAME} ({columns}) VALUES ({values});
...

-- Edge case: unenrolled master (should be filtered)
INSERT INTO SAMS.{TABLE_NAME} ({columns}) VALUES ({values});
...
```

**Data design principles:**
- Each test scenario should be traceable to a COBOL processing rule
- Use realistic but fake account IDs (never real data)
- Include enough records to exercise pagination/chunking (≥ chunkSize records for CHUNK jobs)
- Include boundary values (nulls, empty strings, max-length, leading zeros)

### Phase 4: Integration Test Class

Create `src/test/java/com/example/bst/fit/{JobId}IntegrationTest.java` (or in the appropriate package).

**Class structure following the reference pattern:**

```java
package com.example.bst.fit;

// Standard imports (see reference implementations)

@SpringBootTest(args = "--jobName=testJob")
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Sql(scripts = {"/h2/schema-{job-id}.sql", "/h2/data-{job-id}.sql"},
     config = @SqlConfig(transactionMode = SqlConfig.TransactionMode.ISOLATED),
     executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class {JobId}IntegrationTest {

    @Autowired private ApplicationContext applicationContext;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired @Qualifier("dbOneEntityManagerFactory")
    private EntityManagerFactory entityManagerFactory;

    private static final Date BUSINESS_DATE = Date.valueOf("2026-03-25");
    
    // ── Report generation (TestWatcher pattern) ──────────────
    private final List<String[]> testResults = new ArrayList<>();
    private long suiteStartMs;

    @RegisterExtension
    TestWatcher reportWatcher = new TestWatcher() {
        @Override public void testSuccessful(ExtensionContext ctx) {
            testResults.add(new String[]{ctx.getDisplayName(), "PASS", ""});
        }
        @Override public void testFailed(ExtensionContext ctx, Throwable cause) {
            testResults.add(new String[]{ctx.getDisplayName(), "FAIL", cause.getMessage()});
        }
        @Override public void testAborted(ExtensionContext ctx, Throwable cause) {
            testResults.add(new String[]{ctx.getDisplayName(), "ABORTED",
                cause != null ? cause.getMessage() : ""});
        }
    };
    // NOTE: Method names are testSuccessful/testFailed/testAborted
    //       NOT succeeded/failed/aborted (lessons.md 2026-03-26)

    @BeforeAll void setUp() throws Exception {
        suiteStartMs = System.currentTimeMillis();
        // H2 DataSource, EntityManager wiring
    }

    // ── Test methods (@Order annotation for execution sequence) ──

    @Test @Order(100) @DisplayName("Schema and seed data loaded")
    void schemaReady() { /* verify tables exist and seed data present */ }

    // For each tasklet: spy instance + verify against H2 data
    @Test @Order(200) @DisplayName("{TaskletName}: happy path")
    void taskletHappyPath() throws Exception {
        // Create spy, wire to real H2 DataSource, execute, verify DB state
    }

    // For each processor: create instance, process seed data, verify output
    @Test @Order(300) @DisplayName("{ProcessorName}: valid record enrichment")
    void processorValidRecord() throws Exception {
        // Create spy, stub engine methods, process, assert enrichment
    }

    @AfterAll void tearDownAndGenerateReport() throws Exception {
        try { writeReport(); }
        catch (Exception e) { System.err.println("Report gen failed: " + e.getMessage()); }
        // Close EntityManagerFactory, shutdown H2
    }

    // ── Report generation methods ──
    // writeReport(), readClasspathResource(), appendTableDump()
    // (Follow integration-test-report.prompt.md pattern exactly)
}
```

**Test design principles:**

| Principle | Rule |
|-----------|------|
| Package placement | Same package as the class under test if testing package-private methods; otherwise `com.example.bst.fit` |
| Tasklet testing | Use `@Spy` with real H2 DataSource — NOT full mocks |
| Processor testing | Use `@Spy` with stubbed engine methods |
| DB assertions | Use `JdbcTemplate.queryForList()` to verify DB state after each operation |
| Ordering | `@Order` values in increments of 100 (allows inserting tests later) |
| Report timing | `writeReport()` MUST be called BEFORE `emf.close()` and H2 `SHUTDOWN` |
| Isolation | `@Sql` with `ISOLATED` transaction mode prevents PK conflicts on re-run |

### Phase 5: Report Configuration

The test's `writeReport()` method generates a markdown report at:
```
integrationTests/reports/{job-id}/{yyyy-MM-dd_HH-mm-ss}_report.md
```

Customize the report generation to include:
1. **Test summary table** — all tests with pass/fail status
2. **H2 schema** — full schema SQL from classpath resource
3. **Seed data** — full seed SQL from classpath resource
4. **Final DB state** — `appendTableDump()` for each relevant table
5. **Coverage matrix** — every COBOL program mapped to its Java class and test coverage

### Phase 6: PowerShell Orchestration Script (Optional)

For jobs that will be tested against a real SQL Server instance (not just H2), generate a PowerShell script at `scripts/{job-id}-integration-test.ps1` following the pattern in `scripts/job002-integration-test.ps1`:

```powershell
# {JOB-ID} Integration Test Runner
# Run from repo root: .\scripts\{job-id}-integration-test.ps1

param(
    [string]$FileDir      = "C:\temp\batch-migration-example",
    [string]$Jar          = "target\batch-migration-example-1.0.0.jar",
    [string]$Profile      = "local",
    [string]$BusinessDate = (Get-Date -Format "yyyy-MM-dd")
)

# For each job step in execution order:
# 1. Run the Spring Boot jar with the job name
# 2. Verify post-conditions (DB state, output files)
# 3. Report pass/fail
```

### Phase 7: Verification

1. Run the integration test:
   ```bash
   mvn test -Dtest="{JobId}IntegrationTest"
   ```

2. Verify the report was generated under `integrationTests/reports/`

3. Run the full test suite to ensure no regressions:
   ```bash
   mvn clean test
   ```

4. Check the generated report for completeness

## Output

```
## Integration Test Generated: {JOB-ID}

### Files Created
- src/test/resources/h2/schema-{job-id}.sql ({N} tables)
- src/test/resources/h2/data-{job-id}.sql ({N} INSERT statements)  
- src/test/java/.../...IntegrationTest.java ({N} test methods)
- integrationTests/reports/{job-id}/...report.md (generated at test time)

### Test Results
| Test | Status |
|------|--------|
| Schema ready | ✅ |
| {TaskletName} happy path | ✅ |
| {ProcessorName} valid record | ✅ |
| ... | ... |

### Coverage
| COBOL Program | Java Class | Type | Tested |
|--------------|-----------|------|--------|
| {program} | {class} | {type} | ✅ |
| ... | ... | ... | ... |
```

## Integration with Other Skills

- Generated as the final phase of `/convert-job`
- Uses `/verify` to validate the integration test passes
- The report is committed with `/commit "test({job-id}): add integration tests"`
- Can be run standalone to add integration tests to an already-converted job
