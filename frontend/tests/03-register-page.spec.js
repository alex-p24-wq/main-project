// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Register Page', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/register');
        // Wait for the register form to load
        await page.waitForSelector('.register-wrapper, .register-card, .title', { timeout: 10000 });
    });

    // Test 31
    test('TC-31: Register page renders "Create Account" heading', async ({ page }) => {
        await expect(page.locator('h2.title')).toContainText('Create Account');
    });

    // Test 32
    test('TC-32: Role tabs are visible (Customer, Farmer, AgriCare, Hub Manager)', async ({ page }) => {
        const roleTabs = page.locator('.role-tab');
        const count = await roleTabs.count();
        expect(count).toBeGreaterThanOrEqual(4);
    });

    // Test 33
    test('TC-33: Default selected role tab is "Customer"', async ({ page }) => {
        const activeTab = page.locator('.role-tab.active');
        await expect(activeTab).toContainText('Customer');
    });

    // Test 34
    test('TC-34: Clicking "Farmer" role tab switches the active tab', async ({ page }) => {
        await page.locator('.role-tab', { hasText: 'Farmer' }).click();
        await expect(page.locator('.role-tab.active')).toContainText('Farmer');
    });

    // Test 35
    test('TC-35: Clicking "AgriCare" role tab switches the active tab', async ({ page }) => {
        await page.locator('.role-tab', { hasText: 'AgriCare' }).click();
        await expect(page.locator('.role-tab.active')).toContainText('AgriCare');
    });

    // Test 36
    test('TC-36: Clicking "Hub Manager" role tab switches the active tab', async ({ page }) => {
        await page.locator('.role-tab', { hasText: 'Hub Manager' }).click();
        await expect(page.locator('.role-tab.active')).toContainText('Hub Manager');
    });

    // Test 37
    test('TC-37: Username input field is present in step 1', async ({ page }) => {
        await expect(page.locator('#username')).toBeVisible();
    });

    // Test 38
    test('TC-38: Email input field is present in step 1', async ({ page }) => {
        await expect(page.locator('#email')).toBeVisible();
    });

    // Test 39
    test('TC-39: Phone input field is present in step 1', async ({ page }) => {
        await expect(page.locator('#phone')).toBeVisible();
    });

    // Test 40
    test('TC-40: Password input field is present in step 1', async ({ page }) => {
        await expect(page.locator('#password')).toBeVisible();
    });

    // Test 41
    test('TC-41: Confirm password input field is present in step 1', async ({ page }) => {
        await expect(page.locator('#confirm')).toBeVisible();
    });

    // Test 42
    test('TC-42: Invalid username (too short) shows error after blur', async ({ page }) => {
        await page.locator('#username').fill('ab');
        await page.locator('#username').blur();
        const error = page.locator('.error-text').first();
        await expect(error).toBeVisible({ timeout: 5000 });
    });

    // Test 43
    test('TC-43: Invalid email shows error after blur', async ({ page }) => {
        await page.locator('#email').fill('not-an-email');
        await page.locator('#email').blur();
        const error = page.locator('.error-text').first();
        await expect(error).toBeVisible({ timeout: 5000 });
    });

    // Test 44
    test('TC-44: Invalid phone shows error after blur', async ({ page }) => {
        await page.locator('#phone').fill('123');
        await page.locator('#phone').blur();
        const error = page.locator('.error-text').first();
        await expect(error).toBeVisible({ timeout: 5000 });
    });

    // Test 45
    test('TC-45: Password strength meter appears when typing password', async ({ page }) => {
        await page.locator('#password').fill('TestPass@1');
        const strength = page.locator('.strength');
        await expect(strength).toBeVisible();
    });

    // Test 46
    test('TC-46: Password mismatch shows confirm password error', async ({ page }) => {
        await page.locator('#password').fill('ValidPass@1');
        await page.locator('#confirm').fill('DifferentPass@2');
        await page.locator('#confirm').blur();
        const error = page.locator('.error-text').first();
        await expect(error).toBeVisible({ timeout: 5000 });
    });

    // Test 47
    test('TC-47: Progress bar is visible with 3 step labels', async ({ page }) => {
        await expect(page.locator('.progress')).toBeVisible();
        await expect(page.locator('.steps-labels span').nth(0)).toContainText('Account');
        await expect(page.locator('.steps-labels span').nth(1)).toContainText('Details');
        await expect(page.locator('.steps-labels span').nth(2)).toContainText('Review');
    });

    // Test 48
    test('TC-48: "Sign up with Google" button is visible', async ({ page }) => {
        await expect(page.locator('button.social-btn.google-btn')).toBeVisible();
        await expect(page.locator('button.social-btn.google-btn')).toContainText('Sign up with Google');
    });

    // Test 49
    test('TC-49: Clicking "Sign up with Google" opens role selection modal', async ({ page }) => {
        await page.locator('button.social-btn.google-btn').click();
        await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('h3', { hasText: 'Continue as' })).toBeVisible();
    });

    // Test 50
    test('TC-50: Role selection modal shows all role buttons', async ({ page }) => {
        await page.locator('button.social-btn.google-btn').click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
        await expect(page.locator('[role="dialog"] button', { hasText: 'Customer' })).toBeVisible();
        await expect(page.locator('[role="dialog"] button', { hasText: 'Farmer' })).toBeVisible();
    });

    // Test 51
    test('TC-51: Cancel button closes the role selection modal', async ({ page }) => {
        await page.locator('button.social-btn.google-btn').click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
        await page.locator('[role="dialog"] button', { hasText: 'Cancel' }).click();
        await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3000 });
    });

    // Test 52
    test('TC-52: Send OTP button is disabled when email is empty', async ({ page }) => {
        const sendOtpBtn = page.locator('button.ghost-btn', { hasText: 'Send OTP' });
        await expect(sendOtpBtn).toBeDisabled();
    });

    // Test 53
    test('TC-53: Send OTP button becomes enabled when valid email is typed', async ({ page }) => {
        await page.locator('#email').fill('test@example.com');
        const sendOtpBtn = page.locator('button.ghost-btn', { hasText: 'Send OTP' });
        await expect(sendOtpBtn).toBeEnabled();
    });

    // Test 54
    test('TC-54: Role image changes when switching roles', async ({ page }) => {
        const img = page.locator('.register-image img');
        const initialSrc = await img.getAttribute('src');
        await page.locator('.role-tab', { hasText: 'Farmer' }).click();
        await page.waitForTimeout(500);
        const newSrc = await img.getAttribute('src');
        expect(newSrc).not.toEqual(initialSrc);
    });

});
