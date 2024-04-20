/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testPathIgnorePatterns: ["src/vui", "docs/"],
  coverageReporters: ["text", "text-summary"],
  coveragePathIgnorePatterns: ["node_modules", "src/vui"],
  moduleDirectories: ["<rootDir>/node_modules", "src"],
  testEnvironmentOptions: {
    customExportConditions: [""],
  },
};
