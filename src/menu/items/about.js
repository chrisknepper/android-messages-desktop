import appIcon from '../../../resources/icons/512x512.png';
import { IS_DEV } from '../../constants';
import openAboutWindow from 'about-window';
import { app } from 'electron';
import { description } from '../../../package.json';

let languageCode = '';
let descriptionWithLocale = '';
const localeStyle = '-webkit-app-region: no-drag; position: absolute; left: 0.5em; bottom: 0.5em; font-size: 12px; color: #999';
const disclaimerText = '<br><br>Not affiliated with Google in any way.<br>Android is a trademark of Google LLC.'; 
app.on('ready', () => {
    languageCode = app.getLocale();
    // about-window does not have a field for arbitrary HTML, so we add the HTML we need to an existing field
    descriptionWithLocale = `${description}<span style="${localeStyle}">${languageCode}</span>`;
});

export const aboutMenuItem = {
    label: 'About Android Messages Desktop',
    click: () => {
        openAboutWindow({
            icon_path: appIcon,
            copyright: `<div style="text-align: center">Copyright © 2018-2019 Chris Knepper, All rights reserved.${disclaimerText}</div>`,
            product_name: 'Android Messages Desktop',
            description: descriptionWithLocale,
            open_devtools: IS_DEV,
            use_inner_html: true,
            adjust_window_size: true
        });
    }
};
