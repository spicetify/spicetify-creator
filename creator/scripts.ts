import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { ICustomAppSettings, IExtensionSettings } from './helpers/models'
import generateId from './helpers/generateId'
import buildCustomApp from './helpers/buildCustomApp'
import buildExtension from './helpers/buildExtension'
const postCssPlugin = require("esbuild-plugin-postcss2");
const autoprefixer = require("autoprefixer");

const exec = promisify(require('child_process').exec);

const build = async (watch: boolean, outDirectory?: string) => {
  const id = generateId(12)
  const settings: ICustomAppSettings & IExtensionSettings = JSON.parse(fs.readFileSync('./settings.json', 'utf-8'));
  const spicetifyDirectory = await exec("spicetify -c").then((o: any) => path.dirname(o.stdout.trim()));
  const isExtension = !Object.keys(settings).includes("icon");
  
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
