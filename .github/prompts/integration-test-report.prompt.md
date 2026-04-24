# Add Auto-Generated Markdown Report to Integration Test

Add automatic markdown report generation to the specified integration test class so that every `mvn clean test -Dtest={TestClassName}` run produces a timestamped report under `integrationTests/reports/`.

## Reference Implementation

See `Job002IntegrationTest.java` for the working pattern. The report captures test results, H2 schema, seed data, final DB state, and a COBOL→Java coverage matrix — all generated dynamically at test teardown.

## Required Additions

### 1. Imports

Add these imports to the integration test class (skip any already present):

```java
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.junit.jupiter.api.extension.TestWatcher;
import java.sql.ResultSetMetaData;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
```

### 2. TestWatcher Extension + Tracking State

Add these fields to the test class (alongside existing fields like `dataSource`, `emf`, etc.):

```java
// ── Report generation state ─────────────────────────────────────────────
private final List<String[]> testResults = new ArrayList<>();
private long suiteStartMs;

@RegisterExtension
TestWatcher reportWatcher = new TestWatcher() {
    @Override
    public void testSuccessful(ExtensionContext context) {
        testResults.add(new String[]{context.getDisplayName(), "PASS", ""});
    }
    @Override
    public void testFailed(ExtensionContext context, Throwable cause) {
        testResults.add(new String[]{context.getDisplayName(), "FAIL", cause.getMessage()});
    }
    @Override
    public void testAborted(ExtensionContext context, Throwable cause) {
        testResults.add(new String[]{context.getDisplayName(),
                "ABORTED", cause != null ? cause.getMessage() : ""});
    }
};
```

> **Critical**: JUnit 5 `TestWatcher` method names are `testSuccessful`, `testFailed`, `testAborted` — NOT `succeeded`/`failed`/`aborted` (those are a different framework). See lessons.md entry 2026-03-26.

### 3. Start Timer in @BeforeAll

Add `suiteStartMs = System.currentTimeMillis();` as the **first line** of the `@BeforeAll` method (before H2 init or any other setup).

### 4. @AfterAll: Generate Report Before Shutdown

Replace or wrap the existing `@AfterAll` method to call `writeReport()` **before** closing `EntityManagerFactory` and shutting down H2 (the report queries the live DB for final state):

```java
@AfterAll
void tearDownAndGenerateReport() throws Exception {
    try {
        writeReport();
    } catch (Exception e) {
        System.err.println("WARNING: Failed to generate report: " + e.getMessage());
        e.printStackTrace(System.err);
    }
    // ... existing cleanup (emf.close(), SHUTDOWN) ...
}
```

### 5. Report Generation Methods

Add these three private methods to the test class. **Customize the sections marked with `TODO`** for each integration test's specific tables, schema resources, and coverage matrix.

```java
// ═══════════════════════════════════════════════════════════════════════════
//  Report generation — writes markdown report after all tests complete
// ═══════════════════════════════════════════════════════════════════════════

private void writeReport() throws Exception {
    long elapsedMs = System.currentTimeMillis() - suiteStartMs;
    double elapsedSec = elapsedMs / 1000.0;
    LocalDateTime now = LocalDateTime.now();
    String fileTimestamp = now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));
    String displayTimestamp = now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

    long passed = testResults.stream().filter(r -> "PASS".equals(r[1])).count();
    long failed = testResults.stream().filter(r -> "FAIL".equals(r[1])).count();
    long aborted = testResults.stream().filter(r -> "ABORTED".equals(r[1])).count();
    int total = testResults.size();

    Path reportDir = Path.of("integrationTests", "reports");
    Files.createDirectories(reportDir);
    Path reportFile = reportDir.resolve(fileTimestamp + "_report.md");

    StringBuilder md = new StringBuilder();

    // ── Header ──────────────────────────────────────────────────────────────
    String resultEmoji = failed == 0 && aborted == 0 ? "\u2705" : "\u274C";
    md.append("# TODO_JOB_NAME Integration Test Report\n\n");
    md.append("**Date:** ").append(displayTimestamp).append("  \n");
    md.append("**Test Class:** `TODO_FQCN`  \n");
    md.append("**Result:** ").append(resultEmoji).append(" **")
      .append(passed).append(" passed");
    if (failed > 0) md.append(", ").append(failed).append(" failed");
    if (aborted > 0) md.append(", ").append(aborted).append(" aborted");
    md.append(" (").append(total).append(" total)**  \n");
    md.append("**Elapsed:** ").append(String.format("%.3f", elapsedSec)).append("s  \n");
    md.append("**Business Date:** ").append(BUSINESS_DATE).append("  \n");
    md.append("**Database:** H2 in-memory (SQL Server compatibility mode)\n\n");
    md.append("---\n\n");

    // ── Test Summary Table ──────────────────────────────────────────────────
    md.append("## 1. Test Summary\n\n");
    md.append("| # | Test Name | Result | Error |\n");
    md.append("|---|-----------|--------|-------|\n");
    for (int i = 0; i < testResults.size(); i++) {
        String[] r = testResults.get(i);
        String icon = "PASS".equals(r[1]) ? "\u2705" : "\u274C";
        String error = r[2] == null || r[2].isEmpty() ? "" : r[2].replace("|", "\\|");
        md.append("| ").append(i + 1).append(" | ").append(r[0])
          .append(" | ").append(icon).append(" ").append(r[1])
          .append(" | ").append(error).append(" |\n");
    }
    md.append("\n---\n\n");

    // ── H2 Schema (read from classpath resource) ────────────────────────────
    md.append("## 2. H2 Database Schema\n\n```sql\n");
    md.append(readClasspathResource("h2/TODO_SCHEMA_FILE.sql"));    // TODO
    md.append("\n```\n\n---\n\n");

    // ── Seed Data (read from classpath resource) ────────────────────────────
    md.append("## 3. Seed Data\n\n```sql\n");
    md.append(readClasspathResource("h2/TODO_DATA_FILE.sql"));      // TODO
    md.append("\n```\n\n---\n\n");

    // ── Final H2 Database State (live queries) ──────────────────────────────
    md.append("## 4. Final H2 Database State\n\n");
    // TODO: Add one appendTableDump() call per table. Example:
    // appendTableDump(md, "SAMS.TABLE_NAME",
    //         "SELECT COL1, COL2, COL3 FROM SAMS.TABLE_NAME ORDER BY COL1");
    md.append("---\n\n");

    // ── Coverage Matrix (static, customize per job) ─────────────────────────
    md.append("## 5. Coverage Matrix\n\n");
    md.append("| # | COBOL Program | Java Class | Type | JCL Step |\n");
    md.append("|---|--------------|-----------|------|----------|\n");
    // TODO: Add one row per migrated COBOL program. Example:
    // md.append("| 1 | PROGNAME.CBL | JavaClassName | Tasklet | PS005 |\n");
    md.append("\n");

    Files.writeString(reportFile, md.toString());
    System.out.println("Report written to: " + reportFile.toAbsolutePath());
}

private String readClasspathResource(String resource) {
    try (InputStream is = getClass().getClassLoader().getResourceAsStream(resource)) {
        if (is == null) return "(resource not found: " + resource + ")";
        return new String(is.readAllBytes(), StandardCharsets.UTF_8);
    } catch (IOException e) {
        return "(failed to read: " + resource + ": " + e.getMessage() + ")";
    }
}

private void appendTableDump(StringBuilder md, String tableName, String sql)
        throws SQLException {
    md.append("### ").append(tableName).append("\n\n");
    try (Connection con = dataSource.getConnection();
         Statement stmt = con.createStatement();
         ResultSet rs = stmt.executeQuery(sql)) {

        ResultSetMetaData meta = rs.getMetaData();
        int cols = meta.getColumnCount();

        md.append("|");
        for (int c = 1; c <= cols; c++)
            md.append(" ").append(meta.getColumnName(c)).append(" |");
        md.append("\n|");
        for (int c = 1; c <= cols; c++)
            md.append("---|");
        md.append("\n");

        int rows = 0;
        while (rs.next()) {
            md.append("|");
            for (int c = 1; c <= cols; c++) {
                String val = rs.getString(c);
                md.append(" ").append(val != null ? val.replace("|", "\\|") : "*null*")
                  .append(" |");
            }
            md.append("\n");
            rows++;
        }
        md.append("\n*").append(rows).append(" row(s)*\n\n");
    }
}
```

## Customization Checklist

When applying this pattern to a new integration test, replace every `TODO` marker:

- [ ] **Report title**: Replace `TODO_JOB_NAME` with the job name (e.g., `JOB001`, `JOB002`)
- [ ] **Test class FQCN**: Replace `TODO_FQCN` with the fully qualified test class name
- [ ] **Schema resource**: Replace `TODO_SCHEMA_FILE.sql` with the H2 schema filename (e.g., `schema-job002.sql`)
- [ ] **Seed data resource**: Replace `TODO_DATA_FILE.sql` with the H2 seed data filename (e.g., `data-job002.sql`)
- [ ] **Table dumps**: Add one `appendTableDump()` call per H2 table, selecting the most useful columns
- [ ] **Coverage matrix**: Add one markdown table row per migrated COBOL program with its Java class, type, and JCL step

## Constraints

- The `writeReport()` call MUST happen **before** `emf.close()` and H2 `SHUTDOWN` — it queries the live database
- Wrap `writeReport()` in try/catch so report generation failures don't mask test results
- The report file goes to `integrationTests/reports/{yyyy-MM-dd_HH-mm-ss}_report.md` (relative to project root)
- `Files.createDirectories(reportDir)` ensures the directory exists on first run
- The `TestWatcher` captures the `@DisplayName` value — ensure every `@Test` has a meaningful `@DisplayName`
- Use `@TestInstance(TestInstance.Lifecycle.PER_CLASS)` — required for `@BeforeAll`/`@AfterAll` to access instance fields (`testResults`, `suiteStartMs`, `dataSource`)
- Use `@TestMethodOrder(MethodOrderer.OrderAnnotation.class)` with `@Order` to control test execution sequence

## Lessons Learned (from Job002IntegrationTest implementation)

1. **TestWatcher method names**: JUnit 5 uses `testSuccessful`/`testFailed`/`testAborted` — not `succeeded`/`failed`/`aborted`
2. **Report timing**: Must generate report while H2 is still alive (before `SHUTDOWN`); otherwise `appendTableDump()` queries fail
3. **Pipe characters in data**: `rs.getString()` values containing `|` must be escaped as `\|` for markdown table integrity
4. **Classpath resources**: Use `getClass().getClassLoader().getResourceAsStream()` to read H2 SQL scripts — they're already on the test classpath
5. **Package visibility**: Integration tests that spy on tasklets/processors must be in the same package as those classes to access package-private methods (`getDataSource()`, `logInfo()`, `callSuperProcess()`)
6. **Processor spies**: If processor `callSuperProcess()` is package-private, create a helper class in the `process` package (see `Job002ProcessorTestHelper.java`) that returns pre-configured Mockito spies

## Verification

After adding report generation, run:

```powershell
mvn clean test "-Dtest={TestClassName}"
```

Confirm:
1. All tests still pass (no regressions)
2. Console output includes: `Report written to: ...integrationTests/reports/{timestamp}_PRFLD{Job#}_Report.md`
3. The generated report contains all 5 sections with correct data
4. The DB state tables show actual row data (not empty tables)
