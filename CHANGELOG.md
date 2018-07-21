# Changelog

## [0.6.0] - 2018-07-20
### Added
- Visual indicator (badge) to Windows tray icon when notification comes in
- Link to package for this app on AUR (for Arch Linux users)

### Changed
- Clicking notification now makes app visible and focused
- Under the hood: Method of displaying notification (with our bridge/ipc)
- Update README.md

### Fixed
- Linux now respects your choice when asking to restart the app
- Typos in README.md corrected

## [0.5.0] - 2018-07-17
### Added
- Setting to start in tray (automatically hide app on start)
- Setting to make tray/menu bar functionality optional
- Preferences on Mac

### Changed
- Default to enabling tray only on Windows and Mac
- Refine window minimizing and closing UX further:
    - On Windows and Linux, closing window when tray icon is disabled now closes the app entirely
    - On Windows and Linux, when the tray icon is disabled, the option to start in tray is disabled
- Make certain UI language more platform-specific
- KNOWN ISSUE: Toggling the tray from on to off while using Linux requires an app restart for now
- Refactor some tray code into a new class to manage it, TrayManager

### Fixed
- Mac tray (menu bar) icon now inverts correctly when selected or Finder is in dark mode

## [0.4.0] - 2018-07-14
### Added
- Right-click context menu with support for cut/copy/paste/undo/redo/save image/save video
- Builds for pacman package manager (used by Arch Linux and related distros)
- Changelog (with shortcut to changelog in Help menu)

### Changed
- Update README.md
- On launch, open dev tools for the webview when in dev mode

### Fixed
- App icon not showing or showing sporadically on Linux

### Removed
- Some dead code/comments

## [0.3.0] - 2018-07-08
### Added
- Tray icon support for macOS and Linux
- Show/hide toggle to tray context menu
- File menu with items to manually check for updates and quit the app
- Standard Window menu provided by electron (with proper minimize/hide items and keyboard shortcuts)
- One-time notification about minimizing to tray on Windows
- Build scripts to only build instead of building and attempting to publish a release

### Changed
- Minimize/close behavior on Windows and Linux (minimizing now minimizes, closing now minimizes to tray)
- Refactor menu code

### Fixed
- Command+H app hiding behavior on macOS (now defocuses app when hiding window)

## [0.2.0] - 2018-07-05
### Added
- Setting to auto-hide menu bar (and toggle its appearance via the standard Alt+H shortcut) on Windows and Linux
- electron-settings dependency for managing the above and future user settings
- Screenshots of Windows tray and macOS dock functionality

### Changed
- Update README.md

### Removed
- "Hello World" code and unit/e2e tests from boilerplate

## [0.1.0] - 2018-06-27
### Added
- Notification count badge in dock on macOS (clears on window focus/app.activate)
- Tray icon and minimizing to tray for Windows
- Command+H shortcut to hide app on macOS

### Changed
- Closing window on macOS now doesn't quit app (expected UX on macOS)
- Prevent multiple instances of app being able to launch (for example, when minimized to tray on Windows without pinning to taskbar, then clicking a shortcut from the Start menu)
- Update README.md

## [0.0.5] - 2018-06-26
### Changed
- Update README.md
- Update shape of chat bubble in icon
- Use different combination of scripts to generate icons

### Fixed
- Corrupt icons in Windows Taskbar and macOS Spotlight

## [0.0.4] - 2018-06-24
### Changed
- README.md even more complete

### Fixed
- Hyperlinks in text messages now open in system default browser when clicked

## [0.0.3] - 2018-06-22
### Changed
- Nothing besides the version number, just created this version to test auto-update functionality

## [0.0.2] - 2018-06-22
### Added
- Signed app binary for macOS
- Notifications on Windows
- Builds for various Linux distros/package managers
- A real icon
- Auto-update mechanism via electron-updater
- TODOs

### Changed
- README.md more complete
- package.json more complete
- Values and code elements from boilerplate updates
- Automatically pop-up dev tools in dev mode
- Generate icons via a script

## 0.0.1 - 2018-06-21
### Added
- Project files (initial release)

### Changed
- It works! (I think hope)
- No Linux binary, no signing certs for Mac/Windows, no actual icon...but it's a start.
