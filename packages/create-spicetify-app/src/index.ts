#!/usr/bin/env node

import inquirer from "inquirer";
import fs from "fs-extra";
import https from "https";
import path from "path";
import spawn from "cross-spawn";
import questions, { IAnswers } from "./quiz";
import chalk from "chalk";

inquirer.prompt(questions).then(async (answers: IAnswers) => {
  try {
    const packageManager =
      (process.env.npm_config_user_agent || "").indexOf("yarn") === 0
        ? "yarn"
        : "npm";
    const projectDir = path.join(".", answers.nameId);
    const devDependencies = [
      "@types/react",
      "@types/react-dom",
      "spicetify-creator",
    ].sort();

    await fs.mkdir(projectDir);
    await fs.mkdir(path.join(projectDir, "src"));
    await fs.mkdir(path.join(projectDir, "src/types"));
    await fs.writeFile(
      path.join(projectDir, "package.json"),
      generatePackageJson(answers.nameId)
    );
    await fs.writeFile(
      path.join(projectDir, "tsconfig.json"),
      generateTSConfig()
    );
    await fs.writeFile(
      path.join(projectDir, ".gitattributes"),
      "dist/* linguist-vendored"
    );
    await fs.copy(
      path.join(__dirname, "../template/gitignore"),
      path.join(projectDir, ".gitignore")
    );
    await fs.copy(
      path.join(__dirname, "../template/css-modules.d.ts"),
      path.join(projectDir, "src/types/css-modules.d.ts")
    );

    if (answers.generateExample) {
      await fs.copy(
        path.join(
          __dirname,
          "../template",
          answers.type === "Extension" ? "extension" : "customapp"
        ),
        path.join(projectDir, "src")
      );
    }

    await fs.writeFile(
      path.join(projectDir, "src/settings.json"),
      generateSettings(answers)
    );

    await new Promise<void>((resolve) =>
      https.get(
        "https://raw.githubusercontent.com/spicetify/spicetify-creator/main/README.md",
        (res) => {
          res.pipe(fs.createWriteStream(path.join(projectDir, "README.md")));
          resolve();
        }
      )
    );

    await new Promise<void>((resolve) =>
      https.get(
        "https://raw.githubusercontent.com/khanhas/spicetify-cli/master/globals.d.ts",
        (res) => {
          res.pipe(
            fs.createWriteStream(
              path.join(projectDir, "src/types/spicetify.d.ts")
            )
          );
          resolve();
        }
      )
    );

    const error = spawn.sync(
      `cd ${projectDir} && ${packageManager} ${
        packageManager === "yarn" ? "add" : "install"
      } -D ${devDependencies.join(" ")}`,
      { stdio: "inherit", shell: true }
    ).error;
    if (error) throw "Couldn't install dependencies: " + error.message;

    console.log(
      `\n\n${chalk.green(
        "Success:"
      )} A Spicetify Creator project has been created`
    );
  } catch (err) {
    console.error(`\n\n${chalk.red("Error, something went wrong:")}`, err);
  }
});

function generatePackageJson(name: string) {
  return JSON.stringify(
    {
      name: name,
      version: "0.1.0",
      private: true,
      scripts: {
        build: "spicetify-creator",
        "build-local": "spicetify-creator --out=dist --minify",
        watch: "spicetify-creator --watch",
      },
      license: "MIT",
    },
    null,
    2
  );
}

function generateTSConfig() {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2017",
        jsx: "react",
        module: "commonjs",
        resolveJsonModule: true,
        outDir: "dist",
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        strict: true,
        skipLibCheck: true,
      },
      include: ["./src/**/*.*"],
    },
    null,
    2
  );
}

function generateSettings(answers: IAnswers) {
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
