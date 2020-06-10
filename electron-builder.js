module.exports = {
  appId: "pw.electron.android-messages",
  artifactName: "${productName}-${version}.${ext}",
  productName: "AndroidMessages",
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
  },
  win: {
    target: ["nsis", "portable"],
  },
  mac: {
    category: "public.app-category.social-networking",
    target: ["zip", "dmg"],
  },
  portable: {
    artifactName: "${productName}-portable-${version}.${ext}",
  },
  snap: {
    publish: ["github"],
  },
};
