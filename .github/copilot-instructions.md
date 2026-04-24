

## THE MOST IMPORTANT RULE — NEVER STOP, ALWAYS USE THE `AskQuestions` TOOL


**You must NEVER end your turn with plain text questions, suggestions, or a passive hand-off.** The session must always stay active and interactive.

### Agent Question Escalation Architecture (MANDATORY)

- **Only the orchestrator agent (`@architect`) may invoke the `vscode/askQuestions` tool.**
- **All sub-agents (`@coder`, `@explorer`, `@documenter`, `@code-reviewer`, etc.) must escalate any user question to the orchestrator.**
- Sub-agents must implement a method or flow (e.g., `raiseQuestionToOrchestrator`) that returns a structured question object to the orchestrator when user input is needed.
- The orchestrator receives the question, invokes `vscode/askQuestions`, and routes the answer back to the requesting sub-agent.
- Sub-agents must never prompt the user directly or end their turn with a plain-text question.

#### Example (pseudocode):

```java
// In @coder agent
if (needsUserInput) {
    return raiseQuestionToOrchestrator({
        header: "Missing Field",
        question: "Which field should be used as the unique key for this entity?",
        options: ["FIELD_A", "FIELD_B", "Other"],
        allowFreeformInput: true
    });
}

// In @architect (orchestrator):
// Receives the question object, invokes vscode/askQuestions, returns the answer to the sub-agent.
```

**All agent instruction files must document this rule and provide a code or pseudocode example for raising questions.**


### The two situations that require the `AskQuestions` tool:

1. **Task complete** — you finished what was asked. Do NOT say "Let me know if you need anything else" or similar. Instead, **immediately invoke the `AskQuestions` tool** to ask what to work on next.

2. **Mid-task decision point** — you need clarification, a design decision, or user input to continue. Do NOT guess or make assumptions silently. **Immediately invoke the `AskQuestions` tool** with as many questions as needed, then keep going once you have the answers.

### What is FORBIDDEN:
- Ending a reply with a plain-text question (e.g. "What would you like next?")
- Ending a reply with a suggestion or offer (e.g. "Let me know if you want me to…")
- Stopping without either completing the task OR invoking the `AskQuestions` tool
- Yielding control back to the user passively in any form

### The only acceptable ways to end a turn:
- ✅ The task is fully complete AND the `AskQuestions` tool was invoked to ask what's next
- ✅ A blocking question was asked via the `AskQuestions` tool and you are waiting for the answer to continue
- ✅ The user selected "All good for now" (or similar) in the what's-next prompt — end cleanly, no further questions

### "What's next?" prompt rule:
When asking the user what to work on next (task complete, housekeeping done), **always include an option to end the session cleanly** — e.g. "All good for now — end here". If the user selects it, wrap up without asking any more questions.



### Managing cognitive load while staying active:
- **Orchestrator & Sub-Agent Model:**
    - The `@architect` agent is the orchestrator. The architect coordinates all major tasks and delegates work to sub-agents.
    - The sub-agents are: `@explorer` (context gathering), `@coder` (implementation/debugging), `@documenter` (documentation), `@code-reviewer` (code review/TODO resolution), and `@document-reviewer` (documentation review — quick findings reports OR full HTML WIKI generation).
    - The orchestrator (architect) never does routine file reads, implementation, or documentation directly—these are always delegated to the appropriate sub-agent.
    - All agents must follow this delegation model. If you are not the architect, you are a sub-agent and must not escalate or delegate further except as defined in your agent file.
    - **When a sub-agent needs user input, it must escalate the question to the orchestrator, which will invoke `vscode/askQuestions` and return the answer.**
- Use the `AskQuestions` tool to get unblocked — never stall silently

# Copilot Instructions for batch-migration-example

## 0) Self-Improvement Loop (Mandatory)

This is the most important rule in this repository.

Before closing any task, if any correction, clarification, or bug fix occurred during the task, you MUST append a new entry to `.github/memory/lessons.md`.

You MUST add a lesson entry when any of the following occurs:
- You made an assumption that turned out to be wrong.
- A bug was found in code you generated.
- A human corrected your output in any way.
- You misread the schema, component structure, or a requirement.
- A type error, lint error, or test failure was caused by your code.
- You chose an approach and then had to change it mid-task.

Do not close the task until the lessons entry is appended.

Use the entry format defined in `.github/memory/lessons.md`.

## 0.1) Migration Status Tracking (Mandatory)

After completing any task that **implements, modifies, or removes** a migration component (model, processor, tasklet, YAML job, REST client, or test), you MUST update `.github/memory/migration-status.md`:
- Update the relevant table rows (status, Java target, notes).
- Update the **Migration Progress Summary** counts at the bottom.
- Update the **Last updated** date.

Consult `.github/memory/migration-status.md` at the start of migration tasks to understand current project state and avoid duplicating work.

---

## 0.2) Available Skills and Agents

Reusable skills are defined under `.github/skills/`. Invoke them via `/skillname` in chat or CLI.

### Workflow Skills

| Skill | Purpose | Invocation |
|-------|---------|------------|
| `/verify` | Ralph Loop — compile, test, coverage cycle | `/verify` or `/verify TestClassName` |
| `/commit` | Safe commit with pre-flight checks | `/commit "feat(scope): description"` |
| `/push` | Safe push with branch/test validation | `/push` |
| `/impl-check` | Scan code for anti-patterns and standards violations | `/impl-check` or `/impl-check path/to/file` |
| `/review` | Pre-PR code review report | `/review` or `/review main` |
| `/status` | Migration status dashboard | `/status` |
| `/lessons` | Lessons learned management (add/search/check) | `/lessons add`, `/lessons search`, `/lessons check` |
| `/scaffold` | Generate boilerplate for new components | `/scaffold processor Name` |
| `/review-docs` | Review docs folder → generate navigable HTML WIKI | `/review-docs "path/to/Documentation"` |

### Migration Skills

| Skill | Purpose | Invocation |
|-------|---------|------------|
| `/shard-plan` | Analyze mainframe job artifacts → generate shard specs | `/shard-plan "Legacy Data Collection"` |
| `/convert-job` | Full job conversion orchestrator (shard-by-shard with gates) | `/convert-job JOB002` |
| `/convert-job1` | JOB001 single shard executor | `/convert-job1 3` |
| `/convert-job2` | JOB002 single shard executor | `/convert-job2 2` |
| `/integration-test` | Generate integration tests for a converted job | `/integration-test JOB002` |

### Agents

| Agent | Tier | Purpose |
|-------|------|---------|
| `@architect` | 1 (Opus) | Architecture decisions, hard problems |
| `@coder` | 2 (Sonnet) | Implementation, debugging, refactoring |
| `@explorer` | 4 (Flash) | File searches, context gathering |
| `@convert-job1` | 2 (Sonnet) | JOB001 shard execution |
| `@convert-job2` | 2 (Sonnet) | JOB002 shard execution |
| `@red-green-tdd-conversion` | 2 (Sonnet) | Ad-hoc COBOL→Java TDD conversion |
| `@document-reviewer` | 2 (Sonnet) | Documentation review — quick findings reports OR full HTML WIKI generation |

---

## 1) Source of Truth and Priority

When guidance conflicts, resolve in this order:
1. Explicit user instruction in the current task.
2. `batch-how-to.md` — the authoritative architectural reference for coding patterns, naming conventions, YAML configuration, and COBOL-to-Java mapping.
3. Latest errata/review updates in project specs (e.g., Section 1A "Review Findings & Errata" in scaffold docs).
4. Prompt-specific implementation docs under `existing-mainframe/Documentation/Legacy Migration/1-...` through `12-...`.
5. Architectural and batch specifications:
   - `existing-mainframe/Documentation/Legacy Migration/JOB001-SpringBatch-Scaffolded-Application-Spec.md`
   - `existing-mainframe/Documentation/Legacy Migration/JOB001-JOB001-Data-Collection-SpringBatch-Spec.md`
   - `existing-mainframe/Documentation/Legacy Migration/JOB001-SpringBatch-Architecture-Diagrams.md`
6. Existing codebase patterns (processors, tasklets, models, YAML entries already implemented).
7. Repository placeholders (`README.md`, `CONTRIBUTING.md`) only where they are explicit and non-placeholder.

If there is uncertainty, do not invent behavior. Align to documented rules and call out ambiguity.

---

## 2) Repository Context

This repository (`batch-migration-example`) is a **COBOL-to-Java migration** project. It converts mainframe batch jobs (JCL/COBOL) into a **YAML-driven Spring Batch application** powered by the `batch-engine` internal library.

### Mainframe Source Artifacts

The original mainframe code lives under `existing-mainframe/Mainframe Code Extract/`:
- **Legacy Data Collection** — JOB001 job: COBOL programs (`.CBL`), copybooks (`.CPY`), JCL (`.JCL`), control cards (`.CTL`)
- **Legacy Fee Aggregation** — JOB002 job: same artifact types
- **Job Descriptions** — `JOB001.txt`, `JOB002.txt`

Migration specs and implementation blueprints live under `existing-mainframe/Documentation/Legacy Migration/`.

### Key Architectural Insight

You **never** write Spring Batch `@Bean Job` or `@Bean Step` definitions. The `batch-engine` library reads job descriptors from `application.yml` under `bst.bstJobs` and auto-wires all Spring Batch infrastructure (readers, writers, steps, jobs, partitioning, async execution). You only provide:
1. A **YAML job descriptor** in `application.yml` under `bst.bstJobs` (always required).
2. A **Processor** class extending `BstItemProcessor<I, O>` (for CHUNK jobs) or one or more **Tasklet** classes extending `BstTasklet` (for TASKLET jobs).
3. A **JPA Entity / Model** class (annotated with `@Data`, `@Entity`, `@Table`).

### Technology Stack

| Layer              | Technology                                         |
| ------------------ | -------------------------------------------------- |
| Framework          | Spring Boot 2.7.18                                 |
| Batch Engine       | `batch-engine` 1.0.0 (custom internal library) |
| Cloud Task         | `spring-cloud-task-batch`                          |
| Database           | SQL Server (mssql-jdbc)                            |
| ORM                | JPA / Hibernate (`javax.persistence`)              |
| Connection Pool    | HikariCP                                           |
| Object Storage     | S3-compatible Object Storage (via engine tasklets)           |
| Auth               | OAuth2 (internal oauth-client)             |
| Secrets            | CredHub (via `vcap.services`)                      |
| Build              | Maven, Spring Boot plugin, JaCoCo                  |
| Lombok             | `@Data` on all models                              |
| Testing            | JUnit 5 + Mockito (no JUnit 4)                     |

---

## 3) Project Structure and Package Boundaries

```
src/main/java/com/example/bst/fit/
├── BatchApplicationMain.java           # Entry point (@SpringBootApplication + @EnableTask + @EnableBatchProcessing)
├── batch/
│   ├── process/                         # ItemProcessor implementations (CHUNK jobs)
│   ├── tasklet/                         # Tasklet implementations (TASKLET jobs)
│   ├── utils/
│   │   └── BatchConstants.java      # ALL constants — no magic strings/numbers inline
│   └── webclient/                       # REST client @Service classes
├── config/
│   ├── DataSourceConfig.java            # HikariCP + JPA EntityManager + @Qualifier wiring
│   ├── ContextAwareClass.java           # Spring bean lookup helper (used inside processors/tasklets)
│   └── Oauth2ClientConfiguration.java   # OAuth2Client bean factory
└── model/                               # JPA entities (@Data + @Entity)
```

All FQCNs use base package `com.example.bst.fit`. Specific sub-packages:
- Processors: `com.example.bst.fit.batch.process.{ClassName}`
- Tasklets: `com.example.bst.fit.batch.tasklet.{ClassName}`
- Models: `com.example.bst.fit.model.{ClassName}`
- Constants: `com.example.bst.fit.batch.utils.BatchConstants`
- Config: `com.example.bst.fit.config.{ClassName}`
- REST clients: `com.example.bst.fit.batch.webclient.{ClassName}`

Do **not** create packages outside this structure (e.g., no `reader/`, `writer/`, `listener/`, or `service/` packages) unless directed by updated spec docs — the engine handles readers, writers, and listeners automatically.

---

## 4) YAML Job Configuration Rules

Every batch job is declared under `bst.bstJobs` in `application.yml`. The engine reads these at startup. You never register jobs in Java code.

### Two Step Types

| Type | When to Use | You Write |
|------|-------------|-----------|
| `CHUNK` | File→DB load or DB→File unload (reader/processor/writer) | Processor class + Model class |
| `TASKLET` | Stored procedures, cleanup, REST API calls, complex multi-table ops | Tasklet class(es) |

### YAML Standards

- `jobName` must be unique across all `bst.bstJobs` entries (camelCase).
- Always include `jobDescription` (human-readable purpose).
- `channel.input` and `channel.output` are required even for TASKLET jobs (`DB`/`DB`).
- Valid channel values: `NAS`, `DB`, `SPOS` — never use `FILE`.
- `stepType` must be `CHUNK` or `TASKLET` (case-sensitive).
- CHUNK jobs must specify `processor.processorClass` (FQCN of `BstItemProcessor` subclass).
- CHUNK jobs must specify `dtoClass` (FQCN of DTO/entity for the reader) and `entityClass` (FQCN of JPA entity — typically same as dtoClass).
- CHUNK jobs must specify `processor.chunkSize`, `processor.syncAsync` (`sync` or `async`), and `processor.concurrentLimit` inside the `processor:` block.
- Use `filePrefix` + `fileSuffix` (not `fileName`) for file-based jobs — the engine matches files by prefix+suffix.
- Do **not** use `model:` or `table:` — these are not engine properties.
- Use `${bst.fileDirectory}` for `nasDir` — never hardcode paths.
- Use `${bst.spos.*BucketName}` for `sposBucketName`.
- Set `strictMode: false` for files with optional columns.
- Set explicit `skipLimit` to declare error tolerance.
- Include `archiveDir` (relative path, e.g., `archive/`) and `archiveRetentionDays` for load jobs.
- For NAS→DB load jobs that consume external files, add `beforeJobTasks` (DeleteFilesFromNas + DownloadFilesFromSpos) and `afterJobTasks` (ArchiveFilesFromSpos).

### Engine-Provided Tasklets (reference by FQCN in `beforeJobTasks`/`afterJobTasks`)

| Engine Tasklet | Purpose |
|---------------|---------|
| `com.example.bst.engine.tasklet.DeleteFilesFromNasTasklet` | Clean local temp directory |
| `com.example.bst.engine.tasklet.DownloadFilesFromSposTasklet` | Download files from S3/SPOS |
| `com.example.bst.engine.tasklet.DeleteDataFromTableTasklet` | Truncate staging table |
| `com.example.bst.engine.tasklet.ArchiveFilesFromSposTasklet` | Archive S3 files |
| `com.example.bst.engine.tasklet.UploadFilesToSposTasklet` | Upload output files to S3 |
| `com.example.bst.engine.tasklet.FileWatcherForSposTasklet` | Poll S3 for trigger file |
| `com.example.bst.engine.tasklet.DeleteFilesFromSposTasklet` | Delete files from S3/SPOS |
| `com.example.bst.engine.tasklet.ListFilesFromNasTasklet` | List files in local NAS directory |

---

## 5) Implementation Rules — Processors

All processors extend `BstItemProcessor<I, O>` from `com.example.bst.fit.step.BstItemProcessor`.

| Rule | Detail |
|------|--------|
| **Always call `super.process(model)` first** | Enables engine tracking and metrics. |
| **Return `null` to silently skip a record** | Record is not written, not counted as error. |
| **Throw `CustomSkipException` for bad records** | Counted against `skipLimit`; logged as ERROR. |
| **Set `uniqueKey` on every model** | Required by engine for idempotency. |
| **Set `businessDate` via `getBusinessDateAsSqlDate()`** | For File→DB load processors. |
| **Set `processTS`** | `Timestamp.valueOf(LocalDateTime.now(ZoneId.of(BatchConstants.US_EASTERN_ZONE)))` |
| **Use `@Transient` fields for raw input** | Parse/validate in processor, set typed fields. |
| **Use engine logger** | `getLogger().builder("msg").level(Level.INFO).log()` — never `System.out` or `@Slf4j`. |
| **Never use `@Autowired`** | Processors are not Spring-managed beans; use `ContextAwareClass.getBean()` for dependencies. |
| **Wrap validation in `try-catch`** | Prevents partial validation loss. |

### Standard Processor Pattern

```java
public class MyEntityLoadProcessor extends BstItemProcessor<MyEntity, MyEntity> {
    @Override
    public MyEntity process(MyEntity model) throws Exception {
        super.process(model);
        // 1. Pre-filter (return null to skip)
        // 2. Validate (throw CustomSkipException on failure)
        // 3. Enrich (set uniqueKey, businessDate, processTS)
        return model;
    }
}
```

---

## 6) Implementation Rules — Tasklets

All tasklets extend `BstTasklet` from `com.example.bst.fit.tasklet.BstTasklet`.

| Rule | Detail |
|------|--------|
| **Always return `RepeatStatus.FINISHED`** | No looping pattern used. |
| **Always re-throw exceptions from `execute()`** | Ensures the job fails properly — never swallow exceptions. |
| **Manage `EntityManager` via `beforeStep()`/`afterStep()`** | Create in `beforeStep()`, `flush()` + `commit()` + `close()` in `afterStep()`. |
| **Close JDBC resources in `finally`** | `if (stmt != null) stmt.close(); if (con != null) con.close();` |
| **Get JDBC Connection via `EntityManagerFactoryInfo`** | Cast `getEntityManagerFactory()` for stored proc calls. |
| **Check `DataSource` for null** | `if (dataSource == null) throw new IllegalStateException(...)` |
| **Use constants for stored procedure names** | Define in `BatchConstants`; never inline. |
| **Check return code from stored procs** | `returnCode != 0` → throw `DbException`. |
| **Use `ContextAwareClass.getBean()`** | To get Spring beans (REST clients, OAuth). |
| **Use engine logger** | Never `System.out` or `@Slf4j`. |
| **Use `con` for Connection variable name** | Project convention (not `conn`). |

### Stored Procedure Calling Pattern

```java
EntityManagerFactoryInfo info = (EntityManagerFactoryInfo) getEntityManagerFactory();
DataSource dataSource = info.getDataSource();
Connection con = dataSource.getConnection();
CallableStatement stmt = con.prepareCall("call " + BatchConstants.PROC_NAME + "(?, ?, ?)");
stmt.setDate(1, getBusinessDateAsSqlDate());
stmt.setInt(2, -1);      // OUT: return code
stmt.setString(3, "");   // OUT: message
ResultSet rs = stmt.executeQuery();
rs.next();
int returnCode = rs.getInt(1);
if (returnCode != 0) throw new DbException("Failed: " + rs.getString("out_message"));
```

---

## 7) Implementation Rules — Models / Entities

| Rule | Detail |
|------|--------|
| **Always use `@Data` (Lombok)** | No manual getters/setters. |
| **`@Id` with `UNIQUE_KEY` column for staging tables** | Writable staging/load tables. |
| **`@Id` on natural key for views and event tables** | Views use their natural key. |
| **Use `@Transient` for raw input fields** | Named to match YAML `columnNames`, suffixed with `In` (e.g., `accountIdIn`). |
| **`@NamedQuery` for DB→NAS unload** | Query name format: `Entity.<QUERY_NAME>`. |
| **Use `Serializable` + `@IdClass` for composite keys** | Entity can be its own `@IdClass`. |
| **Column names: uppercase with underscores** | `@Column(name = "ACCOUNT_ID")`. |
| **Set `@Entity(name = ...)` matching table name** | Required for `@NamedQuery` references. |
| **Use `@Transient` fields for file columns, typed fields for DB columns** | Processor parses `@Transient` → sets typed field. |

---

## 8) COBOL-to-Java Conversion Mapping

When converting COBOL programs from `existing-mainframe/Mainframe Code Extract/`, use this mapping:

| COBOL Construct | Java/FIT Batch Equivalent |
|----------------|--------------------------|
| JCL JOB card | YAML entry in `bst.bstJobs` array |
| JCL EXEC PGM= | `stepType: CHUNK` or `stepType: TASKLET` |
| JCL SORT STEP | `beforeJobTasks` or processor `return null` filtering |
| FD / COPY layout | `@Entity` model with `@Column` + `@Transient` fields |
| WORKING-STORAGE | `@Transient` fields on model, constants in `BatchConstants` |
| PIC 9(n) / PIC S9(n) | Parse in processor: `Integer.parseInt()`, `Long.parseLong()` |
| PIC X(n) | `String` field on model |
| COMP-3 / PACKED-DECIMAL | `BigDecimal` in processor |
| 88-level condition names | Constants in `BatchConstants` |
| PERFORM paragraph | Private method in processor or tasklet |
| EVALUATE / IF-ELSE | Java `if`/`switch` in `process()` or `execute()` |
| EXEC SQL CALL | `con.prepareCall("call proc_name(?, ?)")` in tasklet |
| EXEC SQL SELECT/INSERT | JPA `CriteriaBuilder` queries |
| RETURN-CODE | `throw DbException` or `throw CustomSkipException` |
| COMMIT interval | `chunkSize` in YAML |
| Fixed-length record file | `fileType: FIXED_LENGTH` + `columnRanges` |
| Delimited file | `fileType: DELIMITED` + `delimiter` |
| Control cards (`.CTL`) | SQL parameters integrated into YAML `queryParameters` or stored proc args |

### Conversion Checklist

1. Identify the file layout (FD/COPY) → Create `@Entity` model class.
2. Identify the processing logic → Determine CHUNK vs TASKLET.
3. Map PICTURE clauses → Java types + `@Transient` raw fields.
4. Map PERFORM paragraphs → Private methods in processor/tasklet.
5. Map EXEC SQL → JPA criteria queries or stored procedure calls.
6. Map SORT/MERGE → Pre-filter in processor (`return null`) or `beforeJobTasks`.
7. Map COMMIT frequency → `chunkSize`.
8. Map error handling → `CustomSkipException` + `skipLimit`.
9. Add YAML job descriptor → `application.yml` under `bst.bstJobs`.
10. Add constants → `BatchConstants.java`.

### Mainframe Jobs in Scope

| Job | Description | Source Location |
|-----|-------------|-----------------|
| **JOB001** | Legacy Data Collection — updates STAGING_TABLE for batch data into staging tables | `existing-mainframe/Mainframe Code Extract/Legacy Data Collection/` |
| **JOB002** | Legacy Fee Aggregation — generates aggregated reports and output files | `existing-mainframe/Mainframe Code Extract/Legacy Fee Aggregation/` |

---

## 9) SQL and Data Rules

When implementing SQL:
- Target database is **SQL Server** (not DB2). The mainframe COBOL uses DB2; all SQL must be translated to SQL Server syntax.
- If migration specs reference DB2-specific clauses (e.g., `WITH UR`, `CURRENT TIMESTAMP`), adapt them for SQL Server while preserving query intent.
- Do **not** merge distinct attribute-set rules (e.g., documented 10-element vs {ATTRIBUTE_ID} `ATTRIBUTE_ID` sets) unless specs explicitly change.
- For `@NamedQuery` in entities, use JPQL syntax (portable across databases).
- Use JPA `CriteriaBuilder` for dynamic queries — never concatenate JPQL with user input.
- Always verify column ranges against COBOL copybooks (`.CPY` files) when implementing `FIXED_LENGTH` readers — copybook PIC clauses are the source of truth for byte widths.

---

## 10) Constants and Naming Conventions

### Naming

| Artifact | Convention | Examples |
|----------|-----------|----------|
| Job name (YAML) | camelCase | `customerDataLoad`, `feeCollectJob` |
| Processor class | `{Entity}LoadProcessor` / `{Entity}UnloadProcessor` | `CustomerDataLoadProcessor` |
| Tasklet class | `{Purpose}Tasklet` | `CustomerDeltaProcTasklet` |
| Model / Entity | PascalCase | `CustomerStagingData`, `AccountMaster` |
| DB column | UPPER_SNAKE_CASE | `@Column(name = "ACCOUNT_ID")` |
| Constants | UPPER_SNAKE_CASE | `US_EASTERN_ZONE`, `STATUS_N` |
| File prefix | lowercase_snake_case with trailing `_` | `customer_data_export_` |
| REST client | `{Purpose}RestClientImpl` | `DataServiceRestClientImpl` |

### Constants Rules

- **All** constants go in `BatchConstants.java` — no magic strings or numbers inline.
- Use `String` type for string constants (not `Object`).
- Use descriptive names; add Javadoc for non-obvious values.
- Define all stored procedure names as constants.
- Private constructor must throw `IllegalStateException("BatchConstants is a Utility class")`.

---

## 11) Testing Standards

### Framework

| Component | Standard |
|-----------|----------|
| Test framework | **JUnit 5** (Jupiter) — no JUnit 4 annotations |
| Mocking | **Mockito** with `@ExtendWith(MockitoExtension.class)` |
| Coverage | **JaCoCo** ≥ 80% line coverage on new code |
| No Spring context | `@SpringBootTest` is forbidden in unit tests — reserve for integration tests only |

### TDD Workflow (Required for all new code)

1. **RED** — Write a failing test for the next behavior.
2. **GREEN** — Write minimum code to pass.
3. **REFACTOR** — Clean up while keeping tests green.

### Mocking Engine Base Classes

Since `BstItemProcessor` and `BstTasklet` are from the engine library, use `@Spy` on the class under test and stub inherited methods:

```java
@Spy private MyProcessor processor;

@BeforeEach
void setUp() {
    doReturn(Date.valueOf("2026-01-15")).when(processor).getBusinessDateAsSqlDate();
    doReturn(mockEmf).when(processor).getEntityManagerFactory();
}
```

Use `MockedStatic<ContextAwareClass>` when testing tasklets that call `ContextAwareClass.getBean()`.

### Test Organization

- Mirror main source tree under `src/test/java/com/example/bst/fit/`.
- Test class name: `{ClassName}Test.java`.
- Use `@Nested` classes for behavior categories (Validation, Filtering, Enrichment, Error Handling).
- Use `@DisplayName` on every test class and method.
- Follow AAA pattern: Arrange → Act → Assert.

### Processor Test Checklist

- [ ] Valid record: all fields enriched, `uniqueKey` set, `businessDate` set, `processTS` set
- [ ] Each validation rule triggers `CustomSkipException` with descriptive message
- [ ] Each filter condition returns `null`
- [ ] Edge cases: null fields, empty strings, max-length values, leading zeros
- [ ] `super.process(model)` is called

### Tasklet Test Checklist (Stored Procedure)

- [ ] Successful execution returns `RepeatStatus.FINISHED`
- [ ] Non-zero return code throws `DbException`
- [ ] `Connection` and `CallableStatement` closed in `finally` (even on exception)
- [ ] Null `DataSource` throws `IllegalStateException`
- [ ] Business date parameter passed correctly

### Tasklet Test Checklist (JPA + REST API)

- [ ] Empty result set: no API calls, returns `FINISHED`
- [ ] Each record triggers an API call
- [ ] Successful API response updates record status
- [ ] Failed API response updates record status to error
- [ ] `EntityManager` lifecycle: `begin()`, `flush()`, `commit()`, `close()`
- [ ] Exception from API call is re-thrown (not swallowed)

### Build & Test Commands

```bash
# Run all tests
mvn clean test

# Run a specific test class
mvn test -Dtest=CustomerDataLoadProcessorTest

# Build without tests
mvn clean package -DskipTests

# Generate coverage report
mvn clean verify   # Report at target/site/jacoco/index.html
```

---

## 12) Documentation Creation and Maintenance

When code, behavior, assumptions, or architecture changes:
- Update the corresponding documentation in `existing-mainframe/Documentation/` within the same task.
- Keep documentation structure consistent with project style (Scope, Errata/Findings, Verification Criteria where relevant).
- Record **why** the change was made, not only what changed.
- Cross-reference impacted spec docs so future implementation remains traceable.

When creating new documentation:
- Be explicit, implementation-oriented, and testable.
- Prefer concise sections and concrete acceptance/verification criteria.
- Avoid placeholder text unless explicitly requested.

---

## 13) Scope and Change Discipline

- Implement only what the user asked; do not add speculative features.
- Prefer minimal, reversible changes that satisfy documented behavior.
- Keep naming, structure, and style aligned with existing codebase patterns.
- Do not modify governance files (`CODEOWNERS`, workflows) unless explicitly requested.
- When converting COBOL, preserve the original business logic faithfully — do not optimize, simplify, or reinterpret business rules unless explicitly asked.
- Always cross-reference COBOL copybooks (`.CPY`) for field layouts — do not rely solely on spec docs, as they may contain errors (see errata in scaffold specs).

---

## 14) Coding Standards Quick Reference

| Rule | Standard |
|------|----------|
| No raw types | Always parameterize generics |
| No unused imports | Remove all |
| No empty catch blocks | At minimum, log the exception |
| No `System.out` / `System.err` | Use engine logger only |
| No `@Slf4j` / `log.info()` | Use `getLogger().builder(...).level(...).log()` |
| No `@Autowired` in processors/tasklets | Use `ContextAwareClass.getBean()` |
| No `@Bean Job` or `@Bean Step` | Engine creates these from YAML |
| Method length ≤ 50 lines | Extract private helpers |
| Avoid magic numbers/strings | Define in `BatchConstants` |
| Close all JDBC resources | `finally` block with null checks |
| Flush before commit | `entityManager.flush()` before `commit()` |

---

## 15) Task Closure Checklist (Required)

Before closing a task:
1. Verify requested implementation/documentation changes are complete.
2. Verify relevant tests/validation were run or clearly state what could not be run.
3. If any self-improvement trigger occurred (Section 0), append an entry to `.github/memory/lessons.md`.
4. Summarize outcomes and any residual risks clearly.

If step 3 applies and is not done, the task is not complete.