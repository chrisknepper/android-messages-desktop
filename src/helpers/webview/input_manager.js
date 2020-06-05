// Things relating to changing the way user input affect the app page go here

// We need to block all of these if we're disabling send on enter
const KEYBOARD_EVENTS = ["keyup", "keypress", "keydown"];

// Effectively private methods

// For whatever reason, this won't work if defined as a static method of InputManager
const blockEnterKeyEvent = (event) => {
  if (event.keyCode === 13) {
    event.stopPropagation();
  }
};

export default class InputManager {
  static handleEnterPrefToggle(enabled) {
    const addOrRemoveEventListener = enabled
      ? window.removeEventListener
      : window.addEventListener;

    for (let ev of KEYBOARD_EVENTS) {
      addOrRemoveEventListener(ev, blockEnterKeyEvent, true);
    }
  }
}
