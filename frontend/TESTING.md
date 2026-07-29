# Testing Guide

This document describes the testing strategy and implementation for Phase 11 of the AI Customer Service Web Application frontend.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Unit Testing (T11.1)](#unit-testing-t111)
3. [Integration Testing (T11.2)](#integration-testing-t112)
4. [End-to-End Testing (T11.3)](#end-to-end-testing-t113)
5. [Accessibility Testing (T11.4)](#accessibility-testing-t114)
6. [Security Testing (T11.5)](#security-testing-t115)
7. [Running Tests](#running-tests)
8. [CI/CD Integration](#cicd-integration)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Testing Strategy

### Testing Pyramid

```
        /\
       /  \
      / E2E \
     /--------\
    /Integration\
   /--------------\
  /   Unit Tests   \
 /------------------\
```

- **Unit Tests (70%)**: Fast, isolated tests for individual components, services, and utilities
- **Integration Tests (20%)**: Test interactions between multiple components/services
- **E2E Tests (10%)**: Full user journey tests across the entire application

### Coverage Goals

- **Overall Coverage**: 80%+
- **Critical Paths**: 90%+
- **Utilities/Services**: 85%+
- **Components**: 75%+

---

## Unit Testing (T11.1)

### Technology Stack

- **Framework**: Vitest
- **Testing Library**: @testing-library/angular
- **Environment**: Happy DOM
- **Coverage**: V8

### Configuration

Location: `vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

### Writing Unit Tests

#### Service Testing Example

```typescript
import { TestBed } from '@angular/core/testing';
import { ApiGatewayService } from './api-gateway.service';

describe('ApiGatewayService', () => {
  let service: ApiGatewayService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiGatewayService],
    });
    service = TestBed.inject(ApiGatewayService);
  });

  it('should build URL from segments', () => {
    const url = service.url('products', '123');
    expect(url).toContain('/products/123');
  });
});
```

#### Component Testing Example

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner';

describe('LoadingSpinnerComponent', () => {
  let component: LoadingSpinnerComponent;
  let fixture: ComponentFixture<LoadingSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply custom diameter', () => {
    component.diameter = 64;
    fixture.detectChanges();
    
    const spinner = fixture.nativeElement.querySelector('mat-spinner');
    expect(spinner?.getAttribute('diameter')).toBe('64');
  });
});
```

#### Pipe Testing Example

```typescript
import { SafeTextPipe } from './safe-text.pipe';
import { DomSanitizer } from '@angular/platform-browser';

describe('SafeTextPipe', () => {
  let pipe: SafeTextPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new SafeTextPipe(sanitizer);
  });

  it('should remove script tags', () => {
    const malicious = '<script>alert("XSS")</script>Hello';
    const result = pipe.transform(malicious);
    expect(String(result)).not.toContain('<script>');
  });
});
```

### Test Organization

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   ├── api-gateway.service.ts
│   │   │   └── api-gateway.service.spec.ts
│   │   └── auth/
│   │       ├── auth.service.ts
│   │       └── auth.service.spec.ts
│   └── shared/
│       ├── components/
│       │   └── loading-spinner/
│       │       ├── loading-spinner.ts
│       │       └── loading-spinner.spec.ts
│       └── pipes/
│           ├── safe-text.pipe.ts
│           └── safe-text.pipe.spec.ts
└── test-setup.ts
```

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run with UI
npm run test:ui

# Run in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

---

## Integration Testing (T11.2)

### Purpose

Integration tests verify that multiple components/services work together correctly.

### Example: Authentication Flow

Location: `src/app/core/auth/auth.integration.spec.ts`

```typescript
describe('Authentication Integration', () => {
  let authService: AuthService;
  let tokenStorage: TokenStorageService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, TokenStorageService],
    });

    authService = TestBed.inject(AuthService);
    tokenStorage = TestBed.inject(TokenStorageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should complete full login flow', (done) => {
    authService.login(credentials).subscribe({
      next: (response) => {
        expect(tokenStorage.getAccessToken()).toBe(response.accessToken);
        expect(authService.isAuthenticated()).toBe(true);
        done();
      },
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush(mockLoginResponse);
  });
});
```

### Key Integration Test Scenarios

1. **Authentication Flow**
   - Login → Token storage → API requests with auth header
   - Token refresh → Update stored tokens
   - Logout → Clear tokens → Redirect

2. **Form Submission**
   - Form validation → API call → Success/error handling → UI update

3. **Data Flow**
   - Service → HTTP → Response → State update → Component update

4. **Guard Integration**
   - Route access → Auth check → Redirect if unauthorized

### Running Integration Tests

```bash
# Run integration tests only
npm run test:integration
```

---

## End-to-End Testing (T11.3)

### Technology Stack

- **Framework**: Playwright
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12, iPad Pro

### Configuration

Location: `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
});
```

### Writing E2E Tests

#### Authentication Test Example

Location: `e2e/auth.e2e.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.locator('input[type="email"]').fill('customer@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    
    await expect(page).toHaveURL(/\/home/);
    await expect(page.locator('[aria-label*="user menu"]')).toBeVisible();
  });
});
```

#### Chat Test Example

Location: `e2e/chat.e2e.spec.ts`

```typescript
test('should send and receive messages', async ({ page }) => {
  // Login first
  await page.goto('/auth/login');
  await page.locator('input[type="email"]').fill('customer@example.com');
  await page.locator('input[type="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  
  // Open chat
  await page.locator('[aria-label*="chat"]').first().click();
  
  // Send message
  await page.locator('textarea[placeholder*="message"]').fill('Hello');
  await page.locator('button[aria-label*="send"]').click();
  
  // Verify message sent
  await expect(page.locator('.message-user')).toContainText('Hello');
  
  // Wait for AI response
  await expect(page.locator('.message-assistant')).toBeVisible({ timeout: 10000 });
});
```

### E2E Test Organization

```
e2e/
├── auth.e2e.spec.ts          # Authentication flows
├── chat.e2e.spec.ts          # Chat functionality
├── products.e2e.spec.ts      # Product catalog
├── orders.e2e.spec.ts        # Order management
├── accessibility.e2e.spec.ts # Accessibility tests
└── security.e2e.spec.ts      # Security tests
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/auth.e2e.spec.ts

# Run on specific browser
npx playwright test --project=chromium
```

---

## Accessibility Testing (T11.4)

### Technology Stack

- **Framework**: Playwright + axe-core
- **Standards**: WCAG 2.1 Level AA

### Automated Accessibility Testing

Location: `e2e/accessibility.e2e.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

### Keyboard Navigation Testing

```typescript
test('should support keyboard navigation', async ({ page }) => {
  await page.goto('/auth/login');
  
  // Tab through form
  await page.keyboard.press('Tab');
  await expect(page.locator('input[type="email"]')).toBeFocused();
  
  await page.keyboard.press('Tab');
  await expect(page.locator('input[type="password"]')).toBeFocused();
  
  await page.keyboard.press('Tab');
  await expect(page.locator('button[type="submit"]')).toBeFocused();
});
```

### Accessibility Checklist

- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Buttons have accessible names
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Sufficient color contrast (4.5:1 for text)
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] ARIA labels for icon buttons
- [ ] Skip navigation link present
- [ ] Semantic HTML landmarks
- [ ] Error messages associated with inputs
- [ ] Touch targets ≥ 44x44 pixels

### Running Accessibility Tests

```bash
# Run accessibility tests
npm run test:accessibility

# Generate accessibility report
npx playwright test e2e/accessibility.e2e.spec.ts --reporter=html
```

---

## Security Testing (T11.5)

### Security Test Categories

1. **XSS Prevention**
2. **CSRF Protection**
3. **Authentication Security**
4. **Input Validation**
5. **Secure Headers**
6. **Session Security**

### XSS Prevention Testing

Location: `e2e/security.e2e.spec.ts`

```typescript
test('should sanitize user input', async ({ page }) => {
  await page.goto('/auth/login');
  
  const xssPayload = '<script>alert("XSS")</script>';
  await page.locator('input[type="email"]').fill(xssPayload);
  await page.locator('button[type="submit"]').click();
  
  // Verify script is not executed
  const alerts = [];
  page.on('dialog', (dialog) => {
    alerts.push(dialog.message());
    dialog.dismiss();
  });
  
  await page.waitForTimeout(1000);
  expect(alerts).toHaveLength(0);
});
```

### CSRF Protection Testing

```typescript
test('should include CSRF token', async ({ page }) => {
  const requests: any[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST') {
      requests.push({
        url: request.url(),
        headers: request.headers(),
      });
    }
  });
  
  // Perform action that makes POST request
  await page.goto('/auth/login');
  await page.locator('input[type="email"]').fill('test@example.com');
  await page.locator('input[type="password"]').fill('password');
  await page.locator('button[type="submit"]').click();
  
  // Verify CSRF token present
  const postRequests = requests.filter((r) => r.url.includes('/api/'));
  for (const req of postRequests) {
    expect(req.headers['x-csrf-token']).toBeTruthy();
  }
});
```

### Security Headers Testing

```typescript
test('should have security headers', async ({ page }) => {
  const response = await page.goto('/');
  const headers = response!.headers();
  
  expect(headers['x-frame-options']).toBeTruthy();
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['content-security-policy']).toBeTruthy();
  expect(headers['referrer-policy']).toBeTruthy();
});
```

### Running Security Tests

```bash
# Run security tests
npm run test:security

# Run all security checks
npx playwright test e2e/security.e2e.spec.ts
```

---

## Running Tests

### Quick Reference

```bash
# Unit Tests
npm test                    # Run all unit tests
npm run test:ui            # Run with UI
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage

# Integration Tests
npm run test:integration   # Run integration tests

# E2E Tests
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Run with UI
npm run test:e2e:headed   # Run in headed mode
npm run test:e2e:debug    # Debug mode

# Specific Test Types
npm run test:accessibility # Accessibility tests
npm run test:security     # Security tests

# Run All Tests
npm run test:all          # Unit + E2E tests
```

### Test Execution Order

1. **Pre-commit**: Unit tests (fast feedback)
2. **CI Pipeline**: 
   - Lint & Format check
   - Unit tests with coverage
   - Integration tests
   - E2E tests (critical paths)
   - Accessibility tests
   - Security tests

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Frontend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linter
        run: npm run lint
        
      - name: Run unit tests
        run: npm run test:coverage
        
      - name: Run integration tests
        run: npm run test:integration
        
      - name: Install Playwright
        run: npx playwright install --with-deps
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            coverage/
            playwright-report/
```

---

## Best Practices

### Unit Testing

1. **Test Behavior, Not Implementation**
   ```typescript
   // ❌ Bad: Testing implementation details
   expect(component.privateMethod()).toBe(true);
   
   // ✅ Good: Testing behavior
   expect(component.isValid()).toBe(true);
   ```

2. **Use Descriptive Test Names**
   ```typescript
   // ❌ Bad
   it('works', () => {});
   
   // ✅ Good
   it('should display error message when email is invalid', () => {});
   ```

3. **Follow AAA Pattern**
   ```typescript
   it('should calculate total price', () => {
     // Arrange
     const items = [{ price: 10 }, { price: 20 }];
     
     // Act
     const total = calculateTotal(items);
     
     // Assert
     expect(total).toBe(30);
   });
   ```

4. **Mock External Dependencies**
   ```typescript
   const mockHttpClient = {
     get: vi.fn().mockReturnValue(of(mockData)),
   };
   ```

5. **Test Edge Cases**
   - Empty arrays/strings
   - Null/undefined values
   - Boundary conditions
   - Error scenarios

### Integration Testing

1. **Test Real Interactions**
   - Don't mock everything
   - Use real HTTP client with mock backend
   - Test actual data flow

2. **Focus on Critical Paths**
   - Authentication flow
   - Payment processing
   - Data submission

3. **Clean Up After Tests**
   ```typescript
   afterEach(() => {
     httpMock.verify();
     localStorage.clear();
   });
   ```

### E2E Testing

1. **Use Page Object Model**
   ```typescript
   class LoginPage {
     constructor(private page: Page) {}
     
     async login(email: string, password: string) {
       await this.page.locator('input[type="email"]').fill(email);
       await this.page.locator('input[type="password"]').fill(password);
       await this.page.locator('button[type="submit"]').click();
     }
   }
   ```

2. **Wait for Elements Properly**
   ```typescript
   // ❌ Bad: Fixed timeout
   await page.waitForTimeout(5000);
   
   // ✅ Good: Wait for specific condition
   await expect(page.locator('.message')).toBeVisible();
   ```

3. **Use Data Attributes for Testing**
   ```html
   <button data-testid="submit-button">Submit</button>
   ```
   
   ```typescript
   await page.locator('[data-testid="submit-button"]').click();
   ```

4. **Test User Journeys, Not Pages**
   - Complete workflows
   - Real user scenarios
   - Happy and unhappy paths

### Accessibility Testing

1. **Test with Keyboard Only**
2. **Use Screen Reader Testing**
3. **Check Color Contrast**
4. **Verify ARIA Labels**
5. **Test with Different Zoom Levels**

### Security Testing

1. **Test Input Sanitization**
2. **Verify CSRF Protection**
3. **Check Authentication**
4. **Validate Session Management**
5. **Test File Upload Security**

---

## Troubleshooting

### Common Issues

#### Unit Tests

**Issue**: Tests fail with "Cannot find module"
```bash
# Solution: Check path aliases in vitest.config.ts
resolve: {
  alias: {
    '@app': '/src/app',
    '@core': '/src/app/core',
  },
}
```

**Issue**: Angular Material components not rendering
```typescript
// Solution: Import required modules
await TestBed.configureTestingModule({
  imports: [
    ComponentUnderTest,
    MatButtonModule,
    MatIconModule,
  ],
}).compileComponents();
```

#### E2E Tests

**Issue**: Tests timeout
```typescript
// Solution: Increase timeout
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

**Issue**: Element not found
```typescript
// Solution: Wait for element
await page.waitForSelector('.element', { state: 'visible' });
```

**Issue**: Flaky tests
```typescript
// Solution: Use proper waits
await expect(page.locator('.element')).toBeVisible();
// Instead of:
await page.waitForTimeout(1000);
```

#### Accessibility Tests

**Issue**: False positives
```typescript
// Solution: Exclude specific rules
const results = await new AxeBuilder({ page })
  .disableRules(['color-contrast'])
  .analyze();
```

### Debug Tips

1. **Unit Tests**
   ```bash
   # Run single test file
   npm test -- src/app/core/services/api-gateway.service.spec.ts
   
   # Run with debugger
   node --inspect-brk node_modules/.bin/vitest
   ```

2. **E2E Tests**
   ```bash
   # Run in debug mode
   npm run test:e2e:debug
   
   # Run with headed browser
   npm run test:e2e:headed
   
   # Generate trace
   npx playwright test --trace on
   ```

3. **View Test Reports**
   ```bash
   # Unit test coverage
   open coverage/index.html
   
   # E2E test report
   npx playwright show-report
   ```

---

## Test Coverage Reports

### Viewing Coverage

```bash
# Generate and view unit test coverage
npm run test:coverage
open coverage/index.html

# View E2E test report
npx playwright show-report
```

### Coverage Thresholds

Configured in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80,
  },
}
```

### Improving Coverage

1. **Identify Uncovered Code**
   - Check coverage report
   - Focus on critical paths first

2. **Add Missing Tests**
   - Edge cases
   - Error scenarios
   - Boundary conditions

3. **Refactor Untestable Code**
   - Extract dependencies
   - Use dependency injection
   - Simplify complex logic

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/docs/angular-testing-library/intro/)
- [axe-core](https://github.com/dequelabs/axe-core)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

---

## Appendix

### Test File Naming Conventions

- Unit tests: `*.spec.ts`
- Integration tests: `*.integration.spec.ts`
- E2E tests: `*.e2e.spec.ts`

### Test Data Management

```typescript
// fixtures/users.ts
export const mockUsers = {
  customer: {
    email: 'customer@example.com',
    password: 'password123',
    roles: ['CUSTOMER'],
  },
  agent: {
    email: 'agent@example.com',
    password: 'password123',
    roles: ['AGENT'],
  },
};
```

### Custom Test Utilities

```typescript
// test-utils.ts
export function createMockRouter() {
  return {
    navigate: vi.fn(),
    url: '/',
  };
}

export function createMockHttpClient() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
}
```
