import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync, renameSync } from "fs";
import { tmpdir } from "os";
import { resolve, join, basename } from "path";
import { createHash } from "crypto";

import { globSync } from "glob";
import chalk from "chalk";
import { build, BuildOptions } from "esbuild";

import extractFiles from "./helpers/extractFiles.js";

function buildCustomApp(
  settings: CustomAppSettings,
  outDirectory: string,
  watch: boolean,
  esbuildOptions: BuildOptions,
  inDirectory: string,
) {
  const extensions = globSync(`${inDirectory}/extensions/*(*.ts|*.tsx|*.js|*.jsx)`);
  const extensionsNewNames = extensions.map(
    (extension) => extension.substring(0, extension.lastIndexOf(".")) + ".js",
  );
  const iconPath = settings.icon ? join(inDirectory, settings.icon) : null;
  const activeIconPath = settings.activeIcon ? join(inDirectory, settings.activeIcon) : iconPath;

  console.log("Generating manifest.json...");
  const customAppManifest: CustomAppManifest = {
    "name": settings.displayName,
    "icon": iconPath ? readFileSync(iconPath, "utf-8") : "",
    "active-icon": activeIconPath ? readFileSync(activeIconPath, "utf-8") : "",
    "subfiles": [],
    "subfiles_extension": extensionsNewNames.map((extensionNewName) => basename(extensionNewName)),
  };
  writeFileSync(join(outDirectory, "manifest.json"), JSON.stringify(customAppManifest, null, 2));

  const appPath = resolve(globSync(`${inDirectory}/*(app.ts|app.tsx|app.js|app.jsx)`)[0]);
  const projectHash = createHash("shake256", { outputLength: 8 })
    .update(appPath + esbuildOptions.globalName)
    .digest("hex");
  const tempFolderPath = join(tmpdir(), `spicetify-creator-${projectHash}`);
  const indexPath = join(tempFolderPath, `index.jsx`);

  if (!existsSync(tempFolderPath)) mkdirSync(tempFolderPath);
  writeFileSync(
    indexPath,
    `
import App from \'${appPath.replace(/\\/g, "/")}\'
import React from 'react';

export default function render() {
  return <App />;
}
  `.trim(),
  );

  build({
    entryPoints: [indexPath, ...extensions],
    outdir: outDirectory,
    ...esbuildOptions,
    watch: watch
      ? {
          onRebuild(error: any) {
            if (error) console.error(error);
            else {
              afterBundle();
            }
          },
        }
      : undefined,
  }).then((result) => {
    afterBundle();
    return result;
  });

  function afterBundle() {
    console.log("Moving files out of folders...");
    extractFiles(outDirectory, true);

    console.log("Modifying index.js...");
    appendFileSync(
      join(outDirectory, "index.js"),
      `const render=()=>${esbuildOptions.globalName}.default();\n`,
    );

    console.log("Renaming index.css...");
    const indexCSSPath = join(outDirectory, "index.css");
    if (existsSync(indexCSSPath)) {
      renameSync(indexCSSPath, join(outDirectory, "style.css"));
    }

    // Account for dynamic hooking of React and ReactDOM
    extensionsNewNames
      .map((extensionsNewName) => basename(extensionsNewName))
      .map((extensionFile) => {
        const extensionFilePath = join(outDirectory, extensionFile);
        writeFileSync(
          extensionFilePath,
          `
        (async function() {
          while (!Spicetify.React || !Spicetify.ReactDOM) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          ${readFileSync(extensionFilePath, "utf-8")}
        })();
      `.trim(),
        );
      });

    console.log(chalk.green("Build succeeded."));
  }
}

export default buildCustomApp;
