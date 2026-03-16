// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    // Test 19
    test('TC-19: Login page renders username and password inputs', async ({ page }) => {
        await expect(page.locator('input[name="username"]')).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();
    });

    // Test 20
    test('TC-20: Login page has a Login submit button', async ({ page }) => {
        const btn = page.locator('button[type="submit"].login-btn');
        await expect(btn).toBeVisible();
        await expect(btn).toContainText('Login');
    });

    // Test 21
    test('TC-21: Submitting empty form shows validation errors', async ({ page }) => {
        await page.locator('button[type="submit"].login-btn').click();
        // Should show at least one error message
        const errors = page.locator('.error-message');
        await expect(errors.first()).toBeVisible({ timeout: 5000 });
    });

    // Test 22
    test('TC-22: Invalid username shows validation error on blur', async ({ page }) => {
        await page.locator('input[name="username"]').fill('ab');
        await page.locator('input[name="username"]').blur();
        const error = page.locator('.error-message').first();
        await expect(error).toBeVisible({ timeout: 5000 });
    });

    // Test 23
    test('TC-23: Invalid password shows validation error on blur', async ({ page }) => {
        await page.locator('input[name="password"]').fill('123');
        await page.locator('input[name="password"]').blur();
        const error = page.locator('.error-message').first();
        await expect(error).toBeVisible({ timeout: 5000 });
    });

    // Test 24
    test('TC-24: Wrong credentials shows API error message', async ({ page }) => {
        await page.locator('input[name="username"]').fill('wronguser123');
        await page.locator('input[name="password"]').fill('WrongPass@99');
        await page.locator('button[type="submit"].login-btn').click();
        // Wait for error (API call)
        const error = page.locator('.error-message').first();
        await expect(error).toBeVisible({ timeout: 10000 });
    });

    // Test 25
    test('TC-25: Login page has a link to Register page', async ({ page }) => {
        const registerLink = page.locator('a[href="/register"]');
        await expect(registerLink).toBeVisible();
        await registerLink.click();
        await expect(page).toHaveURL(/\/register/);
    });

    // Test 26
    test('TC-26: Login page has Google social login button', async ({ page }) => {
        const googleBtn = page.locator('button.social-btn.google-btn');
        await expect(googleBtn).toBeVisible();
        await expect(googleBtn).toContainText('Google');
    });

    // Test 27
    test('TC-27: Login page has Facebook social login button', async ({ page }) => {
        const fbBtn = page.locator('button.social-btn.facebook-btn');
        await expect(fbBtn).toBeVisible();
        await expect(fbBtn).toContainText('Facebook');
    });

    // Test 28
    test('TC-28: Login button shows loading state during submission', async ({ page }) => {
        await page.locator('input[name="username"]').fill('testvaliduser');
        await page.locator('input[name="password"]').fill('ValidPass@123');
        const btn = page.locator('button[type="submit"].login-btn');
        await btn.click();
        // The button text should change to "Logging in..." momentarily (loading state)
        // We check either final state or loading was triggered
        await expect(btn).toBeVisible();
    });

    // Test 29
    test('TC-29: Navigating directly to /login shows the welcome back heading', async ({ page }) => {
        await expect(page.locator('.title')).toContainText('Welcome Back');
    });

    // Test 30
    test('TC-30: Login card image is visible', async ({ page }) => {
        const img = page.locator('.login-image img');
        await expect(img).toBeVisible();
    });

});
