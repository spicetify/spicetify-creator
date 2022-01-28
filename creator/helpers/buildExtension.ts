import glob from 'glob'
import colors from 'colors/safe'
import fs from 'fs'
import path from 'path'
import { ICustomAppManifest, ICustomAppSettings, IExtensionSettings } from './models'
const esbuild = require("esbuild")
const postCssPlugin = require("esbuild-plugin-postcss2");
const autoprefixer = require("autoprefixer");

export default async (settings: IExtensionSettings, outDirectory: string, watch: boolean, esbuildOptions: any) => {
  const extension = path.join("./src/", settings.main)
  const extensionNewName = path.basename(extension.substring(0, extension.lastIndexOf(".")) + ".js");
  const compiledExtension = path.join(outDirectory, extensionNewName);

  esbuild.build({
    entryPoints: [extension],
    outfile: compiledExtension,
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
    console.log("Adding react and react-dom...")
    const data = fs.readFileSync(compiledExtension, 'utf-8').split("\n");
    const appendAbove = data.findIndex((l) => l.includes(`if (typeof require !== "undefined")`))
    if (appendAbove !== -1) {
      data.splice(appendAbove, 0,        `if (x === "react") return Spicetify.React;`);
      data.splice(appendAbove + 1, 0,    `if (x === "react-dom") return Spicetify.ReactDOM;`);
      fs.writeFileSync(compiledExtension, data.join("\n")+"\n");
    }

    console.log(colors.green('Build succeeded.'));
  }
}