// Things relating to changing the way user input affect the app page go here

// We need to block all of these if we're disabling send on enter
const KEYBOARD_EVENTS: ["keyup", "keypress", "keydown"] = [
  "keyup",
  "keypress",
  "keydown",
];

// Effectively private methods

// For whatever reason, this won't work if defined as a static method of InputManager
function blockEnterKeyEvent(event: KeyboardEvent) {
  if (event.keyCode === 13) {
    event.stopPropagation();
  }
}

export function handleEnterPrefToggle(enabled: boolean): void {
  for (const event of KEYBOARD_EVENTS) {
    if (!enabled) {
      window.addEventListener(event, blockEnterKeyEvent);
    }
  }
}
