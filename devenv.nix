{ pkgs, lib, config, inputs, ... }:

{
  packages = [
    pkgs.git
    pkgs.nixd
    pkgs.electron_41
    pkgs.p7zip
  ];

  languages.nix.enable = true;

  languages.javascript.enable = true;
  languages.javascript.pnpm.enable = true;
  languages.javascript.pnpm.install.enable = true;

  git-hooks.hooks = {
    prettier.enable = true;
    eslint.enable = true;
    eslint.settings.binPath = "./node_modules/.bin/eslint";
  };

  env.ELECTRON_OVERRIDE_DIST_PATH = "${pkgs.electron_41}/bin/";
  env.ELECTRON_BUILDER_7ZIP_PATH = "${pkgs.p7zip}/bin/7za";
}
