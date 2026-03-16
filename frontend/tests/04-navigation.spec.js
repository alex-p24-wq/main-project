// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Navigation & Routing', () => {

    // Test 55
    test('TC-55: Root "/" route serves the Landing Page', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.landing-page')).toBeVisible();
    });

    // Test 56
    test('TC-56: Unknown route redirects to Landing Page', async ({ page }) => {
        await page.goto('/unknown-route-xyz');
        await expect(page).toHaveURL('/');
        await expect(page.locator('.landing-page')).toBeVisible();
    });

    // Test 57
    test('TC-57: /dashboard redirects unauthenticated user to login', async ({ page }) => {
        await page.goto('/dashboard');
        // Should redirect to login with redirect param
        await expect(page).toHaveURL(/\/login/);
    });

    // Test 58
    test('TC-58: Back navigation from login returns to landing', async ({ page }) => {
        await page.goto('/');
        await page.goto('/login');
        await expect(page).toHaveURL(/\/login/);
        await page.goBack();
        await expect(page).toHaveURL('/');
    });

    // Test 59
    test('TC-59: Back navigation from register returns to previous page', async ({ page }) => {
        await page.goto('/');
        await page.goto('/register');
        await expect(page).toHaveURL(/\/register/);
        await page.goBack();
        await expect(page).toHaveURL('/');
    });

    // Test 60
    test('TC-60: Unauthenticated /checkout/:id redirects to login', async ({ page }) => {
        await page.goto('/checkout/product123');
        await expect(page).toHaveURL(/\/login/);
    });

    // Test 61
    test('TC-61: Navigate to /login via URL directly', async ({ page }) => {
        await page.goto('/login');
        await expect(page.locator('h2.title')).toContainText('Welcome Back');
    });

    // Test 62
    test('TC-62: Navigate to /register via URL directly', async ({ page }) => {
        await page.goto('/register');
        await expect(page.locator('h2.title')).toContainText('Create Account');
    });

    // Test 63
    test('TC-63: Page title is set correctly on landing', async ({ page }) => {
        await page.goto('/');
        const title = await page.title();
        expect(title.length).toBeGreaterThan(0);
    });

    // Test 64
    test('TC-64: Login page does not show dashboard content', async ({ page }) => {
        await page.goto('/login');
        await expect(page.locator('.dashboard-layout, .dashboard-page')).not.toBeVisible();
    });

});
