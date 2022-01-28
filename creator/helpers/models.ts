export interface ICustomAppSettings {
  "displayName": string,
  "name": string,
  "icon": string,
  "activeIcon": string,
  "settings": [],
}

export interface IExtensionSettings {
  "displayName": string,
  "main": string,
  "settings": [],
}

export interface IExtensionMarketplaceManifest {
  
}

// The manifest every custom app should have
export interface ICustomAppManifest {
  "name": string,
  "icon": string,
  "active-icon": string,
  "subfiles": string[],
  "subfiles_extension": string[],
}