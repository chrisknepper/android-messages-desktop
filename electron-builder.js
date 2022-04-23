module.exports = {
  appId: "pw.kmr.amd",
  artifactName: "${productName}-v${version}-${os}-${arch}.${ext}",
  productName: "Android Messages",
  copyright: "Copyright 2020 Kyle Rosenberg",
  files: ["app/**/*", "resources/**/*"],
  directories: {
    buildResources: "resources",
    output: "dist",
  },
  linux: {
    target: ["AppImage", "snap", "deb", "pacman", "rpm", "freebsd", "zip"],
    executableName: "AndroidMessages",
    category: "Internet",
    desktop: {
      StartupWMClass: "android-messages-desktop",
    },
  },
  win: {
    target: ["nsis", "portable"],
  },
  mac: {
    category: "public.app-category.social-networking",
    target: { target: "default", arch: "universal" },
  },
  portable: {
    artifactName: "${productName}-v${version}-${os}-${arch}.portable.${ext}",
  },
  nsis: {
    allowToChangeInstallationDirectory: true,
    oneClick: false,
  },
};
