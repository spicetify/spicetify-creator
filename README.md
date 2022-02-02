# Spicetify Creator
STILL NEEDS TO BE TESTED

Easily make Spicetify extensions and custom apps.

## Features
- Typescript/Javascript support
- React syntax
- Node modules
- CSS/SCSS global and modules (PostCSS)
- Improved Custom App's structure 
- [Plugins](/Plugins.md)
- Under 1 second compile time with esbuild
- Save & reload (Save and the changes will appear in Spotify)

## Getting started

### Creating
```
npx create-spicetify-app OR yarn create spicetify-app
cd my-app
spicetify config extensions my-app.js OR spicetify config custom_apps my-app
```
### Building
```
npm run build OR yarn run build
spicetify apply
```
### Watching
```
spicetify watch -le OR spicetify watch -la
npm run watch OR yarn run watch
```

### Structure
- All your code should be inside the `src` folder.  

#### Custom Apps
- The default component exported from `src/app.tsx` will be displayed as your Custom App.  
- Each file in the `src/extensions` folder is an extension of its own.  
- `src/settings.json`'s structure:
```json
{
  "displayName": "My App",
  "nameId": "my-app",
  "icon": "css/icon.svg",  
  "activeIcon": "css/icon.svg"  
}
```
#### Extensions
- The default function exported from `src/app.tsx` is the main function of the extension and runs with Spotify.
- `src/settings.json`'s structure:
```json
{
  "nameId": "my-app"
}
```
