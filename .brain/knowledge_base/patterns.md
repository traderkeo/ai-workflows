# Common Patterns & Solutions

> **Purpose**: Quick reference for frequently used patterns, solutions, and approaches in this project.
> **Update When**: New pattern established, better solution discovered, pattern deprecated.
> **Agent Instructions**: Reference before implementing similar features. Add new patterns as discovered.

## Code Patterns

### Pattern: [Pattern Name]
**Use Case**: [When to use this pattern]
**Location**: `path/to/example.ext:line`

**Implementation**:
```[language]
// Example code
```

**Pros**:
-
-

**Cons**:
-

**Related Patterns**: [Links to related patterns]

---

### Pattern: [Another Pattern]
**Use Case**:
**Location**:

**Implementation**:
```[language]

```

---

## API Patterns

### Pattern: REST Endpoint Structure
**Convention**:
```
GET    /api/v1/resource          # List all
GET    /api/v1/resource/:id      # Get one
POST   /api/v1/resource          # Create
PUT    /api/v1/resource/:id      # Update
DELETE /api/v1/resource/:id      # Delete
```

**Response Format**:
```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "timestamp": "ISO-8601",
    "version": "1.0"
  }
}
```

**Location**: Defined in `path/to/api/spec.ext`

---

## Error Handling Patterns

### Pattern: [Error Handling Approach]
**Use Case**: [When to use]

**Implementation**:
```[language]
try {
  // operation
} catch (SpecificError) {
  // handle specific
} catch (Error) {
  // handle generic
}
```

**Error Response Format**:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable",
    "details": {}
  }
}
```

---

## Database Patterns

### Pattern: [Query Pattern]
**Use Case**:
**Example**:
```sql
-- SQL example
```

**Performance Notes**:
-

---

## Testing Patterns

### Pattern: [Test Structure]
**Use Case**: [Unit tests, integration tests, etc.]

**Template**:
```[language]
describe('Feature', () => {
  beforeEach(() => {
    // setup
  });

  it('should do something', () => {
    // arrange
    // act
    // assert
  });
});
```

**Location**: See `path/to/test/example.test.ext`

---

## State Management Patterns

### Pattern: [State Pattern]
**Use Case**:
**Implementation**:
```[language]
// Example
```

---

## Common Solutions

### Problem: [Common Issue]
**Solution**:
[Step-by-step or code example]

**Why This Works**:
[Explanation]

**Gotchas**:
-

---

### Problem: [Another Issue]
**Solution**:

**Why This Works**:

---

## Anti-Patterns to Avoid

### Anti-Pattern: [What Not To Do]
**Why It's Bad**:
-

**Do This Instead**:
[Better approach]

**Example of Bad**:
```[language]
// Don't do this
```

**Example of Good**:
```[language]
// Do this instead
```

---

## Template
```markdown
### Pattern: [Name]
**Use Case**:
**Location**:

**Implementation**:
```[language]

```

**Pros**:
-

**Cons**:
-

**Related**:
```

---
*Last Updated: [Date] | Updated By: [Agent/Human name]*
