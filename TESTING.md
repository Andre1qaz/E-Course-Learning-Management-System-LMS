# Testing Documentation

This document provides comprehensive information about the testing infrastructure and guidelines for the E-Course Learning Management System (LMS).

## Testing Overview

The project includes multiple layers of testing:

1. **Unit Tests** - Test individual components and functions in isolation
2. **Integration Tests** - Test database operations and API endpoints
3. **E2E Tests** - Test complete user flows with Playwright

## Backend Testing

### Unit Tests

- **Framework**: Jest with ts-jest
- **Location**: `backend/src/**/*.spec.ts`
- **Coverage Target**: 70-80% for branches, functions, lines, and statements

#### Running Unit Tests

```bash
cd backend
npm test                    # Run all unit tests
npm test:watch             # Run tests in watch mode
npm test:cov               # Run tests with coverage report
```

#### Coverage Configuration

Coverage is configured in `backend/package.json` with the following thresholds:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

Coverage reports are generated in `backend/coverage/`.

### Integration Tests

- **Framework**: Jest with supertest
- **Location**: `backend/test/integration/*.integration.spec.ts`
- **Database**: Separate test database

#### Running Integration Tests

```bash
cd backend
npm test:e2e               # Run integration tests
```

### Test Database

Integration tests use a separate test database to avoid affecting development/production data:

- **Configuration**: `backend/.env.test`
- **Setup**: `npm run test:setup-db`
- **Teardown**: Tests automatically clean up after each run

## Frontend Testing

### Unit Tests

- **Framework**: Jest with React Testing Library
- **Location**: `frontend/src/**/*.test.tsx` and `frontend/src/**/*.test.ts`
- **Coverage Target**: 70-80% for branches, functions, lines, and statements

#### Running Unit Tests

```bash
cd frontend
npm test                    # Run all unit tests
npm test:watch             # Run tests in watch mode
npm test:coverage          # Run tests with coverage report
```

#### Test Configuration

- **Config**: `frontend/jest.config.js`
- **Setup**: `frontend/jest.setup.js`
- **Mocking**: Next.js router, NextAuth, window.matchMedia, IntersectionObserver

### E2E Tests

- **Framework**: Playwright
- **Location**: `frontend/e2e/*.spec.ts`
- **Browsers**: Chromium, Firefox, WebKit

#### Running E2E Tests

```bash
cd frontend
npm run test:e2e           # Run E2E tests
npm run test:e2e:ui        # Run E2E tests with UI
```

#### E2E Test Configuration

- **Config**: `frontend/playwright.config.ts`
- **Reports**: HTML reports generated in `frontend/playwright-report/`

## Test Utilities

### Backend Test Helpers

Location: `backend/src/test-utils/`

- **test-helpers.ts**: Helper functions for creating test data
- **database.spec.ts**: Database setup and teardown utilities

### Usage Example

```typescript
import { TestHelpers } from '../test-utils/test-helpers';

// Create test user
const user = await TestHelpers.createTestUser(prisma, {
  email: 'test@example.com',
  role: Role.MAHASISWA,
});

// Create test course
const course = await TestHelpers.createTestCourse(prisma, user.id);

// Cleanup database
await TestHelpers.cleanupDatabase(prisma);
```

## Writing Tests

### Backend Service Tests

```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ServiceName,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should do something', async () => {
    // Test implementation
  });
});
```

### Frontend Component Tests

```typescript
import { render, screen } from '@testing-library/react'
import { ComponentName } from './component'

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName prop="value" />)
    expect(screen.getByText('expected text')).toBeInTheDocument()
  })

  it('handles user interaction', () => {
    const handleClick = jest.fn()
    render(<ComponentName onClick={handleClick} />)
    
    screen.getByRole('button').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## Coverage Reports

### Backend Coverage

```bash
cd backend
npm run test:cov
```

Reports are generated in `backend/coverage/` and can be viewed in a browser.

### Frontend Coverage

```bash
cd frontend
npm run test:coverage
```

Reports are generated in `frontend/coverage/` and can be viewed in a browser.

## CI/CD Integration

Tests are configured to run in CI/CD pipelines:

```yaml
# Example CI configuration
- name: Run Backend Tests
  run: |
    cd backend
    npm ci
    npm test
    npm run test:cov

- name: Run Frontend Tests
  run: |
    cd frontend
    npm ci
    npm test
    npm run test:coverage

- name: Run E2E Tests
  run: |
    cd frontend
    npm run test:e2e
```

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Mock External Dependencies**: Use mocks for databases, APIs, and external services
3. **Test Naming**: Use descriptive test names that explain what is being tested
4. **Arrange-Act-Assert**: Structure tests clearly with setup, execution, and assertions
5. **Coverage Goals**: Aim for 70-80% coverage across all metrics
6. **Fast Tests**: Unit tests should be fast; integration tests can be slower
7. **Clean Up**: Always clean up test data in `afterEach` or `afterAll` hooks

## Troubleshooting

### Common Issues

1. **Database Connection Errors**: Ensure test database is running and configured in `.env.test`
2. **Test Timeout**: Increase timeout for slow tests using `jest.setTimeout(30000)`
3. **Mock Issues**: Verify that mocks are properly reset in `beforeEach`
4. **Coverage Low**: Add tests for uncovered code paths

### Running Specific Tests

```bash
# Backend - specific test file
npm test auth.service.spec.ts

# Frontend - specific test file
npm test button.test.tsx

# Run tests matching pattern
npm test --testNamePattern="should login"
```

## Future Improvements

- [ ] Add visual regression testing
- [ ] Implement performance testing
- [ ] Add API contract testing
- [ ] Set up test data fixtures
- [ ] Add mutation testing for better coverage analysis