import { defineConfig } from "@playwright/test";

// PORT lets the suite run on whichever build host has a free port; 4561 is this project's usual port.
const port = process.env.PORT ?? "4561";

export default defineConfig({
  testDir: "./tests",
  workers: 2,
  reporter: "list",
  use: { baseURL: `http://127.0.0.1:${port}`, headless: true, channel: "chrome" },
  webServer: {
    command: `npm run start -- --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
});
