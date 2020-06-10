# Android Messages™ Desktop

Run Android Messages as a desktop app, a la iMessage. For those of us that prefer not to have a browser tab always open for this sort of thing.

**Not affiliated with Google in any way. Android is a trademark of Google LLC.**

| Platform  | Status                                          |
|-----------|-------------------------------------------------|
| Windows   | ![Windows Build Status](https://dev.azure.com/Drangon/android-messages-desktop/_apis/build/status/OrangeDrangon.android-messages-desktop?branchName=master&jobName=Job&configuration=Job%20windows) |
| Mac       | ![Mac Build Status](https://dev.azure.com/Drangon/android-messages-desktop/_apis/build/status/OrangeDrangon.android-messages-desktop?branchName=master&jobName=Job&configuration=Job%20mac)     |
| Linux     | ![Linux Build Status](https://dev.azure.com/Drangon/android-messages-desktop/_apis/build/status/OrangeDrangon.android-messages-desktop?branchName=master&jobName=Job&configuration=Job%20linux)   |

Inspired by:

* [Google Play Music Desktop Player](https://github.com/MarshallOfSound/Google-Play-Music-Desktop-Player-UNOFFICIAL-)
* [a Reddit post on r/Android](https://www.reddit.com/r/Android/comments/8shv6q/web_messages/e106a8r/)

# Download
Head over to the [latest releases](https://github.com/OrangeDrangon/android-messages-desktop/releases/latest) page!

**Important Note 1:** We currently have builds for Windows and macOS, and Linux. I test releases on Arch Linux. I would love help testing in additional places.

**Important Note 2:** Neither the MacOS nor the Windows binaries are signed right now. I am willing to add this but I do not have the certificates required at this time.

# Spellchecking
Implemented via the amazing [`electron-hunspell`](https://github.com/kwonoj/electron-hunspell) library with dictionaries provided by the excellent [`dictionaries`](https://github.com/wooorm/dictionaries) project. Language files are downloaded when the app opens and the language used is based on the language set in your operating system. If you switch your system language and restart the app, the spellchecking should occur in the new language as long as it is in the [list of supported languages](https://github.com/wooorm/dictionaries#table-of-dictionaries).
