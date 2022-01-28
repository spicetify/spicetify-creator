import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import glob from 'glob'
import colors from 'colors/safe'
import packageConfig from '../package.json'
import { ICustomAppManifest, INewManifest } from './models/manifests'
const esbuild = require("esbuild")
const postCssPlugin = require("esbuild-plugin-postcss2");
const autoprefixer = require("autoprefixer");

const exec = promisify(require('child_process').exec);

const build = async (watch: boolean, inOutDirectory?: string) => {
  const spicetifyDirectory = await exec("spicetify -c").then((o: any) => path.dirname(o.stdout.trim()));
  const outDirectory = inOutDirectory ? inOutDirectory : path.join(spicetifyDirectory, "CustomApps", packageConfig.name);
  const extensions = await glob.sync("./src/extensions/*(*.ts|*.tsx|*.js|*.jsx)");
  const extensionsNewNames = extensions.map(e => e.substring(0, e.lastIndexOf(".")) + ".js");
  const id = makeId(12)

  // Create the out directory if doesn't exists
  if (!fs.existsSync(outDirectory)){
    fs.mkdirSync(outDirectory);
  }
  
  esbuild.build({
    entryPoints: [`./index.tsx`, ...extensions],
    outdir: outDirectory,
    platform: 'browser',
    external: ['react', 'react-dom'],
    bundle: true,
    globalName: id,
    plugins: [
      postCssPlugin.default({
        plugins: [autoprefixer],
        modules: {
          generateScopedName: `[name]__[local]___[hash:base64:5]${id}`
        }
      }),
    ],
    watch: (watch ? {
      async onRebuild(error: any, result: any) {
        if (error)
          console.error(error)
        else {
          await afterBundle();
        }
      },
    } : undefined)
  }).then(async (r: any) => {
    await afterBundle();
    return r;
  })

  if (watch) {
    console.log('Watching...');
  }

  async function afterBundle() {
    // Generate the manifest.json
    console.log("Generating manifest.json...")
    const newManifest = <INewManifest>JSON.parse(fs.readFileSync("./manifest.json", 'utf-8'))
    const customAppManifest = <ICustomAppManifest>{
      name: newManifest.name,
      icon: fs.readFileSync(path.join('./src', newManifest.icon), 'utf-8'),
      "active-icon": fs.readFileSync(path.join('./src', newManifest.activeIcon), 'utf-8'),
      subfiles: [],
      subfiles_extension: extensionsNewNames.map(e => path.basename(e))
    }
    fs.writeFileSync(path.join(outDirectory, "manifest.json"), JSON.stringify(customAppManifest, null, 2))

    console.log("Moving extensions...")
    extensionsNewNames.forEach(extension => {
      fs.copyFileSync(path.join(outDirectory, extension), path.join(outDirectory, path.basename(extension)))
    });
    
    fs.rmSync(path.join(outDirectory, "src"), { recursive: true, force: true });
    
    console.log("Adding react and react-dom...")
    const jsFiles = await glob.sync(path.join(outDirectory, "/*(*.ts|*.tsx|*.js|*.jsx)"));
    jsFiles.forEach(jsFile => {
      const data = fs.readFileSync(jsFile, 'utf-8').split("\n");
      const appendAbove = data.findIndex((l) => l.includes(`if (typeof require !== "undefined")`))
      if (appendAbove !== -1) {
        data.splice(appendAbove, 0,        `if (x === "react") return Spicetify.React;`);
        data.splice(appendAbove + 1, 0,    `if (x === "react-dom") return Spicetify.ReactDOM;`);
        fs.writeFileSync(jsFile, data.join("\n")+"\n");
      }
    })

    console.log("Modifying index.js...")
    fs.appendFileSync(path.join(outDirectory, "index.js"), `const render=()=>${id}.default();\n`);

    console.log("Renaming index.css...")
    if (fs.existsSync(path.join(outDirectory, "index.css")))
      fs.renameSync(path.join(outDirectory, "index.css"), path.join(outDirectory, "style.css"))
    
    console.log(colors.green('Build succeeded.'));
  }
};

const addApp = async () => {
  await exec(`spicetify config custom_apps ${packageConfig.name}`);
  await exec(`spicetify apply`);
};

function makeId(length: number) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
 }
 return result;
}

export { build, addApp };
