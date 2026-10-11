import { expect, test, type Page } from "@playwright/test";

const fieldLabels = ["First Name", "Last Name", "Email Address", "Password", "Confirm Password"];
const passwordRule = "At least 15 characters";
const validPassword = "correct-horse-battery";

async function fillValid(page: Page) {
  await page.getByLabel("First Name").fill("Jonathan");
  await page.getByLabel("Last Name").fill("Doe");
  await page.getByLabel("Email Address").fill("jonathan@example.com");
  await page.getByLabel("Password", { exact: true }).fill(validPassword);
  await page.getByLabel("Confirm Password").fill(validPassword);
}

test("renders the supplied copy, landmarks and an honest demo notice", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Intro component with sign up form | Royer Adames");
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Learn to code by watching others");
  await expect(page.getByText("See how experienced developers solve problems in real-time.", { exact: false })).toBeVisible();
  await expect(page.getByText("Try it free 7 days then $20/mo. thereafter")).toBeVisible();
  const form = page.getByRole("form", { name: "Claim your free trial" });
  for (const label of fieldLabels) await expect(form.getByLabel(label, { exact: true })).toBeVisible();
  await expect(form.getByRole("button", { name: "Claim your free trial" })).toBeEnabled();
  await expect(page.getByText("By clicking the button, you are agreeing to our Terms and Services")).toBeVisible();
  await expect(page.getByText("Demo only: nothing is sent.")).toBeVisible();
});

test("declares one site name in the footer, og:site_name and WebSite JSON-LD", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".site-name")).toHaveText("Intro component with sign up form");
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "Intro component with sign up form");
  const jsonLd = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() ?? "{}");
  expect(jsonLd).toEqual({ "@context": "https://schema.org", "@type": "WebSite", name: "Intro component with sign up form", url: "https://intro-component-with-signup-form-fm.royeradames.com" });
});

test("an empty submit shows every challenge message and focuses the first invalid field", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Claim your free trial" }).click();
  for (const label of fieldLabels) {
    const input = page.getByLabel(label, { exact: true });
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription(label === "Password" ? `Password cannot be empty ${passwordRule}` : `${label} cannot be empty`);
  }
  await expect(page.getByLabel("First Name")).toBeFocused();
  await expect(page.getByLabel("First Name")).toHaveCSS("background-image", /icon-error\.svg/);
});

test("focus moves to the first invalid field in form order, and errors clear as they are fixed", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("First Name").fill("Jonathan");
  await page.getByLabel("Last Name").fill("Doe");
  await page.getByLabel("Email Address").fill("email@example/com");
  await page.getByRole("button", { name: "Claim your free trial" }).click();
  const email = page.getByLabel("Email Address");
  await expect(email).toBeFocused();
  await expect(email).toHaveAccessibleDescription("Looks like this is not an email");
  await expect(page.getByLabel("Password", { exact: true })).toHaveAccessibleDescription(`Password cannot be empty ${passwordRule}`);
  await expect(page.getByLabel("First Name")).not.toHaveAttribute("aria-invalid", "true");
  await email.fill("email@example.com");
  await expect(email).not.toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Looks like this is not an email")).toHaveCount(0);
  await page.getByRole("button", { name: "Claim your free trial" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
});

test("keyboard submit is busy (not disabled), blocks re-entry and confirms nothing was sent", async ({ page }) => {
  const writes: string[] = [];
  page.on("request", request => { if (request.method() !== "GET") writes.push(request.url()); });
  await page.goto("/");
  await fillValid(page);
  const button = page.getByRole("button", { name: "Claim your free trial" });
  await page.getByLabel("Confirm Password").press("Enter");
  await expect(button).toHaveAttribute("aria-busy", "true");
  await expect(button).toBeEnabled();
  await expect(page.getByRole("status")).toHaveText("Checking your details…");
  await button.focus();
  await expect(button).toBeFocused();
  await page.keyboard.press("Enter");
  const status = page.getByRole("status");
  await expect(status).toHaveText("Thanks, Jonathan! Your trial claim worked in this demo, but nothing was sent.");
  await expect(status).toBeFocused();
  await expect(button).not.toHaveAttribute("aria-busy", "true");
  await expect(page.getByLabel("First Name")).toHaveValue("");
  expect(writes).toEqual([]);
});

test("hover and focus states follow the active-state design", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const button = page.getByRole("button", { name: "Claim your free trial" });
  await expect(button).toHaveCSS("background-color", "rgb(56, 204, 139)");
  await button.hover();
  await expect(button).toHaveCSS("background-color", "rgb(119, 226, 179)");
  const first = page.getByLabel("First Name");
  await first.focus();
  await expect(first).toHaveCSS("border-top-color", "rgb(94, 84, 164)");
});

test("follows the Figma arrangement at mobile, tablet and desktop", async ({ page }) => {
  const box = async (selector: string) => (await page.locator(selector).boundingBox())!;
  await page.setViewportSize({ width: 375, height: 1000 });
  await page.goto("/");
  let heading = await box("h1");
  let card = await box(".signup-card");
  expect(card.y).toBeGreaterThan(heading.y + heading.height);
  expect(Math.round(card.width)).toBe(327);
  await expect(page.locator("h1")).toHaveCSS("text-align", "center");

  await page.setViewportSize({ width: 768, height: 1024 });
  card = await box(".signup-card");
  expect(Math.round(card.width)).toBe(540);
  expect(Math.abs(card.x + card.width / 2 - 384)).toBeLessThan(2);
  expect(Math.round((await box("#firstName")).width)).toBe(460);
  expect(Math.round((await box("#firstName")).height)).toBe(56);

  await page.setViewportSize({ width: 1440, height: 800 });
  heading = await box("h1");
  card = await box(".signup-card");
  expect(card.x).toBeGreaterThan(heading.x + heading.width);
  expect(Math.round(card.width)).toBe(540);
  expect(Math.round(heading.width)).toBe(525);
  expect(Math.abs(card.x - 736)).toBeLessThanOrEqual(1);
  expect(Math.round((await box(".offer")).height)).toBe(60);
  expect(Math.round((await box(".claim")).height)).toBe(56);
  await expect(page.locator("h1")).toHaveCSS("font-size", "50px");
  await expect(page.locator("h1")).toHaveCSS("text-align", "left");
});

test("fits narrow and enlarged layouts with the family text and target floors", async ({ page }) => {
  for (const width of [320, 375, 400, 640, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Claim your free trial" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const smallText = await page.locator("h1, p, input, button, footer, footer a").evaluateAll(elements =>
      elements.filter(element => element.getClientRects().length > 0 && parseFloat(getComputedStyle(element).fontSize) < 16).map(element => element.textContent));
    expect(smallText).toEqual([]);
    for (const control of await page.locator("a, button, input").all()) {
      const controlBox = await control.boundingBox();
      expect(controlBox?.height).toBeGreaterThanOrEqual(44);
    }
  }
  await page.setViewportSize({ width: 640, height: 900 });
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("without JavaScript a submit sends nothing and never puts the typed details in the URL", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const writes: string[] = [];
  page.on("request", request => { if (request.method() !== "GET") writes.push(request.url()); });
  try {
    await page.goto(`${baseURL}/`);
    await expect(page.getByText("Demo only: nothing is sent.")).toBeVisible();
    await page.getByLabel("First Name").fill("Jonathan");
    await page.getByLabel("Email Address").fill("jonathan@example.com");
    await page.getByLabel("Password", { exact: true }).fill(validPassword);
    await page.getByLabel("Confirm Password").fill(validPassword);
    await page.getByRole("button", { name: "Claim your free trial" }).click();
    await page.waitForLoadState();
    expect(new URL(page.url()).search).toBe("");
    expect(page.url()).not.toContain(validPassword);
    expect(writes).toEqual([]);
  } finally {
    await context.close();
  }
});

/* QA sweep October 8 (PW1, PW2): creating a password must ask for it twice and show its requirement before any submit. */
test("the new password shows its requirement up front, checks it live, and must be confirmed", async ({ page }) => {
  await page.goto("/");
  const password = page.getByLabel("Password", { exact: true });
  const confirm = page.getByLabel("Confirm Password");
  await expect(password).toHaveAttribute("autocomplete", "new-password");
  await expect(confirm).toHaveAttribute("autocomplete", "new-password");
  await expect(confirm).toHaveAttribute("type", "password");
  const rule = page.locator("#password-rule");
  await expect(rule).toBeVisible();
  await expect(rule).toContainText(passwordRule);
  await expect(password).toHaveAccessibleDescription(passwordRule);
  await expect(rule).toHaveAttribute("data-met", "false");
  await password.fill("short-pass");
  await expect(rule).toHaveAttribute("data-met", "false");
  await password.fill(validPassword);
  await expect(rule).toHaveAttribute("data-met", "true");
  await expect(rule).toContainText(`${passwordRule} (done)`);

  await page.getByLabel("First Name").fill("Jonathan");
  await page.getByLabel("Last Name").fill("Doe");
  await page.getByLabel("Email Address").fill("jonathan@example.com");
  await password.fill("short-pass");
  await confirm.fill("another-pass");
  await page.getByRole("button", { name: "Claim your free trial" }).click();
  await expect(password).toBeFocused();
  await expect(password).toHaveAccessibleDescription(`Password is too short ${passwordRule}`);
  await expect(confirm).toHaveAccessibleDescription("Passwords do not match");
  await password.fill(validPassword);
  await page.getByRole("button", { name: "Claim your free trial" }).click();
  await expect(confirm).toBeFocused();
  await expect(confirm).toHaveAttribute("aria-invalid", "true");
  await confirm.fill(validPassword);
  await expect(confirm).not.toHaveAttribute("aria-invalid", "true");
  await page.getByRole("button", { name: "Claim your free trial" }).click();
  await expect(page.getByRole("status")).toHaveText("Thanks, Jonathan! Your trial claim worked in this demo, but nothing was sent.");
});

/* October 11 audit, principle 7 (BTN8): "Claim your free trial" wrapped onto two lines from 320 to 340 px. The card gives way, the words don't. */
test("the claim button label stays on one line from 320 to 1920 px", async ({ page }) => {
  await page.goto("/");
  const button = page.getByRole("button", { name: "Claim your free trial" });
  for (const width of [320, 325, 330, 335, 340, 350, 360, 375, 400, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    const lines = await button.evaluate(element => {
      const tops = new Set<number>();
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.nodeValue?.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const rect of range.getClientRects()) if (rect.width > 0.5) tops.add(Math.round(rect.top));
      }
      return tops.size;
    });
    expect(lines, `label lines at ${width}px`).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no page scroll at ${width}px`).toBe(true);
  }
});

/* October 11 audit: the served form carried React's javascript: placeholder action, which the HTML validator rejects. */
test("the served form has no javascript: action", async ({ request }) => {
  const html = await (await request.get("/")).text();
  const form = html.match(/<form\b[^>]*>/)?.[0] ?? "";
  expect(form).not.toBe("");
  expect(form).not.toMatch(/javascript:/i);
});
