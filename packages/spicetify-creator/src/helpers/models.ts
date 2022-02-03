export interface ICustomAppSettings {
  displayName: string,
  nameId: string,
  icon?: string,
  activeIcon?: string,
};

export interface IExtensionSettings {
  nameId: string,
};

// The manifest every custom app should have
export interface ICustomAppManifest {
  "name": string,
  "icon": string,
  "active-icon": string,
  "subfiles": string[],
  "subfiles_extension": string[],
};
