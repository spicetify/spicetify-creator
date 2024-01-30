import { mkdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { promisify } from "util";
import { exec } from "child_process";

import { BuildOptions } from "esbuild";
import externalGlobalPlugin from "esbuild-plugin-external-global";
import inlineImportPlugin from "esbuild-plugin-inline-import";
import stylePlugin from "esbuild-style-plugin";
import autoprefixer from "autoprefixer";

import buildCustomApp from "./buildCustomApp.js";
import buildExtension from "./buildExtension.js";

const execute = promisify(exec);

async function build(watch: boolean, minify: boolean, outDirectory?: string, inDirectory?: string) {
  if (!inDirectory) inDirectory = "./src";
  const settings: CustomAppSettings & ExtensionSettings = JSON.parse(
    readFileSync(`${inDirectory}/settings.json`, "utf-8"),
  );
  const isExtension = !Object.keys(settings).includes("icon");
  const id = settings.nameId.replace(/\-/g, "D");

  if (isExtension) {
    console.log("Extension detected");
  } else {
    console.log("Custom App detected");
  }

  if (!outDirectory) {
    const spicetifyDirectory = await execute("spicetify path userdata").then((output) =>
      output.stdout.trim(),
    );
    if (isExtension) {
      outDirectory = join(spicetifyDirectory, "Extensions");
    } else {
      outDirectory = join(spicetifyDirectory, "CustomApps", settings.nameId);
    }
  }

  if (!existsSync(outDirectory)) {
    mkdirSync(outDirectory, { recursive: true });
  }

  const esbuildOptions = {
    platform: "browser",
    external: ["react", "react-dom", "react-query"],
    bundle: true,
    globalName: id,
    plugins: [
      inlineImportPlugin(),
      stylePlugin({
        postcss: {
          plugins: [autoprefixer],
        },
        cssModulesOptions: {
          generateScopedName: `[name]__[local]___[hash:base64:5]_${id}`,
        },
      }),
      externalGlobalPlugin.externalGlobalPlugin({
        "react": "Spicetify.React",
        "react-dom": "Spicetify.ReactDOM",
        "react-query": "Spicetify.ReactQuery",
      }),
    ],
    minify,
  } as unknown as BuildOptions;

  if (isExtension) {
    buildExtension(settings, outDirectory, watch, esbuildOptions, inDirectory);
  } else {
    buildCustomApp(settings, outDirectory, watch, esbuildOptions, inDirectory);
  }

  if (watch) {
    console.log("Watching...");
  }
}

export { build };
