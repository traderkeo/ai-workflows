# Testing Strategy

> **Purpose**: Document testing approach, coverage status, and test-related decisions.
> **Update When**: Test strategy changes, new test types added, or coverage goals updated.
> **Agent Instructions**: Reference when writing tests. Update test status as tests are added.

## Testing Philosophy

### Goals
- [Goal 1, e.g., "Maintain >80% code coverage"]
- [Goal 2, e.g., "Catch regressions before production"]
- [Goal 3, e.g., "Enable confident refactoring"]

### Principles
- [Principle, e.g., "Test behavior, not implementation"]
- [Principle, e.g., "Prefer integration tests over unit tests for complex flows"]
- [Principle, e.g., "Keep tests fast and deterministic"]

---

## Test Types & Strategy

### Unit Tests
**Purpose**: Test individual functions/methods in isolation
**Coverage Goal**: [Percentage]%
**Current Coverage**: [Percentage]%

**When to Write**:
- Pure functions
- Business logic
- Utility functions
- Edge cases and error handling

**Tools**:
- Framework: [e.g., Jest, pytest, Go test]
- Mocking: [e.g., jest.mock, unittest.mock]
- Runner: [e.g., npm test]

**Location**: `path/to/tests/unit/`

**Naming Convention**: `[filename].test.[ext]` or `[filename]_test.[ext]`

**Example**:
```[language]
describe('functionName', () => {
  it('should handle valid input', () => {
    expect(functionName(input)).toBe(expected);
  });

  it('should throw error on invalid input', () => {
    expect(() => functionName(invalid)).toThrow();
  });
});
```

---

### Integration Tests
**Purpose**: Test multiple components working together
**Coverage Goal**: [Critical paths covered]
**Current Coverage**: [Status]

**When to Write**:
- API endpoints
- Database operations
- Service interactions
- Authentication flows

**Tools**:
- Framework: [Test framework]
- Test Database: [How database is handled]
- HTTP Client: [e.g., supertest, httpx]

**Location**: `path/to/tests/integration/`

**Example**:
```[language]
describe('POST /api/resource', () => {
  beforeEach(async () => {
    await setupTestDB();
  });

  it('should create resource with valid data', async () => {
    const response = await request(app)
      .post('/api/resource')
      .send(validData);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject(expected);
  });
});
```

---

### End-to-End (E2E) Tests
**Purpose**: Test complete user flows through the system
**Coverage Goal**: [Critical user journeys]
**Current Coverage**: [Status]

**When to Write**:
- Critical user flows
- Happy paths
- Key conversion funnels
- Cross-browser compatibility

**Tools**:
- Framework: [e.g., Playwright, Cypress, Selenium]
- Browser: [Browsers tested]
- CI Integration: [How E2E runs in CI]

**Location**: `path/to/tests/e2e/`

**Example**:
```[language]
test('user can complete checkout flow', async ({ page }) => {
  await page.goto('/products');
  await page.click('[data-testid="add-to-cart"]');
  await page.click('[data-testid="checkout"]');
  await page.fill('[name="email"]', 'test@example.com');
  await page.click('[data-testid="submit"]');

  await expect(page.locator('.success-message')).toBeVisible();
});
```

---

### Performance Tests
**Purpose**: Validate performance requirements
**Current Status**: [Implemented / Not Implemented]

**When to Run**:
- Before major releases
- After performance-critical changes
- On schedule: [Frequency]

**Tools**:
- Tool: [e.g., k6, JMeter, Lighthouse]

**Metrics**:
- Response time: [Target]
- Throughput: [Target]
- Error rate: [Target]

---

### Security Tests
**Purpose**: Identify security vulnerabilities
**Current Status**: [Implemented / Not Implemented]

**When to Run**:
- Before releases
- After authentication/authorization changes
- Dependency updates

**Tools**:
- SAST: [e.g., npm audit, Snyk]
- DAST: [Tool if applicable]
- Dependency Scanning: [Tool]

**What We Test**:
- Input validation
- SQL injection
- XSS vulnerabilities
- Authentication/authorization
- Dependency vulnerabilities

---

## Test Coverage

### Current Coverage by Area

| Area/Module | Unit | Integration | E2E | Status |
|-------------|------|-------------|-----|--------|
| [Module 1] | 85% | ✅ | ✅ | 🟢 Good |
| [Module 2] | 45% | ⚠️ | ❌ | 🟡 Needs Work |
| [Module 3] | 90% | ✅ | N/A | 🟢 Good |

### Coverage Goals

- **Overall Target**: [X]%
- **Critical Paths**: 100%
- **Business Logic**: [X]%
- **UI Components**: [X]%

### Gaps

#### Critical Gaps
- [Area] - No tests (Priority: 🔴)
- [Feature] - Incomplete coverage (Priority: 🔴)

#### Non-Critical Gaps
- [Area] - Low coverage (Priority: 🟡)

---

## Test Data Management

### Fixtures
**Location**: `path/to/fixtures/`
**Format**: [JSON, YAML, etc.]

**How to Use**:
```[language]
const testData = require('./fixtures/sample-data.json');
```

### Factory Functions
**Location**: `path/to/factories/`

**Example**:
```[language]
function createTestUser(overrides = {}) {
  return {
    id: 'test-id',
    name: 'Test User',
    email: 'test@example.com',
    ...overrides
  };
}
```

### Test Database
**Strategy**: [e.g., In-memory, Docker container, Dedicated test DB]
**Setup**: [How to initialize]
**Teardown**: [How to clean up]

**Seeding**:
```bash
[command to seed test data]
```

---

## Mocking Strategy

### What We Mock
- External API calls
- Database in unit tests
- Time/Date functions
- Random number generation
- File system operations

### What We Don't Mock
- [Things tested as-is]

### Mock Examples

**Mocking API calls**:
```[language]
// Example
jest.mock('./api', () => ({
  fetchData: jest.fn(() => Promise.resolve(mockData))
}));
```

**Mocking database**:
```[language]
// Example
```

---

## Continuous Integration

### CI Pipeline
**Platform**: [e.g., GitHub Actions, GitLab CI, Jenkins]

**Test Stages**:
1. Lint & Format Check
2. Unit Tests
3. Integration Tests
4. E2E Tests (on main branch)
5. Security Scans

**When Tests Run**:
- Every PR
- Every commit to main
- Nightly for E2E suite
- Before deployment

**Failure Policy**:
- PR blocked if tests fail
- [Other policies]

---

## Test Maintenance

### Flaky Tests
**Definition**: Tests that intermittently fail

**Current Flaky Tests**:
- [Test name] - [Issue] - [Owner]

**How to Handle**:
1. Document the flake
2. Investigate root cause
3. Fix or quarantine
4. Remove if unfixable

### Slow Tests
**Definition**: Tests taking longer than [X seconds]

**Current Slow Tests**:
- [Test name] - [Duration] - [Optimization plan]

**Optimization Strategies**:
- Parallelize test execution
- Use test database snapshots
- Mock slow operations
- Split large test files

---

## Running Tests

### Run All Tests
```bash
[command to run all tests]
```

### Run Unit Tests Only
```bash
[command]
```

### Run Integration Tests Only
```bash
[command]
```

### Run E2E Tests
```bash
[command]
```

### Run Specific Test File
```bash
[command] path/to/test.test.ext
```

### Run Tests in Watch Mode
```bash
[command]
```

### Run Tests with Coverage
```bash
[command]
```

### View Coverage Report
```bash
[command to generate and open coverage report]
```

---

## Test Writing Guidelines

### Structure
**Arrange-Act-Assert (AAA) Pattern**:
```[language]
it('should do something', () => {
  // Arrange: Setup test data and conditions
  const input = setupInput();

  // Act: Execute the code under test
  const result = functionUnderTest(input);

  // Assert: Verify the outcome
  expect(result).toBe(expected);
});
```

### Naming
**Convention**: `should [expected behavior] when [condition]`

**Examples**:
- ✅ `should return user when valid ID is provided`
- ✅ `should throw error when ID is null`
- ❌ `test1`
- ❌ `it works`

### Test Organization
```
describe('Component/Module', () => {
  describe('methodName', () => {
    it('should handle case 1', () => {});
    it('should handle case 2', () => {});
    it('should handle error case', () => {});
  });
});
```

### What to Test
✅ Do Test:
- Happy path
- Edge cases
- Error conditions
- Boundary values
- State changes
- Integration points

❌ Don't Test:
- Third-party library internals
- Framework behavior
- Getters/setters with no logic
- Private methods (test through public interface)

---

## Test-Driven Development (TDD)

**Status**: [Practiced / Not Practiced / Situational]

**When We Use TDD**:
- [Context, e.g., "For new business logic"]
- [Context, e.g., "When fixing bugs"]

**TDD Workflow**:
1. Write failing test
2. Write minimal code to pass
3. Refactor
4. Repeat

---

## Debugging Tests

### Run Single Test
```bash
[command to run single test]
```

### Debug Mode
```bash
[command to run tests in debug mode]
```

### Common Issues
**Issue**: [Common problem]
**Solution**: [How to fix]

**Issue**: [Another problem]
**Solution**: [Fix]

---

## Test Metrics

### Current Metrics
- **Total Tests**: [Count]
- **Unit Tests**: [Count]
- **Integration Tests**: [Count]
- **E2E Tests**: [Count]
- **Average Test Duration**: [Time]
- **Test Success Rate**: [Percentage]%

### Historical Trends
- [Metric]: [Trend over time]

---

## Responsibilities

### When Adding New Code
- [ ] Write tests for new functionality
- [ ] Update existing tests if behavior changed
- [ ] Ensure tests pass locally before pushing
- [ ] Check coverage doesn't decrease

### When Reviewing PRs
- [ ] Verify tests exist for new code
- [ ] Check test quality and coverage
- [ ] Ensure tests are clear and maintainable
- [ ] Validate tests actually test the right thing

---

## Testing Resources

### Documentation
- [Link to testing docs]
- [Link to best practices]

### Examples
- See: `path/to/good/example.test.ext`
- See: `path/to/another/example.test.ext`

### Learning Resources
- [Article/Tutorial]
- [Video/Course]

---

## Template
```markdown
### [Test Type]
**Purpose**:
**Coverage Goal**:
**Current Coverage**:

**When to Write**:
-

**Tools**:
-

**Location**: path/to/tests/

**Example**:
```[language]

```
```

---
*Last Updated: [Date] | Updated By: [Agent/Human name]*
*Overall Coverage: [XX]% | Tests Passing: [XXX]/[XXX]*
