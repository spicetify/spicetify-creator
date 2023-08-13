#!/usr/bin/env node

import { build } from "./scripts";
const argv = require('minimist')(process.argv.slice(2));

build(argv['watch'] || argv['w'], argv['minify'] || argv['m'], argv['out'] || argv['o'], argv['in'] || argv['i'])
