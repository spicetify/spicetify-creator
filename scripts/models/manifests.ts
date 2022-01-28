// The manifest for this project
export interface INewManifest {
  "name": string,
  "icon": string,
  "activeIcon": string,
}

// The manifest every custom app should have
export interface ICustomAppManifest {
  "name": string,
  "icon": string,
  "active-icon": string,
  "subfiles": string[],
  "subfiles_extension": string[],
}