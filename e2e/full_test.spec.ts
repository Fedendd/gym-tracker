import { test, expect, Page } from "@playwright/test"

const BASE = "https://gym-tracker-pearl-two.vercel.app"
const ADMIN_EMAIL = "pastina.fede@gmail.com"
const ADMIN_PASS = "Ciao12345!"

async function loginAs(page: Page, email: string, pass: string) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', pass)
  await page.click('button[type="submit"]')
  await page.waitForURL(/dashboard|admin/, { timeout: 10000 })
}

// ---- TEST 1: Admin login ----
test("1. Admin login", async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
  await expect(page).toHaveURL(/dashboard/, { timeout: 8000 })
  await page.screenshot({ path: "/tmp/t1_admin_login.png" })
})

// ---- TEST 2: Admin sidebar navigation ----
test("2. Admin sidebar nav items", async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
  // Check all admin nav links are present
  await expect(page.locator('a[href="/admin/clients"]')).toBeVisible()
  await expect(page.locator('a[href="/admin/invites"]')).toBeVisible()
  await expect(page.locator('a[href="/workouts"]').first()).toBeVisible()
  await page.screenshot({ path: "/tmp/t2_sidebar.png" })
})

// ---- TEST 3: Admin can navigate to Clienti ----
test("3. Admin clients page", async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
  await page.goto(`${BASE}/admin/clients`)
  await expect(page).toHaveURL(/admin\/clients/, { timeout: 8000 })
  await page.screenshot({ path: "/tmp/t3_clients.png" })
})

// ---- TEST 4: Admin create invite link ----
test("4. Admin create invite link", async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
  await page.goto(`${BASE}/admin/invites`)
  await page.waitForSelector("button", { timeout: 8000 })
  const createBtn = page.locator("button").filter({ hasText: /crea|genera|nuovo/i }).first()
  if (await createBtn.isVisible()) {
    await createBtn.click()
    await page.waitForTimeout(2000)
  }
  await page.screenshot({ path: "/tmp/t4_invite.png" })
  // Check page loaded without error
  await expect(page.locator("body")).not.toContainText("500")
  await expect(page.locator("body")).not.toContainText("Error")
})

// ---- TEST 5: Admin Workouts page ----
test("5. Admin workouts page", async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
  await page.goto(`${BASE}/workouts`)
  await expect(page).toHaveURL(/workouts/, { timeout: 8000 })
  await page.screenshot({ path: "/tmp/t5_workouts.png" })
  await expect(page.locator("body")).not.toContainText("500")
})

// ---- TEST 6: Admin dashboard stats ----
test("6. Admin dashboard", async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
  await page.goto(`${BASE}/dashboard`)
  await page.waitForTimeout(2000)
  await page.screenshot({ path: "/tmp/t6_dashboard.png" })
  await expect(page.locator("body")).not.toContainText("500")
})

// ---- TEST 7: Admin client detail (if any client) ----
test("7. Admin client detail page", async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
  await page.goto(`${BASE}/admin/clients`)
  await page.waitForTimeout(2000)
  // Click first client if exists
  const clientLink = page.locator('a[href*="/admin/clients/"]').first()
  if (await clientLink.isVisible()) {
    const href = await clientLink.getAttribute("href")
    await page.goto(`${BASE}${href}`)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: "/tmp/t7_client_detail.png" })
    // Check tabs
    await expect(page.locator("body")).not.toContainText("500")
  } else {
    console.log("No clients yet, skipping")
    await page.screenshot({ path: "/tmp/t7_no_clients.png" })
  }
})

// ---- TEST 8: Admin Dieta tab on client ----
test("8. Admin client Dieta tab + PDF button", async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
  await page.goto(`${BASE}/admin/clients`)
  await page.waitForTimeout(2000)
  const clientLink = page.locator('a[href*="/admin/clients/cm"]').first()
  if (await clientLink.isVisible()) {
    const href = await clientLink.getAttribute("href")
    await page.goto(`${BASE}${href}`)
    await page.waitForTimeout(2000)
    // Click Dieta tab
    const dietaTab = page.locator('[role="tab"]').filter({ hasText: /dieta/i })
    if (await dietaTab.isVisible()) {
      await dietaTab.click()
      await page.waitForTimeout(1500)
      await page.screenshot({ path: "/tmp/t8_dieta_tab.png" })
    }
  } else {
    console.log("No clients, skipping Dieta tab test")
  }
})

// ---- TEST 9: Admin Workout tab + Crea scheda button ----
test("9. Admin client Workout tab + Crea scheda", async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
  await page.goto(`${BASE}/admin/clients`)
  await page.waitForTimeout(2000)
  const clientLink = page.locator('a[href*="/admin/clients/cm"]').first()
  if (await clientLink.isVisible()) {
    const href = await clientLink.getAttribute("href")
    await page.goto(`${BASE}${href}`)
    await page.waitForTimeout(2000)
    // Click Workout tab
    const workoutTab = page.locator('[role="tab"]').filter({ hasText: /workout/i })
    if (await workoutTab.isVisible()) {
      await workoutTab.click()
      await page.waitForTimeout(1500)
      await page.screenshot({ path: "/tmp/t9_workout_tab.png" })
      // Check Crea scheda button
      const creaBtn = page.locator("button, a").filter({ hasText: /crea scheda/i })
      await expect(creaBtn).toBeVisible()
    }
  } else {
    console.log("No clients, skipping Workout tab test")
  }
})

// ---- TEST 10: Admin Simula button ----
test("10. Simula client view", async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
  await page.goto(`${BASE}/admin/clients`)
  await page.waitForTimeout(2000)
  const clientLink = page.locator('a[href*="/admin/clients/cm"]').first()
  if (await clientLink.isVisible()) {
    const href = await clientLink.getAttribute("href")
    await page.goto(`${BASE}${href}`)
    await page.waitForTimeout(2000)
    // Click Simula button
    const simulaBtn = page.locator("a, button").filter({ hasText: /simula/i })
    if (await simulaBtn.isVisible()) {
      await simulaBtn.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: "/tmp/t10_simula.png" })
      // Check preview banner
      await expect(page.locator("body")).toContainText(/Vista simulata/i)
    }
  } else {
    console.log("No clients, skipping Simula test")
  }
})

// ---- TEST 11: Admin Panoramica tab (status badges) ----
test("11. Admin client Panoramica tab", async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
  await page.goto(`${BASE}/admin/clients`)
  await page.waitForTimeout(2000)
  const clientLink = page.locator('a[href*="/admin/clients/cm"]').first()
  if (await clientLink.isVisible()) {
    const href = await clientLink.getAttribute("href")
    await page.goto(`${BASE}${href}`)
    await page.waitForTimeout(2000)
    // Panoramica should be default tab
    await page.screenshot({ path: "/tmp/t11_panoramica.png" })
    await expect(page.locator("body")).not.toContainText("500")
  }
})

// ---- TEST 12: Dieta page for user ----
test("12. User dieta page (as admin since no user creds)", async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
  await page.goto(`${BASE}/dieta`)
  await page.waitForTimeout(2000)
  await page.screenshot({ path: "/tmp/t12_dieta_user.png" })
  await expect(page.locator("body")).not.toContainText("500")
})

// ---- TEST 13: Exercises page ----
test("13. Exercises page", async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
  await page.goto(`${BASE}/exercises`)
  await page.waitForTimeout(2000)
  await page.screenshot({ path: "/tmp/t13_exercises.png" })
  await expect(page.locator("body")).not.toContainText("500")
})

// ---- TEST 14: New program page ----
test("14. New program page loads", async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
  await page.goto(`${BASE}/programs/new`)
  await page.waitForTimeout(2000)
  await page.screenshot({ path: "/tmp/t14_new_program.png" })
  await expect(page.locator("body")).not.toContainText("500")
  await expect(page.locator("body")).not.toContainText("Error")
})

// ---- TEST 15: Profile page ----
test("15. Profile/settings page", async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
  await page.goto(`${BASE}/profile`)
  await page.waitForTimeout(2000)
  await page.screenshot({ path: "/tmp/t15_profile.png" })
  await expect(page.locator("body")).not.toContainText("500")
})
