interface CustomAppSettings {
  displayName: string | Record<string, string>;
  nameId: string;
  icon?: string;
  activeIcon?: string;
};

interface ExtensionSettings {
  nameId: string;
};

interface CustomAppManifest {
  "name": string | Record<string, string>;
  "icon": string;
  "active-icon": string;
  "subfiles": string[];
  "subfiles_extension": string[];
};
