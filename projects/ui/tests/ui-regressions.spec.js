import { test, expect } from "@playwright/test";

const models = ["llama3.2:latest", "gpt-oss:latest"];
const routes = [
  "sales-brochure-generator",
  "ai-tutor",
  "multi-model-chat",
  "ai-assistant",
];

test.beforeEach(async ({ page }) => {
  await page.route("**/models", (route) => route.fulfill({ json: { models } }));
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 768, height: 600 },
]) {
  test(`controls stay inside their panels at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.goto(`/${route}`);
      await expect(page.getByRole("combobox").first()).toBeEnabled();
      const overflow = await page
        .locator(
          ".genie-composer-footer, .composer-controls, .discussion-composer-controls, .editor-toolbar",
        )
        .evaluateAll(
          (elements) =>
            elements.filter(
              (element) => element.scrollWidth > element.clientWidth + 1,
            ).length,
        );
      expect(overflow, route).toBe(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(viewport.width);
    }
    if (viewport.width === 768) {
      await page.goto("/sales-brochure-generator");
      const inspector = await page
        .locator(".workbench-inspector")
        .boundingBox();
      const editor = await page.locator(".document-editor").boundingBox();
      expect(inspector.y + inspector.height).toBeLessThanOrEqual(editor.y + 1);
    }
  });
}

test("assistant error separates retry and long model options fit mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.route("**/models", (route) => route.abort());
  await page.goto("/ai-assistant");
  const alert = page.locator(".studio-alert");
  await expect(alert).toContainText("Cannot reach Genie");
  const message = await alert
    .locator('[data-slot="alert-description"] > span')
    .boundingBox();
  const retry = alert.getByRole("button", { name: "Try again" });
  const button = await retry.boundingBox();
  expect(button.y - message.y - message.height).toBeGreaterThanOrEqual(10);
  const longModel =
    "custom-research-model-with-a-very-long-descriptive-name:experimental-version";
  await page.route("**/models", (route) =>
    route.fulfill({ json: { models: [longModel] } }),
  );
  await retry.click();
  await expect(alert).toHaveCount(0);
  await page.getByRole("combobox").click();
  const menu = page.getByRole("listbox");
  const bounds = await menu.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
  await page.getByRole("option").click();
  await expect(page.getByRole("combobox")).toHaveAttribute("title", longModel);
});

test("empty responses report failure and allow retry", async ({ page }) => {
  await page.route("**/teach-stream", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body: "data: [DONE]\n\n",
    }),
  );
  await page.goto("/ai-tutor");
  await page
    .getByLabel("What would you like to understand?")
    .fill("Explain gravity");
  await page.getByRole("button", { name: "Help me understand" }).click();
  await expect(page.locator(".studio-alert")).toContainText(
    "No answer arrived",
  );
  await expect(page.getByRole("status")).toContainText("Response interrupted");
  await expect(
    page.getByRole("button", { name: "Help me understand" }),
  ).toBeEnabled();

  await page.route("**/mutimodel-chat", (route) =>
    route.fulfill({
      contentType: "application/x-ndjson",
      body: '{"type":"done"}\n',
    }),
  );
  await page.goto("/multi-model-chat");
  await page.getByLabel("What's on the table?").fill("Discuss gravity");
  await page.getByRole("button", { name: "Start conversation" }).click();
  await expect(page.locator(".studio-alert")).toContainText(
    "No replies arrived",
  );
  await expect(page.getByRole("status")).toContainText("Interrupted");
  await expect(
    page.getByRole("button", { name: "Start conversation" }),
  ).toBeEnabled();
});

test("failed brochure regeneration preserves the last draft and source", async ({
  page,
}) => {
  await page.route("**/generate-brochure", (route) =>
    route.fulfill({
      json: {
        data: {
          heading: "Saved draft",
          description: "A useful description.",
          summary: "Ready to share.",
          bullet_points: ["First benefit"],
        },
      },
    }),
  );
  await page.goto("/sales-brochure-generator");
  await page.getByLabel("Website URL").fill("https://example.com/original");
  await page.getByRole("button", { name: "Generate brochure" }).click();
  await expect(
    page.getByRole("heading", { name: "Saved draft" }),
  ).toBeVisible();
  await page.route("**/generate-brochure", (route) =>
    route.fulfill({
      status: 500,
      json: { detail: "Try again later" },
    }),
  );
  await page.getByLabel("Website URL").fill("https://example.com/new");
  await page.getByRole("button", { name: "Generate brochure" }).click();
  await expect(page.locator(".studio-alert")).toContainText("Try again later");
  await expect(
    page.getByRole("heading", { name: "Saved draft" }),
  ).toBeVisible();
  await expect(page.locator(".document-bottom")).toContainText(
    "https://example.com/original",
  );
  await expect(page.getByRole("button", { name: "Download" })).toBeEnabled();
});

test("mobile home closes the drawer and landscape search restores focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 667, height: 375 });
  await page.goto("/sales-brochure-generator");
  const input = page.getByLabel("Website URL");
  await input.focus();
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(375);
  await page.keyboard.press("Escape");
  await expect(input).toBeFocused();
  await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  await page.getByRole("link", { name: "AI Studio home" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
