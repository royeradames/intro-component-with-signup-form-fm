import { expect, test, type Locator } from "@playwright/test";

async function contrast(locator: Locator) {
  return locator.evaluate(async element => {
    const channels = (color: string) => {
      const values = color.match(/[\d.]+/g)?.map(Number);
      if (!color.startsWith("rgb") || !values || values.length < 3) throw new Error(`Unsupported color ${color}`);
      return values;
    };
    const luminance = (values: number[]) => {
      const linear = values.slice(0, 3).map(channel => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    let surface: Element | null = element;
    while (surface && getComputedStyle(surface).backgroundColor === "rgba(0, 0, 0, 0)") surface = surface.parentElement;
    if (!surface) throw new Error("No painted background");
    const style = getComputedStyle(element);
    const backing = getComputedStyle(surface);
    const foreground = channels(style.color);
    const base = channels(backing.backgroundColor);
    const backgrounds = [base];
    if (backing.backgroundImage !== "none") {
      if (surface !== document.body || backing.backgroundRepeat !== "repeat" || backing.backgroundPosition !== "50% 0%") throw new Error("Unsupported image placement");
      const url = backing.backgroundImage.match(/^url\("(.+)"\)$/)?.[1];
      if (!url) throw new Error("Unsupported background image");
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No image color sampler");
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const body = surface.getBoundingClientRect();
      const text = element.getBoundingClientRect();
      const originX = body.left + (body.width - canvas.width) / 2;
      const wrap = (value: number, length: number) => ((Math.floor(value) % length) + length) % length;
      // Sample the real repeating PNG below the text area, compositing its alpha onto coral.
      for (let y = text.top; y < text.bottom; y += 8) {
        for (let x = text.left; x < text.right; x += 8) {
          const offset = (wrap(y - body.top, canvas.height) * canvas.width + wrap(x - originX, canvas.width)) * 4;
          const alpha = pixels[offset + 3] / 255;
          backgrounds.push(base.slice(0, 3).map((channel, index) => pixels[offset + index] * alpha + channel * (1 - alpha)));
        }
      }
    }
    const ratios = backgrounds.map(background => {
      const painted = foreground.slice(0, 3).map((channel, index) => channel * (foreground[3] ?? 1) + background[index] * (1 - (foreground[3] ?? 1)));
      const a = luminance(painted);
      const b = luminance(background);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
    const size = parseFloat(style.fontSize);
    const large = size >= 24 || (size >= 18.6667 && Number(style.fontWeight) >= 700);
    return { color: style.color, background: backing.backgroundColor, image: backing.backgroundImage, minimum: large ? 3 : 4.5, ratio: Math.min(...ratios) };
  });
}

test("intro copy and submit states remain readable over their actual backgrounds", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    for (const locator of await page.locator("h1, .intro-copy p, .offer, .claim, .field-hint, .terms, .demo-note, footer a").all()) {
      const result = await contrast(locator);
      expect.soft(result.ratio, `default ${width}: ${JSON.stringify(result)}`).toBeGreaterThanOrEqual(result.minimum);
    }
    const button = page.getByRole("button", { name: "Claim your free trial" });
    await button.hover();
    const hover = await contrast(button);
    expect.soft(hover.ratio, `button hover ${width}: ${JSON.stringify(hover)}`).toBeGreaterThanOrEqual(hover.minimum);
    await button.click();
    for (const error of await page.locator(".field-error").all()) {
      const result = await contrast(error);
      expect.soft(result.ratio, `error ${width}: ${JSON.stringify(result)}`).toBeGreaterThanOrEqual(result.minimum);
    }
    const link = page.locator("footer a").last();
    await link.hover();
    const result = await contrast(link);
    expect.soft(result.ratio, `footer hover ${width}: ${JSON.stringify(result)}`).toBeGreaterThanOrEqual(result.minimum);
  }
});


test("footer links have distinct reachable pointer targets in default and error states", async ({ page }) => {
  for (const width of [320, 375, 400, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    for (const errors of [false, true]) {
      if (errors) await page.getByRole("button", { name: "Claim your free trial" }).click();
      for (const link of await page.locator("footer a").all()) {
        await link.hover({ timeout: 1500 });
        const hit = await link.evaluate(element => {
          const box = element.getBoundingClientRect();
          const target = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
          return { reachable: target === element || element.contains(target), text: element.textContent, hitText: target?.textContent };
        });
        expect(hit.reachable, `width ${width}, errors ${errors}: ${JSON.stringify(hit)}`).toBe(true);
      }
    }
  }
});
