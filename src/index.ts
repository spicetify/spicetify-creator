#!/usr/bin/env node

import path from "path";
import { build } from "./scripts";
const argv = require('minimist')(process.argv.slice(2));

// const appRoot = require('app-root-path').path;
const appRoot = "D:\\SpotifyExtensions\\spicetify-creator-test\\"
// const app = require(path.join(appRoot, 'src/app.tsx'))

console.log(path.resolve('.'))

build(argv['watch'] || argv['w'], argv['out'] || argv['o'])

// const settings = require('./src/settings.json');

// console.log("Building! " + settings.nameId);