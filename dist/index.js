#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const scripts_1 = require("./scripts");
const argv = require('minimist')(process.argv.slice(2));
// const appRoot = require('app-root-path').path;
const appRoot = "D:\\SpotifyExtensions\\spicetify-creator-test\\";
// const app = require(path.join(appRoot, 'src/app.tsx'))
console.log(path_1.default.resolve('.'));
(0, scripts_1.build)(argv['watch'] || argv['w'], argv['out'] || argv['o']);
// const settings = require('./src/settings.json');
// console.log("Building! " + settings.nameId);
