"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const glob_1 = __importDefault(require("glob"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function partition(array, isValid) {
    return array.reduce(([pass, fail], elem) => {
        return isValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]];
    }, [[], []]);
}
/*
  Extracts all files in a directory to the parent directory
*/
function extractFiles(directory, subdirectories, mainDirectory) {
    if (!mainDirectory) {
        mainDirectory = directory;
    }
    const [inDirs, inFiles] = partition(glob_1.default.sync(path_1.default.join(directory, "*")), d => fs_1.default.lstatSync(d).isDirectory());
    if (subdirectories) {
        inDirs.forEach(dir => {
            extractFiles(dir, true, mainDirectory);
        });
    }
    inFiles.forEach(file => {
        fs_1.default.copyFileSync(file, path_1.default.join(mainDirectory, path_1.default.basename(file)));
    });
    inDirs.forEach(dir => {
        fs_1.default.rmSync(dir, { recursive: true, force: true });
    });
}
exports.default = extractFiles;
