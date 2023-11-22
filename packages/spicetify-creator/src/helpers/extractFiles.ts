import { globSync } from "glob";
import { lstatSync, copyFileSync, rmSync } from "fs";
import { join, basename } from "path";

function partition(array: any[], isValid: (e: any) => boolean): [any[], any[]] {
  return array.reduce(
    ([pass, fail], element) => {
      return isValid(element) ? [[...pass, element], fail] : [pass, [...fail, element]];
    },
    [[], []],
  );
}

function extractFiles(directory: string, subdirectories: boolean, mainDirectory?: string) {
  if (!mainDirectory) {
    mainDirectory = directory;
  }

  const [inDirectories, inFiles] = partition(globSync(join(directory, "*")), (directory) =>
    lstatSync(directory).isDirectory(),
  );
  if (subdirectories) {
    inDirectories.forEach((directory) => {
      extractFiles(directory, true, mainDirectory);
    });
  }

  inFiles.forEach((file) => {
    copyFileSync(file, join(mainDirectory!, basename(file)));
  });

  inDirectories.forEach((directory) => {
    rmSync(directory, { recursive: true, force: true });
  });
}

export default extractFiles;
