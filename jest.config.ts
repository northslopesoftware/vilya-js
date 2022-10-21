export default {
  coverageDirectory: "coverage",
  projects: [
    {
      displayName: "node",
      testEnvironment: "node",
      testMatch: [
        "**/__tests__/**/*.test.ts",
        //   "**/?(*.)+(spec|test).[tj]s?(x)"
      ],
    },
    {
      displayName: "browser",
      testMatch: ["**/__tests__/**/*.test.browser.ts"],
      testEnvironment: "jsdom",
    },
  ],
};
