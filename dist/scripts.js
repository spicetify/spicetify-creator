"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const generateId_1 = __importDefault(require("./helpers/generateId"));
const buildCustomApp_1 = __importDefault(require("./helpers/buildCustomApp"));
const buildExtension_1 = __importDefault(require("./helpers/buildExtension"));
const postCssPlugin = require("esbuild-plugin-postcss2");
const autoprefixer = require("autoprefixer");
const exec = (0, util_1.promisify)(require('child_process').exec);
// const appRoot = require('app-root-path').path;
const appRoot = "D:\\SpotifyExtensions\\spicetify-creator-test\\";
const build = async (watch, outDirectory) => {
    const id = (0, generateId_1.default)(12);
    const settings = JSON.parse(fs_1.default.readFileSync(path_1.default.join(appRoot, "src/settings.json"), 'utf-8'));
    const spicetifyDirectory = await exec("spicetify -c").then((o) => path_1.default.dirname(o.stdout.trim()));
    const isExtension = !Object.keys(settings).includes("icon");
    if (isExtension) {
        console.log("Extension detected");
    }
    else {
        console.log("Custom App detected");
    }
    if (!outDirectory) {
        if (isExtension) {
            outDirectory = path_1.default.join(spicetifyDirectory, "Extensions");
        }
        else {
            outDirectory = path_1.default.join(spicetifyDirectory, "CustomApps", settings.nameId);
        }
    }
    // Create outDirectory if it doesn't exists
    if (!fs_1.default.existsSync(outDirectory)) {
        fs_1.default.mkdirSync(outDirectory);
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
    };
    if (isExtension) {
        (0, buildExtension_1.default)(settings, outDirectory, watch, esbuildOptions);
    }
    else {
        (0, buildCustomApp_1.default)(settings, outDirectory, watch, esbuildOptions);
    }
    if (watch) {
        console.log('Watching...');
    }
};
exports.build = build;
