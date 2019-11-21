const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: 'com.knepper.android-messages-desktop',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.ANDROID_MESSAGES_APPLE_ID_EMAIL,
    appleIdPassword: process.env.ANDROID_MESSAGES_APPLE_ID_APP_PASSWORD,
  });
};
