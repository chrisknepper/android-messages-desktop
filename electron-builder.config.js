export default {
  appId: "pw.kmr.amd",
  artifactName: "${productName}-v${version}-${os}-${arch}.${ext}",
  productName: "Android Messages",
  copyright: "Copyright 2026 OrangeDrangon",
  files: ["app/**/*", "resources/**/*"],
  directories: {
    buildResources: "resources",
    output: "dist",
  },
  publish: [
    {
      provider: "github",
      releaseType: "draft",
    },
  ],
  linux: {
    target: ["AppImage", "deb", "pacman", "rpm", "freebsd", "zip"],
    executableName: "AndroidMessages",
    category: "Network",
    desktop: {
      entry: {
        Name: "Android Messages Desktop",
      },
    },
  },
  win: {
    target: ["nsis", "portable", "zip"],
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
