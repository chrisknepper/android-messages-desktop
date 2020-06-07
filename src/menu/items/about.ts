import openAboutWindow from "about-window";
import { app, MenuItemConstructorOptions } from "electron";
import path from "path";
import { IS_DEV, RESOURCES_PATH } from "../../helpers/constants";

const productName = "Android Messages Desktop";
const localeStyle =
  "-webkit-app-region: no-drag; position: absolute; left: 0.5em; bottom: 0.5em; font-size: 12px; color: #999";
const disclaimerText =
  "<br><br>Not affiliated with Google in any way.<br>Android is a trademark of Google LLC.";
const licenseText = `<br><br>${productName} is released under the MIT License.`;
const dictionaryLicenseText = `<br><br>Spelling dictionaries are released under various licenses including MIT, BSD, and GNU GPL. <a class="link" href="https://github.com/wooorm/dictionaries#table-of-dictionaries" style="text-decoration: none">See dictionary license details</a>.`;

let languageCode = "";
let descriptionWithLocale = "";
app.on("ready", () => {
  languageCode = app.getLocale();
  // about-window does not have a field for arbitrary HTML, so we add the HTML we need to an existing field
  descriptionWithLocale = `Messages for web, as a desktop app<span style="${localeStyle}">${languageCode}</span>`;
});

export const aboutMenuItem: MenuItemConstructorOptions = {
  label: `About ${productName}`,
  click: () => {
    openAboutWindow({
      // TODO: Make this not sketchy as hell
      icon_path: path.resolve(RESOURCES_PATH, "icons", "512x512.png"),
      copyright: `<div style="text-align: center">Copyright (c) 2020 Kyle Rosenberg${disclaimerText}${licenseText}${dictionaryLicenseText}</div>`,
      product_name: productName,
      description: descriptionWithLocale,
      open_devtools: IS_DEV,
      use_inner_html: true,
      win_options: {
        height: 500,
        resizable: false,
        minimizable: false,
        maximizable: false,
        show: false, // Delays showing until content is ready, prevents FOUC/flash of blank white window
      },
    });
  },
};
