import { build } from "./scripts";
const argv = require('minimist')(process.argv.slice(2));

build(argv['watch'] || argv['w'], argv['out'] || argv['o'])
