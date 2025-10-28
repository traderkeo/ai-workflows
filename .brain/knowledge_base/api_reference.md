# API & Interface Reference

> **Purpose**: Quick reference for internal APIs, key functions, and interfaces used across the project.
> **Update When**: New APIs added, signatures changed, or interfaces modified.
> **Agent Instructions**: Reference when calling internal APIs. Update when creating new public interfaces.

## Internal APIs

### Module: [Module Name]
**Location**: `path/to/module.ext`
**Purpose**: [What this module does]

#### Function: `functionName(param1, param2)`
**Description**: [What it does]

**Parameters**:
- `param1` (type): Description
- `param2` (type): Description

**Returns**: `type` - Description

**Example**:
```[language]
const result = functionName(value1, value2);
```

**Throws**:
- `ErrorType`: When [condition]

**Notes**:
-

---

#### Function: `anotherFunction()`
**Description**:

**Parameters**:

**Returns**:

**Example**:
```[language]

```

---

### Module: [Another Module]
**Location**: `path/to/module.ext`
**Purpose**:

---

## Interfaces & Types

### Interface: [InterfaceName]
**Location**: `path/to/types.ext`

```typescript
interface InterfaceName {
  property1: type;
  property2: type;
  method(): returnType;
}
```

**Usage**:
[When and how to use this interface]

**Example**:
```typescript
const obj: InterfaceName = {
  property1: value,
  property2: value,
  method() {
    return value;
  }
};
```

---

## Data Models

### Model: [ModelName]
**Location**: `path/to/model.ext`
**Table/Collection**: `table_name`

**Schema**:
```[language]
{
  field1: type,        // Description
  field2: type,        // Description
  field3: type,        // Description
}
```

**Relationships**:
- belongsTo: [OtherModel]
- hasMany: [AnotherModel]

**Methods**:
- `.methodName()`: Description

**Query Examples**:
```[language]
// Find by ID
Model.findById(id)

// Find by criteria
Model.find({ field: value })

// Create
Model.create({ data })

// Update
Model.update(id, { data })

// Delete
Model.delete(id)
```

---

## External APIs

### API: [External Service Name]
**Documentation**: [URL]
**Authentication**: [Method]
**Rate Limits**: [Limits]

#### Endpoint: [Name]
**URL**: `https://api.example.com/endpoint`
**Method**: GET/POST/PUT/DELETE
**Auth Required**: Yes/No

**Request**:
```http
GET /endpoint HTTP/1.1
Header: value
```

**Response**:
```json
{
  "field": "value"
}
```

**Error Codes**:
- 400: Description
- 401: Description
- 500: Description

**Rate Limit**: [X requests per minute]

**Example**:
```[language]
// Code example
```

---

## Utility Functions

### Utility: [UtilityName]
**Location**: `path/to/utils.ext`

#### Function: `utilFunction(args)`
**Purpose**: [What it does]

**Parameters**:
- `arg` (type): Description

**Returns**: `type`

**Example**:
```[language]
const result = utilFunction(value);
```

**Use Cases**:
-

---

## Event System

### Event: [EventName]
**Emitted By**: [Component/Module]
**Payload**:
```[language]
{
  field: type,
  field: type
}
```

**Example**:
```[language]
// Emit
eventEmitter.emit('EventName', payload);

// Listen
eventEmitter.on('EventName', (payload) => {
  // handle
});
```

---

## Middleware/Hooks

### Middleware: [MiddlewareName]
**Location**: `path/to/middleware.ext`
**Purpose**: [What it does]

**Usage**:
```[language]
// How to use
app.use(middlewareName);
```

**Options**:
```[language]
{
  option1: type,
  option2: type
}
```

---

## Configuration

### Config: [ConfigName]
**Location**: `path/to/config.ext`

**Options**:
```[language]
{
  setting1: value,  // Description
  setting2: value,  // Description
}
```

**Environment Variables**:
- `ENV_VAR_NAME`: Description (default: value)
- `ANOTHER_VAR`: Description

**Example**:
```[language]
const config = {
  setting: process.env.ENV_VAR_NAME || 'default'
};
```

---

## Constants & Enums

### Enum: [EnumName]
**Location**: `path/to/constants.ext`

```[language]
enum EnumName {
  VALUE1 = 'value1',
  VALUE2 = 'value2'
}
```

**Usage**:
[When to use these values]

---

## Authentication & Authorization

### Auth Flow
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Check Permissions
```[language]
// Function to check permissions
hasPermission(user, resource, action)
```

**Permission Levels**:
- `admin`: Can do everything
- `editor`: Can do X
- `viewer`: Can do Y

---

## Database Queries

### Common Query: [QueryName]
**Purpose**: [What it retrieves]

```sql
-- SQL example
SELECT * FROM table
WHERE condition
```

**Returns**: [Description]

**When to Use**: [Context]

---

## Template
```markdown
### Module: [Name]
**Location**: path/to/file.ext
**Purpose**:

#### Function: `functionName(params)`
**Description**:

**Parameters**:
- `param` (type): Description

**Returns**: type - Description

**Example**:
```[language]

```

**Notes**:
-
```

---
*Last Updated: [Date] | Updated By: [Agent/Human name]*
