import fs from 'fs-extra';
import spawn from 'cross-spawn'

interface IAnswers {
  type: 'Extension' | 'Custom App',
  displayName: string,
  nameId: string,
  generateExample: boolean
}

const questions = [
  {
    type: 'list',
    name: 'type',
    message: `What's your app's type?`,
    choices: ['Extension', 'Custom App'],
  },
  {
    type: 'input',
    name: `displayName`,
    message: `What's the name of your app?`,
    default: 'My App',
    when(answers: IAnswers) {
      return answers.type === "Custom App"
    },
  },
  {
    type: 'input',
    name: `nameId`,
    message: `What's the name id of your app?`,
    default: 'my-app',
    async validate(value: string) {
      if (value.match(
        /^[a-z,\-,_]*[a-z,_]$/
      )) {
        if (await fs.stat(value).then(() => false).catch(() => true)) {
          return true;
        } else {
          return "A folder with this name already exists.";
        }
      } else {
        return "Please enter a valid name id";
      }
    },
  },
  {
    type: 'confirm',
    name: 'generateExample',
    message: 'Do you want to generate an example?',
    default: true,
  },
];

export { IAnswers }
export default questions