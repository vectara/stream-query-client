const { build } = require("esbuild");
const config = require("./buildConfig");

build({
  ...config,
  entryPoints: ["src/index.ts"],
  outdir: "./lib",
  outbase: "./src",
});
