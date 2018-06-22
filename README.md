# Android Messages™ Desktop

Run Android Messages as a desktop app, a la iMessage. For those of us that prefer not to have a browser tab always open for this sort of thing.

### Disclaimer: I have not tested this at all because Google has still not made the web messages feature available to me.

Inspired by:

* [Google Play Music Desktop Player](https://github.com/MarshallOfSound/Google-Play-Music-Desktop-Player-UNOFFICIAL-)
* [a Reddit post on r/Android](https://www.reddit.com/r/Android/comments/8shv6q/web_messages/e106a8r/)

Based on:

* [electron-boilerplate](https://github.com/szwacz/electron-boilerplate)

# Download
Head over to the [latest releases](https://github.com/chrisknepper/android-messages-desktop/releases/latest) page!
* For Mac, choose the **dmg**
* For Windows, choose the **exe**
* For Linux, choose either the **deb**, the **snap**, or the **AppImage**

**Important note:** The Windows app binary isn't signed. This doesn't seem to be a big problem, but please report any issues you run into on Windows that may be related to signing.

**Important note 2:** We currently have builds for Windows and macOS, and Linux. I've only tested on macOS and Windows 10, and would love help testing on Linux and older versions of Windows.

test
[jlord/sheetsee.js@a5c3785ed8d6a35868bc169f07e40e889087fd2e](jlord/sheetsee.js@a5c3785ed8d6a35868bc169f07e40e889087fd2e)

# TODOs / Roadmap (rough order of priority):
- [ ] Make sure it actually works
- [x] Release signed binaries for macOS (binaries are signed as of v0.0.2, done via chrisknepper/android-messages-desktop@84920234d1f5cb668a944cb91fe1cc6faece8513 )
- [x] Make an icon (done via chrisknepper/android-messages-desktop@df625ba808df78ec6f3574144c27eabc322381f5 )
- [ ] Remove left-over code from electron-boilerplate
- [ ] Correct tests
- [x] Release packages for Linux (done via chrisknepper/android-messages-desktop@41ed2059f85784956ab6f4b9b4925b3e99bf4dcf )
- [x] Handling updates (done via chrisknepper/android-messages-desktop@625bf6d2d43904df99473c5bfb6ad9df945af080 )
- [ ] Platform-specific UX enhancements (i.e. badges in macOS dock)
- [ ] Release signed binaries for Windows
- [ ] Make a website? (if it gets popular enough)
- [ ] Support customization/custom options a la Google Play Music Desktop Player?

# Development
Make sure you have [Node.js](https://nodejs.org) installed, then run the following in your terminal:

```
git clone https://github.com/chrisknepper/android-messages-desktop.git
cd android-messages-desktop
npm install
npm start
```

## Starting the app in development mode
```
npm start
```

# Testing
Run all tests:
```
npm test
```

## Unit
```
npm run unit
```
Using [electron-mocha](https://github.com/jprichardson/electron-mocha) test runner with the [Chai](http://chaijs.com/api/assert/) assertion library. You can put your spec files wherever you want within the `src` directory, just name them with the `.spec.js` extension.

## End to end
```
npm run e2e
```
Using [Mocha](https://mochajs.org/) and [Spectron](http://electron.atom.io/spectron/). This task will run all files in `e2e` directory with `.e2e.js` extension.

# Making a release
To package your app into an installer use command:
```
npm run release
```

Once the packaging process finished, the `dist` directory will contain your distributable file.

We use [electron-builder](https://github.com/electron-userland/electron-builder) to handle the packaging process. It has a lot of [customization options](https://www.electron.build/configuration/configuration), which you can declare under `"build"` key in `package.json`.
