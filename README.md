# Android Messages™ Desktop

Run Android Messages as a desktop app, a la iMessage. For those of us that prefer not to have a browser tab always open for this sort of thing.

### Disclaimer: I have not tested this at all because Google has still not made the web messages feature available to me.

Inspired by:

* [Google Play Music Desktop Player](https://github.com/MarshallOfSound/Google-Play-Music-Desktop-Player-UNOFFICIAL-)
* [a Reddit post on r/Android](https://www.reddit.com/r/Android/comments/8shv6q/web_messages/e106a8r/)

Based on:

* [electron-boilerplate](https://github.com/szwacz/electron-boilerplate)

# Download
Head over to the [releases](https://github.com/chrisknepper/android-messages-desktop/releases) page!

**Important note:** I don't have signing certificates yet. It can still run on both Windows and macOS, but the [process to get it running on macOS](https://www.macworld.com/article/3094865/macs/how-to-run-apps-that-are-not-from-the-app-store-in-macos-sierra.html) is cumbersome. I'm working on getting certificates now.

**Important note 2:** We currently have builds for Windows and macOS. I'd love to be able to do Linux releases, but I have little knowledge of Linux packaging.

# TODOs / Roadmap (rough order of priority):
- [ ] Make sure it actually works
- [ ] Release signed binaries for macOS
- [ ] Make an icon
- [ ] Remove left-over code from electron-boilerplate
- [ ] Correct tests
- [ ] Release signed binaries for Windows
- [ ] Release packages for Linux
- [ ] Platform-specific UX enhancements (i.e. badges in macOS dock)
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
