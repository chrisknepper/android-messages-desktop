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
    artifactName: "${productName}-${version}-${arch}.${ext}",
    target: [
      {
        target: "nsis",
        arch: ["x64", "ia32"],
      },
      {
        target: "portable",
        arch: ["x64", "ia32"],
      },
    ],
  },
  mac: {
    category: "public.app-category.social-networking",
    target: ["zip", "dmg"],
  },
  portable: {
    artifactName: "${productName}-portable-${version}-${arch}.${ext}",
  },
  snap: {
    publish: ["github"],
  },
};
