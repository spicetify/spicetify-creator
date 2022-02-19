import glob from 'glob';
import path from 'path'
import fs from 'fs'
import UglifyJS from 'uglify-js';
import CleanCSS from 'clean-css';

const cleanCSS = new CleanCSS();

const minifyJS = async (code: string) => {
  return await UglifyJS.minify(code).code
}

const minifyCSS = async (code: string) => {
  return cleanCSS.minify(code).styles;
}

const minifyFolder = async (directory: string) => {

  const jsFiles = await glob.sync(path.join(directory, "/*(*.js)"), {absolute: true});

  for (const jsFile of jsFiles) {
    fs.writeFileSync(jsFile, await minifyJS(fs.readFileSync(jsFile).toString()));
  }
  
  const cssFiles = await glob.sync(path.join(directory, "/*(*.css)"), {absolute: true});

  for (const cssFile of cssFiles) {
    fs.writeFileSync(cssFile, await minifyCSS(fs.readFileSync(cssFile).toString()));
  }
}

export { minifyFolder, minifyJS, minifyCSS };