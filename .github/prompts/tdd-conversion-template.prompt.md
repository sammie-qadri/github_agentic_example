# RED-GREEN TDD Conversion Request

I need to convert a COBOL batch process into the Batch Migration Spring Batch architecture (powered by `batch-engine`) using strict RED-GREEN TDD.

## Model Selection

- Use **@explorer** on **Claude Haiku 4.5** or **Gemini 3 Flash (Preview)** for fast file and spec exploration.
- Use **@coder** on **Claude Sonnet 4.6** for straightforward implementation (writing code, tests, YAML config).
- Escalate to **@architect** on **Claude Opus 4.7** for deep reasoning, complex COBOL interpretation, architecture decisions, or tricky debugging.
- Use **Claude Opus 4.6** only as the Tier 1 fallback when **Claude Opus 4.7** is unavailable.

## Source Artifacts

### COBOL Copybook / File Descriptor (FD)
[Insert Copybook or FD here — include PICTURE clauses, REDEFINES, 88-levels]

### JCL (Job Control Language)
[Insert JCL snippet here — include DD statements, EXEC PGM, SORT steps, PARM values]

### Processing Logic / Business Rules
[Insert pseudo-code or description of rules here — include validation rules, filtering criteria, transformation logic]

## Target Details

### Proposed Job Name
[e.g. customerDataLoad — use camelCase]

### Step Type Selection
- [ ] CHUNK (File-to-DB or DB-to-File)
- [ ] TASKLET (Stored Proc, Cleanup, REST API, or multi-table operation)

### Database Table/Entity
[Target table name and any existing entity class]

### Channel Direction
- Input: [NAS / DB / SPOS]
- Output: [NAS / DB / SPOS]

## Conversion Instructions

1. **Analyze**: Review `batch-how-to.md` and existing patterns in the codebase.
2. **Map**: Explicitly map each COBOL construct to its FIT Batch equivalent:
   - FD/COPY layout -> `@Entity` model with `@Column` and `@Transient` fields
   - PICTURE clauses -> Java types (parse in processor)
   - PERFORM paragraphs -> private helper methods
   - EXEC SQL CALL -> stored procedure tasklet
   - 88-level conditions -> constants in `BatchConstants`
   - SORT/MERGE -> `beforeJobTasks` or processor `return null` filtering
   - Commit interval -> `chunkSize`
3. **RED**: Create initial failing tests in `src/test/java/com/example/bst/fit/` that define the success criteria for the conversion.
   - Use JUnit 5 + Mockito (`@ExtendWith(MockitoExtension.class)`)
   - Use `@Spy` for processor/tasklet under test
   - Stub engine base methods: `getBusinessDateAsSqlDate()`, `getEntityManagerFactory()`, `getBstJob()`, `getLogger()`
   - Test per the checklists in the agent instructions (validation, filtering, enrichment, error handling, resource cleanup)
4. **GREEN**: Implement the model, processor/tasklet, and YAML configuration.
   - Models in `com.example.bst.fit.model`
   - Processors in `com.example.bst.fit.batch.process` (extend `BstItemProcessor<I, O>`)
   - Tasklets in `com.example.bst.fit.batch.tasklet` (extend `BstTasklet`)
   - Constants in `com.example.bst.fit.batch.utils.BatchConstants`
   - YAML job entry under `bst.bstJobs` in `application.yml`
5. **REFACTOR**: Ensure code quality and consistency with the rest of the project.

## Key Conventions Reminder

- All FQCNs use `com.example.bst.fit` (not `com.example.bst.pas`)
- Engine classes: `com.example.bst.fit.step.BstItemProcessor`, `com.example.bst.fit.tasklet.BstTasklet`
- Constants class: `BatchConstants`
- Always call `super.process(model)` first in processors
- Use `beforeStep()`/`afterStep()` for EntityManager lifecycle in tasklets
- Use engine logger, never `System.out` or `@Slf4j`
- Define stored procedure names in `BatchConstants`
- Set `uniqueKey`, `businessDate`, `processTS` on every model during processing
- Target ≥ 80% line coverage on new code

Please provide the final output including the changed files and evidence of passing tests.
