import appIcon from '../../../resources/icons/512x512.png';
import { IS_DEV } from '../../constants';
import openAboutWindow from 'about-window';

export const aboutMenu = () => {
    openAboutWindow({
        icon_path: appIcon,
        copyright: 'Copyright © 2018 Chris Knepper, All rights reserved.',
        product_name: 'Android Messages Desktop',
        open_devtools: IS_DEV
    });
};
