#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scripts_1 = require("./scripts");
const argv = require('minimist')(process.argv.slice(2));
(0, scripts_1.build)(argv['watch'] || argv['w'], argv['minify'] || argv['m'], argv['out'] || argv['o']);
