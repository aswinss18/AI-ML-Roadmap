import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const models = ["llama3.2:latest", "gpt-oss:latest"];
const brochure = {
  heading: "A better way to build",
  description: "Thoughtful tools for ambitious teams.",
  bullet_points: [
    "Clear workflows",
    "Shared knowledge",
    "Less busywork",
    "More possibility",
  ],
  summary: "Make the next idea happen.",
  colors: {
    primary_color: "#6951b5",
    secondary_color: "#ddd5ef",
    tertiary_color: "#8f7ac5",
  },
};
test.beforeEach(async ({ page }) => {
  await page.route("**/models", (route) => route.fulfill({ json: { models } }));
});

test("all tools render in both themes without runtime errors or desktop overflow", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const theme of ["light", "dark"]) {
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    for (const route of [
      "sales-brochure-generator",
      "ai-tutor",
      "multi-model-chat",
      "ai-assistant",
    ]) {
      await page.goto(`/${route}`);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("html")).toHaveClass(new RegExp(theme));
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBeTruthy();
      await page.screenshot({
        path: `test-results/screenshots/${route}-${theme}.png`,
        fullPage: true,
        animations: "disabled",
      });
    }
  }
  expect(errors).toEqual([]);
});

test("mobile tools fit the viewport and navigation closes after switching", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const route of [
    "sales-brochure-generator",
    "ai-tutor",
    "multi-model-chat",
    "ai-assistant",
  ]) {
    await page.goto(`/${route}`);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `test-results/screenshots/${route}-mobile.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
  await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Sales brochure" })
    .click();
  await expect(page).toHaveURL(/sales-brochure-generator/);
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("appearance persists and keyboard search navigates to a tool", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Appearance" }).click();
  await page.getByRole("menuitemradio", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.keyboard.press("Control+k");
  await page.getByPlaceholder("What would you like to do?").fill("tutor");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/ai-tutor/);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Getting started" }).click();
  await expect(
    page.getByRole("heading", { name: "Your workspace, explained." }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Getting started" }),
  ).toBeFocused();
});

test("brochure preserves request fields, source URL, copy, download, and text preview", async ({
  page,
  context,
}) => {
  let payload;
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.route("**/generate-brochure", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { data: brochure } });
  });
  await page.goto("/sales-brochure-generator");
  await page.getByLabel("Website URL").fill("https://example.com");
  await page.getByRole("button", { name: "Generate brochure" }).click();
  await expect(
    page.getByRole("heading", { name: brochure.heading }),
  ).toBeVisible();
  expect(payload).toEqual({
    url: "https://example.com",
    model: "gpt-oss:latest",
  });
  await page.getByLabel("Website URL").fill("https://changed.example.com");
  await expect(page.locator(".document-bottom")).toContainText(
    "https://example.com",
  );
  await page.getByRole("button", { name: "Copy brochure" }).click();
  const copyToast = page.locator('[data-slot="toast"]').filter({
    hasText: "Brochure copied to clipboard.",
  });
  await expect(copyToast).toContainText("Your model, your conversation");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    brochure.heading,
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).click();
  expect((await download).suggestedFilename()).toBe("sales-brochure.md");
  await page.getByRole("tab", { name: "Plain text" }).click();
  await expect(page.locator(".brochure-plain-text")).toContainText(
    "# A better way to build",
  );
});

test("brochure errors are actionable and can be retried", async ({ page }) => {
  await page.route("**/generate-brochure", (route) =>
    route.fulfill({
      status: 502,
      json: { detail: "The website is unavailable." },
    }),
  );
  await page.goto("/sales-brochure-generator");
  await page.getByLabel("Website URL").fill("https://example.com");
  await page.getByRole("button", { name: "Generate brochure" }).click();
  await expect(page.locator(".studio-alert")).toContainText(
    "The website is unavailable.",
  );
  await expect(
    page.getByRole("button", { name: "Generate brochure" }),
  ).toBeEnabled();
});

test("tutor handles SSE framing and retains the model used for an answer", async ({
  page,
}) => {
  let payload;
  await page.route("**/teach-stream", (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({
      contentType: "text/event-stream",
      body: 'data: {"content":"## A clear explanation\\n\\n"}\r\n\r\ndata: {"content":"Light scatters in the atmosphere."}\r\n\r\ndata: [DONE]\r\n\r\n',
    });
  });
  await page.goto("/ai-tutor");
  await page.getByRole("button", { name: /Everyday science/ }).click();
  await expect(
    page.getByLabel("What would you like to understand?"),
  ).toBeFocused();
  await page.getByRole("button", { name: "Help me understand" }).click();
  await expect(
    page.getByRole("heading", { name: "A clear explanation" }),
  ).toBeVisible();
  expect(payload).toEqual({
    question: "Why does the sky look blue?",
    model: "llama3.2:latest",
  });
  await expect(page.getByRole("status")).toContainText("Answer complete");
  await expect(page.locator('[data-slot="toast"]')).toContainText(
    "Tutor answer ready.",
  );
  await page.getByRole("combobox").click();
  await page
    .getByRole("option", { name: "GPT OSS OpenAI", exact: true })
    .click();
  await expect(page.locator(".response-card-header")).toContainText(
    "Llama 3.2",
  );
});

test("tutor stop and failed response do not leave a permanent thinking state", async ({
  page,
}) => {
  let release;
  let requestCount = 0;
  const waiting = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/teach-stream", async (route) => {
    requestCount += 1;
    await waiting;
    await route
      .fulfill({ contentType: "text/event-stream", body: "data: [DONE]\n\n" })
      .catch(() => {});
  });
  await page.goto("/ai-tutor");
  await page
    .getByLabel("What would you like to understand?")
    .fill("Explain fractions");
  await page.getByRole("button", { name: "Help me understand" }).click();
  await page.getByRole("button", { name: "Stop response" }).click();
  await expect(page.getByRole("status")).toContainText("Response stopped");
  await expect(page.locator(".thinking-state")).toHaveCount(0);
  expect(requestCount).toBe(1);
  release();
});

test("Genie sends raw streaming replies and preserves message alignment", async ({
  page,
}) => {
  let payload;
  await page.route("**/chat-assistant", (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({
      contentType: "text/event-stream",
      body: "## A fresh perspective\n\nStart with a small, useful idea.",
    });
  });
  await page.goto("/ai-assistant");
  await page.getByLabel("Message Genie").fill("Help me brainstorm");
  await page.getByLabel("Message Genie").press("Enter");
  await expect(
    page.getByRole("heading", { name: "A fresh perspective" }),
  ).toBeVisible();
  await expect(page.locator('[data-slot="toast"]')).toContainText(
    "Reply complete.",
  );
  expect(payload).toEqual({
    message: "Help me brainstorm",
    model: "llama3.2:latest",
  });
  await expect(page.locator(".genie-message-user")).toContainText(
    "Help me brainstorm",
  );
  await expect(page.getByRole("button", { name: "Copy reply" })).toBeVisible();
  await expect(page.getByLabel("Message Genie")).toHaveValue("");
});

test("Genie restores an unsuccessful draft and model discovery can retry", async ({
  page,
}) => {
  await page.route("**/models", (route) =>
    route.fulfill({ status: 503, json: { detail: "Unavailable" } }),
  );
  await page.goto("/ai-assistant");
  await expect(page.locator(".studio-alert")).toBeVisible();
  await page.route("**/models", (route) => route.fulfill({ json: { models } }));
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("combobox")).toBeEnabled();
  await page.route("**/chat-assistant", (route) =>
    route.fulfill({
      status: 500,
      json: { detail: "Please try another model." },
    }),
  );
  await page.getByLabel("Message Genie").fill("My important idea");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator(".studio-alert")).toContainText(
    "Please try another model.",
  );
  await expect(page.getByLabel("Message Genie")).toHaveValue(
    "My important idea",
  );
});

test("model conversation preserves NDJSON turns and endpoint contract", async ({
  page,
}) => {
  let payload;
  await page.route("**/mutimodel-chat", (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({
      contentType: "application/x-ndjson",
      body: [
        {
          type: "delta",
          speaker: "jarviz",
          turn: 1,
          text: "Let's start with the basics.",
        },
        {
          type: "delta",
          speaker: "liz",
          turn: 2,
          text: "Here is another perspective.",
        },
        { type: "done" },
      ]
        .map((value) => JSON.stringify(value))
        .join("\n"),
    });
  });
  await page.goto("/multi-model-chat");
  await page.getByLabel("What's on the table?").fill("A city on Mars");
  await page.getByLabel("Liz's model").click();
  await page
    .getByRole("option", { name: "GPT OSS OpenAI", exact: true })
    .click();
  await page.getByRole("button", { name: "Start conversation" }).click();
  await expect(page.getByRole("status")).toContainText("Complete");
  await expect(page.locator('[data-slot="toast"]')).toContainText(
    "Conversation complete.",
  );
  await expect(page.locator(".conversation-turn")).toHaveCount(2);
  expect(payload).toEqual({
    topic: "A city on Mars",
    liz_model: "gpt-oss:latest",
    jarviz_model: "llama3.2:latest",
  });
});

test("early model conversation stream is marked interrupted", async ({
  page,
}) => {
  await page.route("**/mutimodel-chat", (route) =>
    route.fulfill({
      contentType: "application/x-ndjson",
      body: JSON.stringify({
        type: "delta",
        speaker: "jarviz",
        turn: 1,
        text: "An unfinished thought",
      }),
    }),
  );
  await page.goto("/multi-model-chat");
  await page.getByLabel("What's on the table?").fill("A topic");
  await page.getByRole("button", { name: "Start conversation" }).click();
  await expect(page.getByRole("status")).toContainText("Interrupted");
  await expect(page.locator(".studio-alert")).toContainText("ended early");
  await expect(page.getByText("An unfinished thought")).toBeVisible();
});

test("model options show the correct provider marks and preserve model identifiers", async ({
  page,
}) => {
  await page.goto("/sales-brochure-generator");
  await page.getByLabel("AI model", { exact: true }).click();
  await expect(page.getByRole("option")).toHaveCount(6);
  const logos = {
    "Meditron Meditron · EPFL": "meditron.png",
    "DeepSeek R1 DeepSeek · 1.5B": "deepseek-color.svg",
    "Llama 3.2 Meta": "meta-color.svg",
    "GPT OSS OpenAI": "openai.svg",
    "Phi 3 Microsoft": "microsoft-color.svg",
    "Gemma 3 Google · 270M": "gemma-color.svg",
  };
  for (const [name, file] of Object.entries(logos)) {
    const option = page.getByRole("option", { name, exact: true });
    await expect(option.locator("img")).toHaveAttribute(
      "src",
      `/brands/${file}`,
    );
    await expect
      .poll(() =>
        option
          .locator("img")
          .evaluate((image) => image.complete && image.naturalWidth > 0),
      )
      .toBeTruthy();
  }
  await page.screenshot({
    path: "test-results/screenshots/model-selector.png",
    // A full-page capture resizes the viewport and Radix dismisses the menu.
    fullPage: false,
    animations: "disabled",
  });
  await page
    .getByRole("option", { name: "DeepSeek R1 DeepSeek · 1.5B", exact: true })
    .click();
  await expect(page.getByRole("combobox")).toContainText("DeepSeek R1");
});

test("all tool entry screens pass automated accessibility checks in both themes", async ({
  page,
}) => {
  test.setTimeout(60000);
  for (const theme of ["light", "dark"]) {
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    for (const route of [
      "sales-brochure-generator",
      "ai-tutor",
      "multi-model-chat",
      "ai-assistant",
    ]) {
      await page.goto(`/${route}`);
      await expect(page.locator("h1")).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        results.violations,
        `${theme} ${route}: ${JSON.stringify(results.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) })))}`,
      ).toEqual([]);
    }
  }
});

test("document presentation controls and empty conversation geometry are usable", async ({
  page,
}) => {
  await page.route("**/generate-brochure", (route) =>
    route.fulfill({ json: { data: brochure } }),
  );
  await page.goto("/sales-brochure-generator");
  await expect(page.getByRole("button", { name: "Download" })).toBeDisabled();
  await page.getByRole("button", { name: "Add a website" }).click();
  await expect(page.getByLabel("Website URL")).toBeFocused();
  await page.getByRole("button", { name: "Minimal", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Minimal", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Website URL").fill("https://example.com");
  await page.getByRole("button", { name: "Generate brochure" }).click();
  await expect(page.locator(".brochure-document.minimal")).toContainText(
    brochure.heading,
  );
  await page.getByRole("button", { name: "Editorial", exact: true }).click();
  await expect(page.locator(".brochure-document.editorial")).toContainText(
    brochure.heading,
  );
  await page.keyboard.press("Control+b");
  await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  await expect(
    page.getByRole("link", { name: "AI tutor", exact: true }),
  ).toBeVisible();
  for (const route of ["ai-tutor", "ai-assistant", "multi-model-chat"]) {
    await page.goto(`/${route}`);
    const intro = await page
      .locator(".conversation-intro, .discussion-intro")
      .boundingBox();
    const composer = await page
      .locator(".question-composer, .genie-composer")
      .boundingBox();
    expect(intro.y + intro.height).toBeLessThanOrEqual(composer.y + 1);
    expect(composer.y + composer.height).toBeLessThan(1000);
  }
});
