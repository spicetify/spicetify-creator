interface CustomAppSettings {
  displayName: string;
  nameId: string;
  icon?: string;
  activeIcon?: string;
};

interface ExtensionSettings {
  nameId: string;
};

interface CustomAppManifest {
  "name": string;
  "icon": string;
  "active-icon": string;
  "subfiles": string[];
  "subfiles_extension": string[];
};
