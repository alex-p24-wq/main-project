// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    // Test 1
    test('TC-01: Landing page loads and shows brand name "Cardo"', async ({ page }) => {
        await expect(page).toHaveTitle(/Cardo|Vite/i);
        await expect(page.locator('.brand')).toBeVisible();
        await expect(page.locator('.brand')).toContainText('Cardo');
    });

    // Test 2
    test('TC-02: Navbar has Login and Sign Up links', async ({ page }) => {
        await expect(page.locator('a.login-link')).toBeVisible();
        await expect(page.locator('a.btn.small')).toBeVisible();
        await expect(page.locator('a.login-link')).toContainText('Login');
        await expect(page.locator('a.btn.small')).toContainText('Sign up');
    });

    // Test 3
    test('TC-03: Hero section title is visible', async ({ page }) => {
        await expect(page.locator('h1.hero-title')).toBeVisible();
        await expect(page.locator('h1.hero-title')).toContainText('Cardo');
    });

    // Test 4
    test('TC-04: Hero section has Get Started and Explore Features buttons', async ({ page }) => {
        const getStarted = page.locator('.hero-buttons a.btn.primary');
        const explore = page.locator('.hero-buttons a.btn.ghost');
        await expect(getStarted).toBeVisible();
        await expect(explore).toBeVisible();
        await expect(getStarted).toContainText('Get Started');
        await expect(explore).toContainText('Explore Features');
    });

    // Test 5
    test('TC-05: Features section shows 3 feature cards', async ({ page }) => {
        await expect(page.locator('.feature-card')).toHaveCount(3);
    });

    // Test 6
    test('TC-06: Features section heading is visible', async ({ page }) => {
        await expect(page.locator('#features h2')).toContainText('Our Key Features');
    });

    // Test 7
    test('TC-07: "How it works" section has 3 steps', async ({ page }) => {
        await expect(page.locator('.step')).toHaveCount(3);
    });

    // Test 8
    test('TC-08: Stats section shows key statistics', async ({ page }) => {
        const stats = page.locator('.stat');
        await expect(stats).toHaveCount(4);
    });

    // Test 9
    test('TC-09: Testimonials section shows 3 cards', async ({ page }) => {
        await expect(page.locator('.t-card')).toHaveCount(3);
    });

    // Test 10
    test('TC-10: FAQ section has 3 accordion items', async ({ page }) => {
        await expect(page.locator('.faq-list details')).toHaveCount(3);
    });

    // Test 11
    test('TC-11: FAQ accordion opens on click', async ({ page }) => {
        const firstFaq = page.locator('.faq-list details').first();
        await firstFaq.click();
        await expect(firstFaq).toHaveAttribute('open');
    });

    // Test 12
    test('TC-12: CTA banner has "Create free account" link to /register', async ({ page }) => {
        const ctaBtn = page.locator('.cta-banner a.btn.primary');
        await expect(ctaBtn).toBeVisible();
        await expect(ctaBtn).toContainText('Create free account');
        await expect(ctaBtn).toHaveAttribute('href', '/register');
    });

    // Test 13
    test('TC-13: Footer is visible with copyright text', async ({ page }) => {
        await expect(page.locator('footer.footer')).toBeVisible();
        await expect(page.locator('footer.footer')).toContainText('2025 Cardo');
    });

    // Test 14
    test('TC-14: Clicking "Login" link in navbar navigates to /login', async ({ page }) => {
        await page.locator('a.login-link').click();
        await expect(page).toHaveURL(/\/login/);
    });

    // Test 15
    test('TC-15: Clicking "Sign up" link in navbar navigates to /register', async ({ page }) => {
        await page.locator('a.btn.small').click();
        await expect(page).toHaveURL(/\/register/);
    });

    // Test 16
    test('TC-16: "Get Started" in hero navigates to /login', async ({ page }) => {
        await page.locator('.hero-buttons a.btn.primary').click();
        await expect(page).toHaveURL(/\/login/);
    });

    // Test 17
    test('TC-17: AgriCare section is visible', async ({ page }) => {
        await expect(page.locator('.agri-care h2')).toContainText('AgriCare for Farmers');
        await expect(page.locator('.agri-list li')).toHaveCount(4);
    });

    // Test 18
    test('TC-18: Logos / trust strip is rendered', async ({ page }) => {
        await expect(page.locator('.logos')).toBeVisible();
        const logos = page.locator('.logos .logo');
        await expect(logos).toHaveCount(5);
    });

});
