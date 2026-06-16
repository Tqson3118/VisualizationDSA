const { chromium } = require('playwright');

(async () => {
  console.log("=== ADMIN NAVIGATION DIAGNOSTIC TEST ===\n");
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    console.error("Failed to launch chromium:", e.message);
    process.exit(1);
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  // Skip all tour popups
  await context.addInitScript(() => {
    localStorage.setItem('guided_tour_seen', 'true');
    ['sorting','compare','concurrency','graph','di','patterns','checkout','oop','solid','system','quiz','gamification']
      .forEach(k => localStorage.setItem(`page_tour_${k}_seen`, 'true'));
  });

  const page = await context.newPage();

  // Capture ALL console messages (errors, warnings, logs)
  const consoleErrors = [];
  page.on('console', msg => {
    const text = `[CONSOLE-${msg.type().toUpperCase()}] ${msg.text()}`;
    if (msg.type() === 'error' || msg.type() === 'warn') {
      consoleErrors.push(text);
    }
    console.log(text);
  });

  // Capture JS exceptions (unhandled errors)
  page.on('pageerror', exception => {
    const msg = `[JS-EXCEPTION] ${exception.message}`;
    consoleErrors.push(msg);
    console.error(msg);
    console.error('[JS-EXCEPTION-STACK]', exception.stack);
  });

  // Only log API requests (skip fonts/css/js assets)
  page.on('request', req => {
    if (req.url().includes('/api/')) {
      console.log(`[API-REQ] ${req.method()} ${req.url()}`);
    }
  });
  page.on('response', res => {
    if (res.url().includes('/api/')) {
      const status = res.status();
      const icon = status >= 400 ? '❌' : '✅';
      console.log(`[API-RES] ${icon} ${status} ${res.url()}`);
    }
  });

  // Helper: dump auth state from Vue app
  async function dumpAuthState(label) {
    try {
      const state = await page.evaluate(() => {
        const stores = window.__pinia?.state?.value;
        if (!stores) return { error: 'Pinia not found on window' };
        const auth = stores.auth || stores.useAuthStore;
        if (!auth) return { error: 'Auth store not found', storeKeys: Object.keys(stores) };
        return {
          isAuthenticated: !!auth.accessToken && !!auth.currentUser,
          userRole: auth.currentUser?.role ?? 'null(no currentUser)',
          userName: auth.currentUser?.name ?? 'null',
          hasAccessToken: !!auth.accessToken,
          isStatelessMode: auth.isStatelessMode,
          isImpersonating: auth.isImpersonating,
        };
      });
      console.log(`\n[AUTH-STATE @ ${label}]`, JSON.stringify(state, null, 2));
    } catch (e) {
      console.log(`[AUTH-STATE @ ${label}] Error reading state: ${e.message}`);
    }
  }

  // Helper: dump Vue Router state
  async function dumpRouterState(label) {
    try {
      const state = await page.evaluate(() => {
        const app = document.querySelector('#app')?.__vue_app__;
        if (!app) return { error: '#app not found or no __vue_app__' };

        const router = app.config.globalProperties.$router;
        if (!router) return { error: 'router not on globalProperties' };

        const route = router.currentRoute.value;
        return {
          fullPath: route.fullPath,
          name: route.name,
          matched: route.matched.map(r => ({ path: r.path, component: !!r.components?.default })),
        };
      });
      console.log(`\n[ROUTER @ ${label}]`, JSON.stringify(state, null, 2));
    } catch (e) {
      console.log(`[ROUTER @ ${label}] Error: ${e.message}`);
    }
  }

  // Helper: check visible content in main area
  async function checkContent(label) {
    try {
      const content = await page.evaluate(() => {
        const main = document.querySelector('main') || document.querySelector('.app-main') || document.querySelector('#app');
        const text = main?.innerText?.trim() ?? '';
        const height = main?.getBoundingClientRect()?.height ?? 0;
        return {
          hasContent: text.length > 50,
          contentLength: text.length,
          contentPreview: text.substring(0, 150),
          mainHeight: height,
          mainDisplay: main ? window.getComputedStyle(main).display : 'element-not-found',
          mainVisibility: main ? window.getComputedStyle(main).visibility : 'element-not-found',
          mainOpacity: main ? window.getComputedStyle(main).opacity : 'element-not-found',
        };
      });
      console.log(`\n[CONTENT @ ${label}]`, JSON.stringify(content, null, 2));
    } catch (e) {
      console.log(`[CONTENT @ ${label}] Error: ${e.message}`);
    }
  }

  try {
    // ── STEP 1: Login ──────────────────────────────────────────────────────
    console.log("\n=== STEP 1: LOGIN ===");
    await page.goto('http://localhost:5173/#/', { waitUntil: 'networkidle' });

    await page.click('button:has-text("Đăng nhập")');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.fill('input[type="email"]', 'admin@gmail.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await dumpAuthState('AFTER LOGIN');

    // ── STEP 2: Navigate to /admin ─────────────────────────────────────────
    console.log("\n=== STEP 2: NAVIGATE TO /ADMIN ===");
    await page.goto('http://localhost:5173/#/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await dumpAuthState('AFTER ADMIN LOAD');
    await checkContent('ADMIN PAGE');
    await page.screenshot({ path: 'debug_1_admin.png' });

    // ── STEP 3: Click Sorting (simple page, no Teacher API) ───────────────
    console.log("\n=== STEP 3: CLICK SORTING (/sorting) ===");
    consoleErrors.length = 0; // reset
    await page.goto('http://localhost:5173/#/sorting', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await dumpRouterState('AFTER SORTING LOAD');
    await dumpAuthState('AFTER SORTING LOAD');
    await checkContent('SORTING PAGE');
    await page.screenshot({ path: 'debug_2_sorting.png' });

    // ── STEP 4: Go back to /admin ──────────────────────────────────────────
    console.log("\n=== STEP 4: BACK TO /ADMIN ===");
    consoleErrors.length = 0;
    await page.goto('http://localhost:5173/#/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await dumpRouterState('AFTER ADMIN RE-VISIT');
    await dumpAuthState('AFTER ADMIN RE-VISIT');
    await checkContent('ADMIN RE-VISIT');
    await page.screenshot({ path: 'debug_3_admin_revisit.png' });

    // ── STEP 5: Click Teacher ──────────────────────────────────────────────
    console.log("\n=== STEP 5: CLICK TEACHER (/teacher) ===");
    consoleErrors.length = 0;
    await page.goto('http://localhost:5173/#/teacher', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await dumpAuthState('AFTER TEACHER LOAD');
    await checkContent('TEACHER PAGE');
    await page.screenshot({ path: 'debug_4_teacher.png' });

    // ── STEP 6: Back to /admin after teacher ───────────────────────────────
    console.log("\n=== STEP 6: ADMIN AFTER TEACHER ===");
    consoleErrors.length = 0;
    await page.goto('http://localhost:5173/#/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await dumpAuthState('ADMIN AFTER TEACHER');
    await checkContent('ADMIN AFTER TEACHER');
    await page.screenshot({ path: 'debug_5_admin_after_teacher.png' });

    console.log("\n=== TEST COMPLETE ===");
    if (consoleErrors.length > 0) {
      console.log(`\n⚠️  ACCUMULATED ERRORS (${consoleErrors.length}):`);
      consoleErrors.forEach(e => console.log(' ', e));
    } else {
      console.log("✅ No console errors detected!");
    }

  } catch (err) {
    console.error("\n[FATAL-ERROR]", err.message);
    console.error(err.stack);
    await page.screenshot({ path: 'debug_fatal_error.png' });
  } finally {
    await browser.close();
  }
})();
