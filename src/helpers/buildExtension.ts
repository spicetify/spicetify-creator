import glob from 'glob'
import colors from 'colors/safe'
import fs from 'fs'
import path from 'path'
import { ICustomAppManifest, ICustomAppSettings, IExtensionSettings } from './models'
const esbuild = require("esbuild")
const postCssPlugin = require("esbuild-plugin-postcss2");
const autoprefixer = require("autoprefixer");

export default async (settings: IExtensionSettings, outDirectory: string, watch: boolean, esbuildOptions: any) => {
  // const extension = path.join("./src/", "app.tsx")
  // const extensionName = path.basename(extension.substring(0, extension.lastIndexOf(".")));
  const compiledExtension = path.join(outDirectory, `${settings.nameId}.js`);
  const compiledExtensionCSS = path.join(outDirectory, `${settings.nameId}.css`);

  const appPath = path.resolve(glob.sync('./src/*(app.ts|app.tsx|app.js|app.jsx)')[0]);
  const tempFolder = path.join(__dirname,`../temp/`);
  const indexPath = path.join(tempFolder,`index.jsx`);
  
  if (!fs.existsSync(tempFolder))
    fs.mkdirSync(tempFolder)
  fs.writeFileSync(indexPath, `
import main from \'${appPath.replace(/\\/g, "/")}\'

(async () => {
  await main()
})();
  `.trim())

  esbuild.build({
    entryPoints: [indexPath],
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

    console.log("Bundling css and js...");
    if (fs.existsSync(compiledExtensionCSS)) {
      const css = fs.readFileSync(compiledExtensionCSS, "utf-8");
      fs.rmSync(compiledExtensionCSS);
      fs.appendFileSync(compiledExtension, `
  
  (async () => {
    if (!document.getElementById(\`${esbuildOptions.globalName}\`)) {
      var el = document.createElement('style');
      el.id = \`${esbuildOptions.globalName}\`;
      el.textContent = (String.raw\`
  ${css}
      \`).trim();
      document.head.appendChild(el);
    }
  })()
  
      `.trim());
    }

    console.log(colors.green('Build succeeded.'));
  }
}