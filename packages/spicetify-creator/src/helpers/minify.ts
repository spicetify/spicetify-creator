import glob from 'glob';
import path from 'path'
import fs from 'fs'
import UglifyJS from 'uglify-js';
import CleanCSS from 'clean-css';

const cleanCSS = new CleanCSS();

const minifyJS = async (code: string) => {
  return UglifyJS.minify(code).code
}

const minifyCSS = async (code: string) => {
  return cleanCSS.minify(code).styles;
}

const minifyFile = async (file: string) => {
  const ext = path.extname(file);
  const content = fs.readFileSync(file).toString();
  let minifiedContent: string;

  if (ext === ".js") {
    minifiedContent = await minifyJS(content);
  } else if (ext === ".css") {
    minifiedContent = await minifyCSS(content);
  } else {
    throw new Error("File extension not supported");
  }

  fs.writeFileSync(file, minifiedContent);
}
  
const minifyFolder = async (directory: string) => {
  const jsFiles = glob.sync(path.join(directory, "/*(*.js)"), {absolute: true});

  for (const jsFile of jsFiles) {
    fs.writeFileSync(jsFile, await minifyJS(fs.readFileSync(jsFile).toString()));
  }
  
  const cssFiles = glob.sync(path.join(directory, "/*(*.css)"), {absolute: true});

  for (const cssFile of cssFiles) {
    fs.writeFileSync(cssFile, await minifyCSS(fs.readFileSync(cssFile).toString()));
  }
}

export { minifyFolder, minifyJS, minifyCSS, minifyFile };
