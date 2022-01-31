"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const glob_1 = __importDefault(require("glob"));
const safe_1 = __importDefault(require("colors/safe"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const esbuild = require("esbuild");
const postCssPlugin = require("esbuild-plugin-postcss2");
const autoprefixer = require("autoprefixer");
exports.default = async (settings, outDirectory, watch, esbuildOptions) => {
    // const extension = path.join("./src/", "app.tsx")
    // const extensionName = path.basename(extension.substring(0, extension.lastIndexOf(".")));
    const compiledExtension = path_1.default.join(outDirectory, `${settings.nameId}.js`);
    const compiledExtensionCSS = path_1.default.join(outDirectory, `${settings.nameId}.css`);
    const appPath = path_1.default.resolve(glob_1.default.sync('./src/*(app.ts|app.tsx|app.js|app.jsx)')[0]);
    const tempFolder = path_1.default.join(__dirname, `../temp/`);
    const indexPath = path_1.default.join(tempFolder, `index.jsx`);
    if (!fs_1.default.existsSync(tempFolder))
        fs_1.default.mkdirSync(tempFolder);
    fs_1.default.writeFileSync(indexPath, `
import main from \'${appPath.replace(/\\/g, "/")}\'

(async () => {
  await main()
})();
  `.trim());
    esbuild.build(Object.assign(Object.assign({ entryPoints: [indexPath], outfile: compiledExtension }, esbuildOptions), { watch: (watch ? {
            async onRebuild(error, result) {
                if (error)
                    console.error(error);
                else {
                    await afterBundle();
                }
            },
        } : undefined) })).then(async (r) => {
        await afterBundle();
        return r;
    });
    const afterBundle = async () => {
        console.log("Adding react and react-dom...");
        const data = fs_1.default.readFileSync(compiledExtension, 'utf-8').split("\n");
        const appendAbove = data.findIndex((l) => l.includes(`if (typeof require !== "undefined")`));
        if (appendAbove !== -1) {
            data.splice(appendAbove, 0, `if (x === "react") return Spicetify.React;`);
            data.splice(appendAbove + 1, 0, `if (x === "react-dom") return Spicetify.ReactDOM;`);
            fs_1.default.writeFileSync(compiledExtension, data.join("\n") + "\n");
        }
        console.log("Bundling css and js...");
        if (fs_1.default.existsSync(compiledExtensionCSS)) {
            const css = fs_1.default.readFileSync(compiledExtensionCSS, "utf-8");
            fs_1.default.rmSync(compiledExtensionCSS);
            fs_1.default.appendFileSync(compiledExtension, `
  
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
        console.log(safe_1.default.green('Build succeeded.'));
    };
};
