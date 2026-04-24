---
name: scaffold
description: "Generate boilerplate for new project components (processor, tasklet, model) following batch-migration-example conventions. Creates the Java class and corresponding test file with correct package, imports, annotations, and structure. Use when: starting a new component implementation."
argument-hint: "Component type and name (e.g., 'processor MyFeatureLoadProcessor', 'tasklet MyProcTasklet', 'model MyEntity')"
---

# Component Scaffolding

Generate standards-compliant boilerplate for batch-migration-example components.

## When to Use

- Starting a new processor, tasklet, or model
- Need a correct starting point that follows all project conventions
- Ensuring correct package, imports, and structure from the start
- Before beginning the RED phase of TDD (scaffold the test first, then the implementation)

## Supported Components

### `processor` — BstItemProcessor

```
/scaffold processor {ClassName}
```

Creates two files:

**1. Processor:** `src/main/java/com/example/bst/fit/batch/process/{ClassName}.java`

```java
package com.example.bst.fit.batch.process;

import com.example.bst.fit.batch.utils.BatchConstants;
import com.example.bst.fit.step.BstItemProcessor;
import com.example.bst.fit.step.CustomSkipException;
// TODO: import model class from com.example.bst.fit.model

import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.ZoneId;

public class {ClassName} extends BstItemProcessor<{Model}, {Model}> {

    @Override
    public {Model} process({Model} model) throws Exception {
        super.process(model);

        // 1. Pre-filter (return null to skip record)

        // 2. Validate (throw CustomSkipException on failure)

        // 3. Enrich
        model.setUniqueKey(/* TODO: build composite unique key */);
        model.setBusinessDate(getBusinessDateAsSqlDate());
        model.setProcessTS(Timestamp.valueOf(
            LocalDateTime.now(ZoneId.of(BatchConstants.US_EASTERN_ZONE))));

        return model;
    }
}
```

**2. Test:** `src/test/java/com/example/bst/fit/batch/process/{ClassName}Test.java`

```java
package com.example.bst.fit.batch.process;

import com.example.bst.fit.batch.utils.BatchConstants;
// TODO: import model class
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Date;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("{ClassName} Tests")
class {ClassName}Test {

    @Spy
    private {ClassName} processor;

    @BeforeEach
    void setUp() throws Exception {
        doReturn(Date.valueOf("2026-01-15")).when(processor).getBusinessDateAsSqlDate();
        doNothing().when(processor).superProcess(any());
    }

    @Nested
    @DisplayName("Valid Record Processing")
    class ValidRecord {
        @Test
        @DisplayName("Should enrich valid record with uniqueKey, businessDate, and processTS")
        void shouldEnrichValidRecord() throws Exception {
            // Arrange — TODO: create and populate model

            // Act — TODO: var result = processor.process(model);

            // Assert — TODO: verify enrichment
        }
    }

    @Nested
    @DisplayName("Validation Errors")
    class ValidationErrors {
        // TODO: Add test for each validation rule → CustomSkipException
    }

    @Nested
    @DisplayName("Filtering")
    class Filtering {
        // TODO: Add test for each filter condition → returns null
    }

    @Nested
    @DisplayName("Edge Cases")
    class EdgeCases {
        // TODO: null fields, empty strings, max-length values, leading zeros
    }
}
```

---

### `tasklet` — BstTasklet (Stored Procedure variant)

```
/scaffold tasklet {ClassName}
```

Creates two files:

**1. Tasklet:** `src/main/java/com/example/bst/fit/batch/tasklet/{ClassName}.java`

```java
package com.example.bst.fit.batch.tasklet;

import com.example.bst.fit.batch.utils.BatchConstants;
import com.example.bst.fit.tasklet.BstTasklet;
import org.springframework.batch.core.StepContribution;
import org.springframework.batch.core.scope.context.ChunkContext;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.orm.jpa.EntityManagerFactoryInfo;

import javax.sql.DataSource;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.ResultSet;
import java.util.logging.Level;

public class {ClassName} extends BstTasklet {

    @Override
    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
        Connection con = null;
        CallableStatement stmt = null;
        try {
            EntityManagerFactoryInfo info = (EntityManagerFactoryInfo) getEntityManagerFactory();
            DataSource dataSource = info.getDataSource();
            if (dataSource == null) {
                throw new IllegalStateException("DataSource is null");
            }
            con = dataSource.getConnection();

            // TODO: Prepare and execute stored procedure call
            // stmt = con.prepareCall("call " + BatchConstants.PROC_NAME + "(?, ?, ?)");
            // stmt.setDate(1, getBusinessDateAsSqlDate());
            // ResultSet rs = stmt.executeQuery();

            return RepeatStatus.FINISHED;
        } catch (Exception e) {
            getLogger().builder("Error in {ClassName}: " + e.getMessage())
                .level(Level.SEVERE).log();
            throw e;
        } finally {
            if (stmt != null) stmt.close();
            if (con != null) con.close();
        }
    }
}
```

**2. Test:** `src/test/java/com/example/bst/fit/batch/tasklet/{ClassName}Test.java`

```java
package com.example.bst.fit.batch.tasklet;

import com.example.bst.fit.batch.utils.BatchConstants;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.batch.core.StepContribution;
import org.springframework.batch.core.scope.context.ChunkContext;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.orm.jpa.EntityManagerFactoryInfo;

import javax.persistence.EntityManagerFactory;
import javax.sql.DataSource;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.Date;
import java.sql.ResultSet;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("{ClassName} Tests")
class {ClassName}Test {

    @Spy
    private {ClassName} tasklet;

    @Mock private StepContribution contribution;
    @Mock private ChunkContext chunkContext;
    @Mock private EntityManagerFactory emf;
    @Mock private DataSource dataSource;
    @Mock private Connection con;
    @Mock private CallableStatement stmt;
    @Mock private ResultSet rs;

    @BeforeEach
    void setUp() throws Exception {
        doReturn(Date.valueOf("2026-01-15")).when(tasklet).getBusinessDateAsSqlDate();
        doReturn(emf).when(tasklet).getEntityManagerFactory();
        when(((EntityManagerFactoryInfo) emf).getDataSource()).thenReturn(dataSource);
        when(dataSource.getConnection()).thenReturn(con);
    }

    @Nested
    @DisplayName("Successful Execution")
    class SuccessfulExecution {
        @Test
        @DisplayName("Should return FINISHED on successful stored procedure call")
        void shouldReturnFinished() throws Exception {
            // Arrange — TODO: mock stored procedure result

            // Act
            RepeatStatus result = tasklet.execute(contribution, chunkContext);

            // Assert
            assertEquals(RepeatStatus.FINISHED, result);
        }
    }

    @Nested
    @DisplayName("Error Handling")
    class ErrorHandling {
        @Test
        @DisplayName("Should throw IllegalStateException when DataSource is null")
        void shouldThrowWhenDataSourceNull() throws Exception {
            when(((EntityManagerFactoryInfo) emf).getDataSource()).thenReturn(null);

            assertThrows(IllegalStateException.class,
                () -> tasklet.execute(contribution, chunkContext));
        }

        // TODO: Add test for non-zero return code → DbException
    }

    @Nested
    @DisplayName("Resource Cleanup")
    class ResourceCleanup {
        // TODO: Verify Connection and Statement closed in finally
    }
}
```

---

### `model` — JPA Entity

```
/scaffold model {ClassName}
```

Creates two files:

**1. Entity:** `src/main/java/com/example/bst/fit/model/{ClassName}.java`

```java
package com.example.bst.fit.model;

import lombok.Data;

import javax.persistence.*;
import java.io.Serializable;
import java.sql.Date;
import java.sql.Timestamp;

@Data
@Entity(name = "{TABLE_NAME}")
@Table(name = "{TABLE_NAME}")
public class {ClassName} implements Serializable {

    @Id
    @Column(name = "UNIQUE_KEY")
    private String uniqueKey;

    @Column(name = "BUSINESS_DATE")
    private Date businessDate;

    @Column(name = "PROCESS_TS")
    private Timestamp processTS;

    // TODO: Add @Column fields for each DB column (UPPER_SNAKE_CASE names)

    // TODO: Add @Transient fields for raw file input (suffix each with 'In')
}
```

**2. Test:** `src/test/java/com/example/bst/fit/model/{ClassName}Test.java`

```java
package com.example.bst.fit.model;

import org.junit.jupiter.api.*;

import javax.persistence.*;
import java.lang.reflect.Field;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("{ClassName} Structural Contract Tests")
class {ClassName}Test {

    @Nested
    @DisplayName("Annotations")
    class Annotations {
        @Test
        @DisplayName("Should have @Data, @Entity, and @Table annotations")
        void shouldHaveRequiredAnnotations() {
            assertNotNull({ClassName}.class.getAnnotation(Entity.class));
            assertNotNull({ClassName}.class.getAnnotation(Table.class));
            // @Data is compile-time — verify getters/setters exist
        }
    }

    @Nested
    @DisplayName("Column Mappings")
    class ColumnMappings {
        // TODO: Assert each @Column field has correct name and type
    }

    @Nested
    @DisplayName("Transient Fields")
    class TransientFields {
        // TODO: Assert @Transient fields end with 'In' suffix
    }

    @Nested
    @DisplayName("Lombok Functionality")
    class LombokFunctionality {
        @Test
        @DisplayName("Should support getter and setter for all fields")
        void shouldSupportGettersAndSetters() {
            {ClassName} entity = new {ClassName}();
            // TODO: Set and get each field to verify Lombok @Data
        }
    }
}
```

---

## YAML Job Stub

If requested, also add a YAML job stub for `application.yml`:

```yaml
# === {ClassName} ===
- jobName: {camelCaseJobName}
  jobDescription: "{human-readable description}"
  channel:
    input: "{NAS|DB}"
    output: "{DB|NAS}"
  stepType: "{CHUNK|TASKLET}"
  # TODO: Complete configuration (processor, file settings, etc.)
```

## Integration

- Use `/scaffold` before starting the RED phase of TDD
- The scaffold gives you a correct starting structure — fill in the TODOs
- After scaffolding, run `/verify` to confirm clean compilation
