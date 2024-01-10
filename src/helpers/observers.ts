import { ipcRenderer } from "electron";
import { RECENT_CONVERSATION_TRAY_COUNT } from "./constants";
import { Conversation } from "./trayManager";

function unreadObserver() {
  if (document.querySelector(".unread") != null) {
    ipcRenderer.send("set-unread-status", true);
  } else {
    ipcRenderer.send("set-unread-status", false);
  }
}

export function createUnreadObserver(): MutationObserver {
  const observer = new MutationObserver(unreadObserver);
  observer.observe(
    document.body.querySelector("mws-conversations-list") as unknown as Element,
    {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-e2e-is-unread"],
    }
  );
  return observer;
}

export const focusFunctions = new Array(RECENT_CONVERSATION_TRAY_COUNT)
  .fill(0)
  .map(() => () => void 1);

export function recentThreadObserver() {
  const conversations = Array.from(
    document.body.querySelectorAll("mws-conversation-list-item")
  ).slice(0, RECENT_CONVERSATION_TRAY_COUNT);

  const data: Conversation[] = conversations.map((conversation, i) => {
    const name = conversation.querySelector(
      "a div.text-content h3.name span"
    )?.textContent;
    const canvas = conversation.querySelector(
      "a div.avatar-container canvas"
    ) as HTMLCanvasElement | null;

    const image = canvas?.toDataURL();

    const recentMessage = conversation.querySelector(
      "a div.text-content div.snippet-text mws-conversation-snippet span"
    )?.textContent;

    const focusFunction = () => void conversation.querySelector("a")?.click();
    focusFunctions[i] = focusFunction;

    return { name, image, recentMessage, i };
  });
  ipcRenderer.send("set-recent-conversations", data);
}

export function createRecentThreadObserver(): MutationObserver {
  const observer = new MutationObserver(recentThreadObserver);
  observer.observe(
    document.body.querySelector("mws-conversations-list") as unknown as Element,
    {
      attributes: false,
      subtree: true,
      childList: true,
    }
  );
  return observer;
}
