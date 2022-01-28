import glob from 'glob'
import fs from 'fs'
import path from 'path'

function partition(array: any[], isValid: (e: any) => boolean): [any[], any[]] {
  return array.reduce(([pass, fail], elem) => {
    return isValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]];
  }, [[], []]);
}

/*
  Extracts all files in a directory to the parent directory
*/
function extractFiles(directory: string, subdirectories: boolean, mainDirectory?: string) {
  if (!mainDirectory) {
    mainDirectory = directory
  }

  const [inDirs, inFiles] = partition(glob.sync(path.join(directory, "*")), d => fs.lstatSync(d).isDirectory());
  if (subdirectories) {
    inDirs.forEach(dir => {
      extractFiles(dir, true, mainDirectory);
    });
  }
  
  inFiles.forEach(file => {
    fs.copyFileSync(file, path.join(mainDirectory!, path.basename(file)));
  });

  inDirs.forEach(dir => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
}

export default extractFiles;