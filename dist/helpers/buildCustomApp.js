"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const glob_1 = __importDefault(require("glob"));
const safe_1 = __importDefault(require("colors/safe"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const extractFiles_1 = __importDefault(require("./extractFiles"));
const esbuild = require("esbuild");
exports.default = async (settings, outDirectory, watch, esbuildOptions) => {
    const extensions = glob_1.default.sync("./src/extensions/*(*.ts|*.tsx|*.js|*.jsx)");
    const extensionsNewNames = extensions.map(e => e.substring(0, e.lastIndexOf(".")) + ".js");
    console.log("Generating manifest.json...");
    const customAppManifest = {
        name: settings.displayName,
        icon: fs_1.default.readFileSync(path_1.default.join('./src', settings.icon), 'utf-8'),
        "active-icon": fs_1.default.readFileSync(path_1.default.join('./src', settings.activeIcon), 'utf-8'),
        subfiles: [],
        subfiles_extension: extensionsNewNames.map(e => path_1.default.basename(e))
    };
    fs_1.default.writeFileSync(path_1.default.join(outDirectory, "manifest.json"), JSON.stringify(customAppManifest, null, 2));
    const appPath = path_1.default.resolve(glob_1.default.sync('./src/*(app.ts|app.tsx|app.js|app.jsx)')[0]);
    const tempFolder = path_1.default.join(__dirname, `../temp/`);
    const indexPath = path_1.default.join(tempFolder, `index.jsx`);
    if (!fs_1.default.existsSync(tempFolder))
        fs_1.default.mkdirSync(tempFolder);
    fs_1.default.writeFileSync(indexPath, `
import App from \'${appPath.replace(/\\/g, "/")}\'
import React from 'react';

export default function render() {
  return <App />;
}
  `.trim());
    esbuild.build(Object.assign(Object.assign({ entryPoints: [indexPath, ...extensions], outdir: outDirectory }, esbuildOptions), { watch: (watch ? {
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
        console.log("Moving files out of folders...");
        (0, extractFiles_1.default)(outDirectory, true);
        console.log("Adding react and react-dom...");
        const jsFiles = await glob_1.default.sync(path_1.default.join(outDirectory, "/*(*.ts|*.tsx|*.js|*.jsx)"));
        jsFiles.forEach(jsFile => {
            const data = fs_1.default.readFileSync(jsFile, 'utf-8').split("\n");
            const appendAbove = data.findIndex((l) => l.includes(`if (typeof require !== "undefined")`));
            if (appendAbove !== -1) {
                data.splice(appendAbove, 0, `if (x === "react") return Spicetify.React;`);
                data.splice(appendAbove + 1, 0, `if (x === "react-dom") return Spicetify.ReactDOM;`);
                fs_1.default.writeFileSync(jsFile, data.join("\n") + "\n");
            }
        });
        console.log("Modifying index.js...");
        fs_1.default.appendFileSync(path_1.default.join(outDirectory, "index.js"), `const render=()=>${esbuildOptions.globalName}.default();\n`);
        console.log("Renaming index.css...");
        if (fs_1.default.existsSync(path_1.default.join(outDirectory, "index.css")))
            fs_1.default.renameSync(path_1.default.join(outDirectory, "index.css"), path_1.default.join(outDirectory, "style.css"));
        console.log(safe_1.default.green('Build succeeded.'));
    };
};
