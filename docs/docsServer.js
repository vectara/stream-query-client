const esbuild = require("esbuild");
const chokidar = require("chokidar");
const liveServer = require("live-server");
const buildConfig = require("../buildConfig");
const { config: devScriptBuildConfig } = require("./buildConfigs");

(async () => {
  // Builder for the component package
  const packageBuilder = await esbuild.context({
    ...buildConfig,
    entryPoints: ["../src/index.ts"],
    outdir: "../lib",
    outbase: "../src",
  });

  // Builder for the development page
  const devPageBuilder = await esbuild.context(devScriptBuildConfig);

  chokidar
    // Watch for changes to dev env code or react-search src
    .watch(["src/*.{ts,tsx}", "src/**/*.{ts,tsx}", "../src/**/*.{ts,tsx}"], {
      interval: 0, // No delay
    })
    .on("all", async () => {
      await packageBuilder.rebuild();
      devPageBuilder.rebuild();
    });

  // `liveServer` local server for hot reload.
  liveServer.start({
    open: true,
    port: +process.env.PORT || 8080,
    root: "public",
  });
})();
