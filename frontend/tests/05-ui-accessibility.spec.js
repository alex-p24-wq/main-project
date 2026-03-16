// @ts-check
import { test, expect } from '@playwright/test';

test.describe('UI & Accessibility Checks', () => {

    // Test 65
    test('TC-65: Landing page has a single H1 element (SEO best practice)', async ({ page }) => {
        await page.goto('/');
        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBe(1);
    });

    // Test 66
    test('TC-66: Login button has accessible text', async ({ page }) => {
        await page.goto('/login');
        const btn = page.locator('button[type="submit"].login-btn');
        await expect(btn).toBeVisible();
        const text = await btn.innerText();
        expect(text.trim().length).toBeGreaterThan(0);
    });

    // Test 67
    test('TC-67: Navbar burger button has aria-label for accessibility', async ({ page }) => {
        await page.goto('/');
        const burger = page.locator('button.burger');
        await expect(burger).toHaveAttribute('aria-label', 'Toggle menu');
    });

    // Test 68
    test('TC-68: Role tabs have aria-selected attribute on landing register page', async ({ page }) => {
        await page.goto('/register');
        await page.waitForSelector('.role-tab');
        const activeTab = page.locator('.role-tab.active');
        await expect(activeTab).toHaveAttribute('aria-selected', 'true');
    });

    // Test 69
    test('TC-69: Register form has progress region with aria-label', async ({ page }) => {
        await page.goto('/register');
        await page.waitForSelector('.progress');
        const progress = page.locator('.progress[aria-label]');
        await expect(progress).toBeVisible();
    });

    // Test 70
    test('TC-70: Images on landing page have alt attributes', async ({ page }) => {
        await page.goto('/');
        const images = page.locator('.feature-card img');
        const count = await images.count();
        for (let i = 0; i < count; i++) {
            const alt = await images.nth(i).getAttribute('alt');
            expect(alt).toBeTruthy();
        }
    });

    // Test 71
    test('TC-71: Login input has name attribute for form submission', async ({ page }) => {
        await page.goto('/login');
        await expect(page.locator('input[name="username"]')).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();
    });

    // Test 72
    test('TC-72: Password field on login is of type password (hidden)', async ({ page }) => {
        await page.goto('/login');
        const pwInput = page.locator('input[name="password"]');
        await expect(pwInput).toHaveAttribute('type', 'password');
    });

    // Test 73
    test('TC-73: Email field on register is of type email', async ({ page }) => {
        await page.goto('/register');
        await page.waitForSelector('#email');
        await expect(page.locator('#email')).toHaveAttribute('type', 'email');
    });

    // Test 74
    test('TC-74: Phone field on register is of type tel', async ({ page }) => {
        await page.goto('/register');
        await page.waitForSelector('#phone');
        await expect(page.locator('#phone')).toHaveAttribute('type', 'tel');
    });

    // Test 75
    test('TC-75: Landing page loads within 5 seconds', async ({ page }) => {
        const start = Date.now();
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        const duration = Date.now() - start;
        expect(duration).toBeLessThan(5000);
    });

    // Test 76
    test('TC-76: Login page loads within 5 seconds', async ({ page }) => {
        const start = Date.now();
        await page.goto('/login');
        await page.waitForLoadState('domcontentloaded');
        const duration = Date.now() - start;
        expect(duration).toBeLessThan(5000);
    });

    // Test 77
    test('TC-77: Register page loads within 5 seconds', async ({ page }) => {
        const start = Date.now();
        await page.goto('/register');
        await page.waitForLoadState('domcontentloaded');
        const duration = Date.now() - start;
        expect(duration).toBeLessThan(5000);
    });

    // Test 78
    test('TC-78: Viewport at 375px (mobile) - landing page renders without crash', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/');
        await expect(page.locator('.landing-page')).toBeVisible();
    });

    // Test 79
    test('TC-79: Viewport at 375px (mobile) - burger menu button is visible', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/');
        await expect(page.locator('button.burger')).toBeVisible();
    });

    // Test 80
    test('TC-80: Viewport at 1440px (desktop) - feature grid is visible', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/');
        await expect(page.locator('.feature-grid')).toBeVisible();
    });

    // Test 81
    test('TC-81: Login form card is fully visible on 1280px desktop', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/login');
        await expect(page.locator('.login-card')).toBeVisible();
    });

    // Test 82
    test('TC-82: OTP input field on register has OTP autocomplete attribute', async ({ page }) => {
        await page.goto('/register');
        await page.waitForSelector('#emailOtp');
        await expect(page.locator('#emailOtp')).toHaveAttribute('autocomplete', 'one-time-code');
    });

    // Test 83
    test('TC-83: Testimonial quotes contain text content', async ({ page }) => {
        await page.goto('/');
        const quotes = page.locator('.quote');
        const count = await quotes.count();
        for (let i = 0; i < count; i++) {
            const text = await quotes.nth(i).innerText();
            expect(text.trim().length).toBeGreaterThan(5);
        }
    });

    // Test 84
    test('TC-84: Step icons in "How it works" section are visible', async ({ page }) => {
        await page.goto('/');
        const icons = page.locator('.step .step-icon');
        await expect(icons.first()).toBeVisible();
    });

    // Test 85
    test('TC-85: CTA Banner "Sign in" link points to /login', async ({ page }) => {
        await page.goto('/');
        const signInLink = page.locator('.cta-banner a.btn.ghost');
        await expect(signInLink).toHaveAttribute('href', '/login');
    });

});
