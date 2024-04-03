const { build } = require("esbuild");
const { devDependencies } = require("./package.json");

build({
  bundle: true,
  entryPoints: ["src/index.ts"],
  logLevel: "info",
  treeShaking: true,
  minify: true,

  // Removing source maps theoretically shaves around 100kb of the package size.
  // Initially setting this to false and will verify the npm package size.
  sourcemap: false,
  external: [...Object.keys(devDependencies)],
  target: ["esnext", "node12.22.0"],
  outdir: "./lib",
  outbase: "./src",
  format: "cjs",
});
