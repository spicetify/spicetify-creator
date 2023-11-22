import { accessSync, constants } from "fs";

export type Answers = {
  type: "Extension" | "Custom App";
  displayName: string;
  nameId: string;
  generateExample: boolean;
};

const questions = [
  {
    type: "list",
    name: "type",
    message: "What's your app's type?",
    choices: ["Extension", "Custom App"],
  },
  {
    type: "input",
    name: "displayName",
    message: "What's the name of your app?",
    default: "My App",
    when(answers: Answers) {
      return answers.type === "Custom App";
    },
  },
  {
    type: "input",
    name: "nameId",
    message: "What's the name id of your app?",
    default: "my-app",
    validate(value: string) {
      if (value.match(/^[a-z,\-,_]*[a-z,_]$/)) {
        try {
          accessSync(value, constants.F_OK);
          return "A folder with this name already exists.";
        } catch {
          return true;
        }
      } else {
        return "Please enter a valid name id";
      }
    },
  },
  {
    type: "confirm",
    name: "generateExample",
    message: "Do you want to generate an example?",
    default: true,
  },
];

export default questions;
