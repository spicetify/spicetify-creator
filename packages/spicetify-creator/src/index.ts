#!/usr/bin/env node

import minimist from "minimist";
import { build } from "./scripts.js";

const argv = minimist(process.argv.slice(2));

build(
  argv["watch"] || argv["w"],
  argv["minify"] || argv["m"],
  argv["out"] || argv["o"],
  argv["in"] || argv["i"],
);
