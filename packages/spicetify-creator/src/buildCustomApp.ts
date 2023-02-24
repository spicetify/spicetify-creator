import glob from 'glob'
import chalk from 'chalk';
import fs from 'fs'
import path from 'path'
import { ICustomAppManifest, ICustomAppSettings, IExtensionSettings } from './helpers/models'
import extractFiles from './helpers/extractFiles'
import { minifyFolder } from './helpers/minify';
const esbuild = require("esbuild")

export default async (settings: ICustomAppSettings, outDirectory: string, watch: boolean, esbuildOptions: any, minify: boolean) => {
  const extensions = glob.sync("./src/extensions/*(*.ts|*.tsx|*.js|*.jsx)");
  const extensionsNewNames = extensions.map(e => e.substring(0, e.lastIndexOf(".")) + ".js");
  const iconPath = settings.icon ? path.join('./src', settings.icon) : null;
  const activeIconPath = settings.activeIcon ? path.join('./src', settings.activeIcon) : iconPath;

  console.log("Generating manifest.json...")
  const customAppManifest = <ICustomAppManifest>{
    name:               settings.displayName,
    icon:               iconPath ? fs.readFileSync(iconPath, 'utf-8') : "",
    "active-icon":      activeIconPath ? fs.readFileSync(activeIconPath, 'utf-8') : "",
    subfiles:           [],
    subfiles_extension: extensionsNewNames.map(e => path.basename(e))
  }
  fs.writeFileSync(path.join(outDirectory, "manifest.json"), JSON.stringify(customAppManifest, null, 2))

  const appPath = path.resolve(glob.sync('./src/*(app.ts|app.tsx|app.js|app.jsx)')[0]);
  const tempFolder = path.join(__dirname,`./temp/`);
  const indexPath = path.join(tempFolder,`index.jsx`);

  if (!fs.existsSync(tempFolder))
    fs.mkdirSync(tempFolder)
  fs.writeFileSync(indexPath, `
import App from \'${appPath.replace(/\\/g, "/")}\'
import React from 'react';

export default function render() {
  return <App />;
}
  `.trim())

  esbuild.build({
    entryPoints: [indexPath, ...extensions],
    outdir: outDirectory,
    ...esbuildOptions,
    watch: (watch ? {
      async onRebuild(error: any, result: any) {
        if (error)
          console.error(error)
        else {
          await afterBundle();
        }
      },
    } : undefined),
  }).then(async (r: any) => {
    await afterBundle();
    return r;
  })

  const afterBundle = async () => {
    console.log("Moving files out of folders...");
    extractFiles(outDirectory, true);

    console.log("Modifying index.js...")
    fs.appendFileSync(path.join(outDirectory, "index.js"), `const render=()=>${esbuildOptions.globalName}.default();\n`);

    console.log("Renaming index.css...")
    if (fs.existsSync(path.join(outDirectory, "index.css")))
      fs.renameSync(path.join(outDirectory, "index.css"), path.join(outDirectory, "style.css"))
    
    if (minify) {
      console.log("Minifying...");
      await minifyFolder(outDirectory);
    }

    console.log(chalk.green('Build succeeded.'));
  }
}
