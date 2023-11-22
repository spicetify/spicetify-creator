import { existsSync, mkdirSync, rmSync, readFileSync, appendFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { tmpdir } from "os";
import { createHash } from "crypto";

import { globSync } from "glob";
import chalk from "chalk";
import { build, BuildOptions } from "esbuild";

function buildExtension(
  settings: ExtensionSettings,
  outDirectory: string,
  watch: boolean,
  esbuildOptions: BuildOptions,
  inDirectory: string,
) {
  const compiledExtensionPath = join(outDirectory, `${settings.nameId}.js`);
  const compiledExtensionCSSPath = join(outDirectory, `${settings.nameId}.css`);

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
import main from \'${appPath.replace(/\\/g, "/")}\'
(async () => {
  await main()
})();
    `.trim(),
  );

  build({
    entryPoints: [indexPath],
    outfile: compiledExtensionPath,
    ...esbuildOptions,
    watch: watch
      ? {
          onRebuild(error) {
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
    if (existsSync(compiledExtensionCSSPath)) {
      console.log("Bundling css and js...");

      const css = readFileSync(compiledExtensionCSSPath, "utf-8");
      rmSync(compiledExtensionCSSPath);

      appendFileSync(
        compiledExtensionPath,
        `
(() => {
  if (!document.getElementById(\`${esbuildOptions.globalName}\`)) {
    const styleElement = document.createElement('style');
    styleElement.id = \`${esbuildOptions.globalName}\`;
    styleElement.textContent = (String.raw\`${css}\`).trim();
    document.head.appendChild(styleElement);
  }
})()
        `.trim(),
      );
    }

    // Account for dynamic hooking of React and ReactDOM
    writeFileSync(
      compiledExtensionPath,
      `
(async function() {
  while (!Spicetify.React || !Spicetify.ReactDOM) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  ${readFileSync(compiledExtensionPath, "utf-8")}
})();
      `.trim(),
    );

    console.log(chalk.green("Build succeeded."));
  }
}

export default buildExtension;
