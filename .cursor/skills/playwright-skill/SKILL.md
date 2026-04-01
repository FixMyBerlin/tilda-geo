---
name: playwright-skill
description: Complete browser automation with Playwright. Supports both ad-hoc automation and proper E2E testing with @playwright/test framework. Auto-detects dev servers, writes clean test scripts. Test pages, fill forms, take screenshots, check responsive design, validate UX, test login flows, check links, automate any browser task. Use when user wants to test websites, automate browser interactions, validate web functionality, or perform any browser-based testing.
---

**IMPORTANT - Path Resolution:**
This skill can be installed in different locations (plugin system, manual installation, global, or project-specific). Before executing any commands, determine the skill directory based on where you loaded this SKILL.md file, and use that path in all commands below. Replace `$SKILL_DIR` with the actual discovered path.

Common installation paths:

- Plugin system: `~/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill`
- Manual global: `~/.claude/skills/playwright-skill`
- Project-specific: `<project>/.claude/skills/playwright-skill`

# Playwright Browser Automation

General-purpose browser automation skill supporting two use cases:

1. **Ad-hoc Automation** - Quick one-off tasks, screenshots, debugging (uses raw Playwright API)
2. **E2E Testing** - Proper test suites with `@playwright/test` framework (recommended for Next.js projects)

**IMPORTANT: For Next.js E2E Testing**
- Use `@playwright/test` framework (not raw Playwright API)
- Test against **production builds** (`npm run build && npm run start`), not dev server
- Use semantic locators (`getByRole`, `getByLabel`) instead of CSS selectors
- Create `playwright.config.ts` with `webServer` configuration
- Write tests to `tests/` directory in TypeScript

**CRITICAL WORKFLOW - Follow these steps in order:**

1. **Determine use case** - Is this ad-hoc automation or proper E2E testing?
   - **Ad-hoc**: Quick debugging, screenshots, one-off tasks → Use raw Playwright API
   - **E2E Testing**: Test suites, CI/CD, regression testing → Use `@playwright/test` framework

2. **For ad-hoc automation: Auto-detect dev servers** - For localhost testing, ALWAYS run server detection FIRST:

   ```bash
   cd $SKILL_DIR && node -e "require('./lib/helpers').detectDevServers().then(servers => console.log(JSON.stringify(servers)))"
   ```

   - If **1 server found**: Use it automatically, inform user
   - If **multiple servers found**: Ask user which one to test
   - If **no servers found**: Ask for URL or offer to help start dev server

3. **For ad-hoc: Write scripts to /tmp** - NEVER write test files to skill directory; always use `/tmp/playwright-test-*.js`

4. **For E2E testing: Write tests to `tests/` directory** - Use TypeScript, proper test structure

5. **Use visible browser by default** - Always use `headless: false` unless user specifically requests headless mode

6. **Parameterize URLs** - Always make URLs configurable via environment variable or constant at top of script

## How It Works

### Ad-hoc Automation Flow
1. You describe what you want to test/automate
2. I auto-detect running dev servers (or ask for URL if testing external site)
3. I write custom Playwright code in `/tmp/playwright-test-*.js` (won't clutter your project)
4. I execute it via: `cd $SKILL_DIR && node run.js /tmp/playwright-test-*.js`
5. Results displayed in real-time, browser window visible for debugging
6. Test files auto-cleaned from /tmp by your OS

### E2E Testing Flow (Recommended for Next.js)
1. You describe what you want to test
2. I create proper test files in `tests/` directory using `@playwright/test` framework
3. I set up `playwright.config.ts` with Next.js `webServer` configuration
4. Tests run via `npx playwright test` with proper isolation and retry mechanisms
5. Tests target production build, not dev server

## Setup (First Time)

### For Ad-hoc Automation
```bash
cd $SKILL_DIR
npm run setup
```

This installs Playwright and Chromium browser. Only needed once.

### For E2E Testing (Next.js Projects)
```bash
# In your Next.js project root
npm install -D @playwright/test
npx playwright install chromium
```

Then create `playwright.config.ts` (see Next.js Configuration section below).

## Execution Pattern

**Step 1: Detect dev servers (for localhost testing)**

```bash
cd $SKILL_DIR && node -e "require('./lib/helpers').detectDevServers().then(s => console.log(JSON.stringify(s)))"
```

**Step 2: Write test script to /tmp with URL parameter**

```javascript
// /tmp/playwright-test-page.js
const { chromium } = require('playwright');

// Parameterized URL (detected or user-provided)
const TARGET_URL = 'http://localhost:3001'; // <-- Auto-detected or from user

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(TARGET_URL);
  console.log('Page loaded:', await page.title());

  await page.screenshot({ path: '/tmp/screenshot.png', fullPage: true });
  console.log('📸 Screenshot saved to /tmp/screenshot.png');

  await browser.close();
})();
```

**Step 3: Execute from skill directory**

```bash
cd $SKILL_DIR && node run.js /tmp/playwright-test-page.js
```

## Next.js E2E Testing Setup

### 1. Install Dependencies

```bash
npm install -D @playwright/test
npx playwright install chromium
```

### 2. Create `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test files location
  testDir: './tests',
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: 'html',
  
  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

**CRITICAL:** The `webServer` configuration automatically builds and starts your Next.js production server. This ensures tests run against production code, not dev server.

### 3. Create Test File Structure

```
tests/
  example.spec.ts
  auth.spec.ts
  navigation.spec.ts
```

### 4. Example E2E Test (Next.js Best Practices)

```typescript
// tests/example.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display homepage content', async ({ page }) => {
    // Navigate to home page (baseURL configured in playwright.config.ts)
    await page.goto('/');
    
    // Use semantic locators (not CSS selectors!)
    const heading = page.getByRole('heading', { name: /home/i });
    await expect(heading).toBeVisible();
    
    // Test navigation link
    const aboutLink = page.getByRole('link', { name: /about/i });
    await expect(aboutLink).toBeVisible();
    
    // Click and verify navigation
    await aboutLink.click();
    await expect(page).toHaveURL('/about');
  });
  
  test('should handle form submission', async ({ page }) => {
    await page.goto('/contact');
    
    // Use getByLabel for form inputs (semantic!)
    await page.getByLabel('Name').fill('John Doe');
    await page.getByLabel('Email').fill('john@example.com');
    await page.getByLabel('Message').fill('Test message');
    
    // Use getByRole for buttons
    await page.getByRole('button', { name: /submit/i }).click();
    
    // Wait for success message
    await expect(page.getByText(/success/i)).toBeVisible();
  });
});
```

### 5. Run Tests

```bash
# Run all tests
npx playwright test

# Run in UI mode (recommended for development)
npx playwright test --ui

# Run specific test file
npx playwright test tests/example.spec.ts

# Run in debug mode
npx playwright test --debug
```

## Common Patterns

### E2E Test Pattern (Recommended)

```typescript
// tests/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Each test gets isolated page context
    await page.goto('/login');
  });

  test('should login successfully', async ({ page }) => {
    // Use semantic locators
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for navigation
    await expect(page).toHaveURL('/dashboard');
    
    // Verify user is logged in
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });
  
  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrong');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Verify error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });
});
```

### Ad-hoc Automation Pattern (Quick Tasks)

### Test a Page (Multiple Viewports)

```javascript
// /tmp/playwright-test-responsive.js
const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3001'; // Auto-detected

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  // Desktop test
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(TARGET_URL);
  console.log('Desktop - Title:', await page.title());
  await page.screenshot({ path: '/tmp/desktop.png', fullPage: true });

  // Mobile test
  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({ path: '/tmp/mobile.png', fullPage: true });

  await browser.close();
})();
```

### Test Login Flow

**E2E Test Version (Recommended):**
```typescript
// tests/login.spec.ts
import { test, expect } from '@playwright/test';

test('should login successfully', async ({ page }) => {
  await page.goto('/login');
  
  // Use semantic locators (resilient to DOM changes)
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Web-first assertion (auto-waits)
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText(/welcome/i)).toBeVisible();
});
```

**Ad-hoc Automation Version:**
```javascript
// /tmp/playwright-test-login.js
const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3001'; // Auto-detected

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(`${TARGET_URL}/login`);

  // Prefer semantic locators even in ad-hoc scripts
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: /submit/i }).click();

  // Wait for redirect
  await page.waitForURL('**/dashboard');
  console.log('✅ Login successful, redirected to dashboard');

  await browser.close();
})();
```

### Fill and Submit Form

**E2E Test Version (Recommended):**
```typescript
// tests/contact.spec.ts
import { test, expect } from '@playwright/test';

test('should submit contact form', async ({ page }) => {
  await page.goto('/contact');
  
  // Use semantic locators
  await page.getByLabel('Name').fill('John Doe');
  await page.getByLabel('Email').fill('john@example.com');
  await page.getByLabel('Message').fill('Test message');
  await page.getByRole('button', { name: /submit/i }).click();
  
  // Web-first assertion (auto-waits)
  await expect(page.getByText(/success/i)).toBeVisible();
});
```

**Ad-hoc Automation Version:**
```javascript
// /tmp/playwright-test-form.js
const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3001'; // Auto-detected

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();

  await page.goto(`${TARGET_URL}/contact`);

  // Prefer semantic locators
  await page.getByLabel('Name').fill('John Doe');
  await page.getByLabel('Email').fill('john@example.com');
  await page.getByLabel('Message').fill('Test message');
  await page.getByRole('button', { name: /submit/i }).click();

  // Verify submission with web-first assertion
  await expect(page.getByText(/success/i)).toBeVisible();
  console.log('✅ Form submitted successfully');

  await browser.close();
})();
```

### Check for Broken Links

```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000');

  const links = await page.locator('a[href^="http"]').all();
  const results = { working: 0, broken: [] };

  for (const link of links) {
    const href = await link.getAttribute('href');
    try {
      const response = await page.request.head(href);
      if (response.ok()) {
        results.working++;
      } else {
        results.broken.push({ url: href, status: response.status() });
      }
    } catch (e) {
      results.broken.push({ url: href, error: e.message });
    }
  }

  console.log(`✅ Working links: ${results.working}`);
  console.log(`❌ Broken links:`, results.broken);

  await browser.close();
})();
```

### Take Screenshot with Error Handling

```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 10000,
    });

    await page.screenshot({
      path: '/tmp/screenshot.png',
      fullPage: true,
    });

    console.log('📸 Screenshot saved to /tmp/screenshot.png');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
```

### Test Responsive Design

```javascript
// /tmp/playwright-test-responsive-full.js
const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3001'; // Auto-detected

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 },
  ];

  for (const viewport of viewports) {
    console.log(
      `Testing ${viewport.name} (${viewport.width}x${viewport.height})`,
    );

    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });

    await page.goto(TARGET_URL);
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `/tmp/${viewport.name.toLowerCase()}.png`,
      fullPage: true,
    });
  }

  console.log('✅ All viewports tested');
  await browser.close();
})();
```

## Inline Execution (Simple Tasks)

For quick one-off tasks, you can execute code inline without creating files:

```bash
# Take a quick screenshot
cd $SKILL_DIR && node run.js "
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
await page.goto('http://localhost:3001');
await page.screenshot({ path: '/tmp/quick-screenshot.png', fullPage: true });
console.log('Screenshot saved');
await browser.close();
"
```

**When to use inline vs files:**

- **Inline**: Quick one-off tasks (screenshot, check if element exists, get page title)
- **Files**: Complex tests, responsive design checks, anything user might want to re-run

## Available Helpers

Optional utility functions in `lib/helpers.js`:

```javascript
const helpers = require('./lib/helpers');

// Detect running dev servers (CRITICAL - use this first!)
const servers = await helpers.detectDevServers();
console.log('Found servers:', servers);

// Safe click with retry
await helpers.safeClick(page, 'button.submit', { retries: 3 });

// Safe type with clear
await helpers.safeType(page, '#username', 'testuser');

// Take timestamped screenshot
await helpers.takeScreenshot(page, 'test-result');

// Handle cookie banners
await helpers.handleCookieBanner(page);

// Extract table data
const data = await helpers.extractTableData(page, 'table.results');
```

See `lib/helpers.js` for full list.

## Custom HTTP Headers

Configure custom headers for all HTTP requests via environment variables. Useful for:

- Identifying automated traffic to your backend
- Getting LLM-optimized responses (e.g., plain text errors instead of styled HTML)
- Adding authentication tokens globally

### Configuration

**Single header (common case):**

```bash
PW_HEADER_NAME=X-Automated-By PW_HEADER_VALUE=playwright-skill \
  cd $SKILL_DIR && node run.js /tmp/my-script.js
```

**Multiple headers (JSON format):**

```bash
PW_EXTRA_HEADERS='{"X-Automated-By":"playwright-skill","X-Debug":"true"}' \
  cd $SKILL_DIR && node run.js /tmp/my-script.js
```

### How It Works

Headers are automatically applied when using `helpers.createContext()`:

```javascript
const context = await helpers.createContext(browser);
const page = await context.newPage();
// All requests from this page include your custom headers
```

For scripts using raw Playwright API, use the injected `getContextOptionsWithHeaders()`:

```javascript
const context = await browser.newContext(
  getContextOptionsWithHeaders({ viewport: { width: 1920, height: 1080 } }),
);
```

## Advanced Usage

For comprehensive Playwright API documentation, see [API_REFERENCE.md](API_REFERENCE.md):

- Selectors & Locators best practices
- Network interception & API mocking
- Authentication & session management
- Visual regression testing
- Mobile device emulation
- Performance testing
- Debugging techniques
- CI/CD integration

## Best Practices

### For E2E Testing (Next.js Projects)

- ✅ **Use `@playwright/test` framework** - Not raw Playwright API
- ✅ **Test production builds** - Use `webServer` config to build and start production server
- ✅ **Use semantic locators** - `getByRole()`, `getByLabel()`, `getByText()` instead of CSS selectors
- ✅ **Web-first assertions** - `expect(page.getByText('...')).toBeVisible()` auto-waits
- ✅ **Test isolation** - Each test gets fresh page context via `beforeEach` hooks
- ✅ **TypeScript** - Write tests in `.spec.ts` files for type safety
- ✅ **Test directory** - Put tests in `tests/` directory, not `/tmp`
- ✅ **Avoid fixed timeouts** - Use `waitForURL`, `waitForSelector`, or web-first assertions

### For Ad-hoc Automation

- **CRITICAL: Detect servers FIRST** - Always run `detectDevServers()` before writing test code for localhost testing
- **Custom headers** - Use `PW_HEADER_NAME`/`PW_HEADER_VALUE` env vars to identify automated traffic to your backend
- **Use /tmp for test files** - Write to `/tmp/playwright-test-*.js`, never to skill directory or user's project
- **Parameterize URLs** - Put detected/provided URL in a `TARGET_URL` constant at the top of every script
- **DEFAULT: Visible browser** - Always use `headless: false` unless user explicitly asks for headless mode
- **Headless mode** - Only use `headless: true` when user specifically requests "headless" or "background" execution
- **Slow down:** Use `slowMo: 100` to make actions visible and easier to follow
- **Wait strategies:** Use `waitForURL`, `waitForSelector`, `waitForLoadState` instead of fixed timeouts
- **Error handling:** Always use try-catch for robust automation
- **Console output:** Use `console.log()` to track progress and show what's happening
- **Prefer semantic locators** - Even in ad-hoc scripts, use `getByRole()` when possible

## Troubleshooting

**Playwright not installed:**

```bash
cd $SKILL_DIR && npm run setup
```

**Module not found:**
Ensure running from skill directory via `run.js` wrapper

**Browser doesn't open:**
Check `headless: false` and ensure display available

**Element not found:**
Add wait: `await page.waitForSelector('.element', { timeout: 10000 })`

## Example Usage

```
User: "Test if the marketing page looks good"

Claude: I'll test the marketing page across multiple viewports. Let me first detect running servers...
[Runs: detectDevServers()]
[Output: Found server on port 3001]
I found your dev server running on http://localhost:3001

[Writes custom automation script to /tmp/playwright-test-marketing.js with URL parameterized]
[Runs: cd $SKILL_DIR && node run.js /tmp/playwright-test-marketing.js]
[Shows results with screenshots from /tmp/]
```

```
User: "Check if login redirects correctly"

Claude: I'll test the login flow. First, let me check for running servers...
[Runs: detectDevServers()]
[Output: Found servers on ports 3000 and 3001]
I found 2 dev servers. Which one should I test?
- http://localhost:3000
- http://localhost:3001

User: "Use 3001"

[Writes login automation to /tmp/playwright-test-login.js]
[Runs: cd $SKILL_DIR && node run.js /tmp/playwright-test-login.js]
[Reports: ✅ Login successful, redirected to /dashboard]
```

## Notes

### Ad-hoc Automation
- Each automation is custom-written for your specific request
- Not limited to pre-built scripts - any browser task possible
- Auto-detects running dev servers to eliminate hardcoded URLs
- Test scripts written to `/tmp` for automatic cleanup (no clutter)
- Code executes reliably with proper module resolution via `run.js`
- Progressive disclosure - API_REFERENCE.md loaded only when advanced features needed

### E2E Testing
- Use `@playwright/test` framework for proper test structure
- Tests run against production builds for accurate results
- Proper test isolation ensures tests don't interfere with each other
- TypeScript support for type safety and better IDE experience
- Tests are version controlled in `tests/` directory
- CI/CD ready with built-in retry mechanisms and reporting

## When to Use What

**Use E2E Testing (`@playwright/test`):**
- ✅ Writing test suites for your application
- ✅ Regression testing
- ✅ CI/CD integration
- ✅ Testing critical user flows
- ✅ Next.js applications

**Use Ad-hoc Automation (Raw Playwright API):**
- ✅ Quick debugging sessions
- ✅ One-off screenshots
- ✅ Testing external websites
- ✅ Exploratory testing
- ✅ Prototyping test ideas
