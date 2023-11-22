#!/usr/bin/env node

import { writeFileSync, mkdirSync, createWriteStream, copyFileSync, cpSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { get } from "https";

import { execa } from "execa";
import inquirer from "inquirer";
import chalk from "chalk";

import questions, { Answers } from "./quiz.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

inquirer.prompt(questions).then(async (answers: Answers) => {
  try {
    const userAgent = process.env.npm_config_user_agent || "";
    const packageManager = userAgent.startsWith("yarn")
      ? "yarn"
      : userAgent.startsWith("pnpm")
        ? "pnpm"
        : "npm";

    const projectDir = join(".", answers.nameId);
    const devDependencies = [
      "@types/react@17.0.2",
      "@types/react-dom@17.0.2",
      "react-query-types",
      "typescript",
      "spicetify-creator",
    ].sort();

    mkdirSync(projectDir);
    mkdirSync(join(projectDir, "src"));
    mkdirSync(join(projectDir, "src/types"));
    writeFileSync(join(projectDir, "package.json"), generatePackageJson(answers.nameId));
    writeFileSync(join(projectDir, "tsconfig.json"), generateTSConfig());
    writeFileSync(join(projectDir, ".gitattributes"), "dist linguist-vendored");
    copyFileSync(join(__dirname, "../template/gitignore"), join(projectDir, ".gitignore"));
    copyFileSync(
      join(__dirname, "../template/css-modules.d.ts"),
      join(projectDir, "src/types/css-modules.d.ts"),
    );

    if (answers.generateExample) {
      cpSync(
        join(__dirname, "../template", answers.type.toLowerCase().replaceAll(" ", "")),
        join(projectDir, "src"),
        { recursive: true },
      );
    }

    writeFileSync(join(projectDir, "src/settings.json"), generateSettings(answers));

    await new Promise<void>((resolve) =>
      get("https://raw.githubusercontent.com/spicetify/spicetify-creator/main/README.md", (res) => {
        res.pipe(createWriteStream(join(projectDir, "README.md")));
        resolve();
      }),
    );

    await new Promise<void>((resolve) =>
      get(
        "https://raw.githubusercontent.com/spicetify/spicetify-cli/master/globals.d.ts",
        (res) => {
          res.pipe(createWriteStream(join(projectDir, "src/types/spicetify.d.ts")));
          resolve();
        },
      ),
    );

    const command = packageManager === "yarn" ? "add" : "install";
    const cmd = `${packageManager} ${command} -D ${devDependencies.join(" ")}`;
    const result = await execa(cmd, {
      cwd: projectDir,
      stdio: "inherit",
      shell: true,
    });
    if (result.exitCode !== 0) {
      throw new Error(`Couldn't install dependencies: ${result.stderr}`);
    }

    console.log(`\n\n${chalk.green("Success:")} A Spicetify Creator project has been created`);
  } catch (error) {
    console.error(`\n\n${chalk.red("Error, something went wrong:")}`, error);
  }
});

function generatePackageJson(name: string) {
  return JSON.stringify(
    {
      name: name,
      version: "0.1.0",
      private: true,
      scripts: {
        "build": "spicetify-creator --in=./src --out=./dist --minify",
        "build:local": "spicetify-creator",
        "watch": "spicetify-creator --watch",
        "update:spicetify-types":
          "curl -s -o ./src/types/spicetify.d.ts https://raw.githubusercontent.com/spicetify/spicetify-cli/master/globals.d.ts",
      },
    },
    null,
    2,
  );
}

function generateTSConfig() {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "ES2022",
        moduleResolution: "bundler",
        jsx: "react",
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        lib: ["ES2022", "DOM"],
        paths: {
          "react-query": ["./node_modules/react-query-types"],
        },
      },
      include: ["./src/**/*"],
    },
    null,
    2,
  );
}

function generateSettings(answers: Answers) {
  let settings;
  if (answers.type === "Extension") {
    settings = {
      nameId: answers.nameId,
    };
  } else {
    settings = {
      displayName: answers.displayName,
      nameId: answers.nameId,
      ...(answers.generateExample
        ? {
            icon: "css/icon.svg",
            activeIcon: "css/icon.svg",
          }
        : {}),
    };
  }

  return JSON.stringify(settings, null, 2);
}
