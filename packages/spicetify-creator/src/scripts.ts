import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { ICustomAppSettings, IExtensionSettings } from './helpers/models'
import buildCustomApp from './buildCustomApp'
import buildExtension from './buildExtension'
const postCssPlugin = require("esbuild-plugin-postcss2");
const autoprefixer = require("autoprefixer");

const exec = promisify(require('child_process').exec);

const build = async (watch: boolean, minify: boolean, outDirectory?: string) => {
  const settings: ICustomAppSettings & IExtensionSettings = JSON.parse(fs.readFileSync("./src/settings.json", 'utf-8'));
  const spicetifyDirectory = await exec("spicetify -c").then((o: any) => path.dirname(o.stdout.trim()));
  const isExtension = !Object.keys(settings).includes("icon");
  const id = settings.nameId.replace(/\-/g, 'D');
  
  if (isExtension) {
    console.log("Extension detected");
  } else {
    console.log("Custom App detected");
  }

  if (!outDirectory) {
    if (isExtension) {
      outDirectory = path.join(spicetifyDirectory, "Extensions");
    } else {
      outDirectory = path.join(spicetifyDirectory, "CustomApps", settings.nameId);
    }
  }

  // Create outDirectory if it doesn't exists
  if (!fs.existsSync(outDirectory)){
    fs.mkdirSync(outDirectory);
  }

  const esbuildOptions = {
    platform: 'browser',
    external: ['react', 'react-dom'],
    minify: minify,
    bundle: true,
    globalName: id,
    plugins: [
      postCssPlugin.default({
        plugins: [autoprefixer],
        modules: {
          generateScopedName: `[name]__[local]___[hash:base64:5]${id}`
        },
      }),
    ],
  }

  if (isExtension) {
    buildExtension(settings, outDirectory, watch, esbuildOptions);
  } else {
    buildCustomApp(settings, outDirectory, watch, esbuildOptions);
  }
  

  if (watch) {
    console.log('Watching...');
  }
};

export { build };
