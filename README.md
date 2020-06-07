# Android Messages™ Desktop <a href="#"><img src="resources/icons/48x48.png" alt="Android Messages Desktop logo" title="Android Messages Desktop logo" /></a> 

Run Android Messages as a desktop app, a la iMessage. For those of us that prefer not to have a browser tab always open for this sort of thing.

**Not affiliated with Google in any way. Android is a trademark of Google LLC.**

### Disclaimer: I have tested this with my Pixel on Arch only. There is a lot of platform specific code that I ported without being able to test if there are problems please report them.

Inspired by:

* [Google Play Music Desktop Player](https://github.com/MarshallOfSound/Google-Play-Music-Desktop-Player-UNOFFICIAL-)
* [a Reddit post on r/Android](https://www.reddit.com/r/Android/comments/8shv6q/web_messages/e106a8r/)

# Download
Head over to the [latest releases](https://github.com/chrisknepper/android-messages-desktop/releases/latest) page!

**Important note:** The Windows app binary isn't signed. This doesn't seem to be a big problem, but please report any issues you run into on Windows that may be related to signing.

**Important note 2:** We currently have builds for Windows and macOS, and Linux. I test releases on Arch Linux. I would love help testing in additional places.

# Spellchecking
Implemented via the amazing [`electron-hunspell`](https://github.com/kwonoj/electron-hunspell) library with dictionaries provided by the excellent [`dictionaries`](https://github.com/wooorm/dictionaries) project. Language files are downloaded when the app opens and the language used is based on the language set in your operating system. If you switch your system language and restart the app, the spellchecking should occur in the new language as long as it is in the [list of supported languages](https://github.com/wooorm/dictionaries#table-of-dictionaries).
