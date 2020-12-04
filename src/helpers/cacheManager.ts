type CachedImage = string | undefined;

export class CacheManager {
  private imgCache: Map<string, string> = new Map();
  /**
   *
   * Attempts to split the title of the notification in a way that yeilds a cache hit
   * The character it splits at is hard coded and relient on google not changing it
   * I do not know a way around this for now so it will stay
   *
   * @param {string} title notification title to convert to cache key
   * @returns {string} cache key for indexing
   */
  private getCacheKey(title: string): string {
    if (title.includes(" •")) {
      return title.split(" •")[0];
    }
    return title;
  }

  /**
   *
   * Get the node of the listing for the message in the message list from the provided name.
   * It only finds the first match so multiple people named exactly the same will yeild the Node on occasion.
   *
   * @param {string} name name of conversation to search for
   * @returns {(HTMLElement | undefined)} the node for a conversation matching the name
   */
  private getProfileNodeIfExists(name: string): HTMLElement | undefined {
    const nodes = Array.from(document.querySelectorAll("h3.name"));
    const firstMatch = nodes.find((header) => header.textContent === name);
    return firstMatch?.parentElement?.parentElement || undefined;
  }

  /**
   *
   * Looks for the existence of an image on the provided profile node returned from the getProfileNodeIfEvists private.
   *
   * @param {HTMLElement} profileNode the node to traverse the children of
   * @returns {(HTMLCanvasElement | undefined)} the img tag of the node
   */
  private getCanvasNodeIfExists(
    profileNode: HTMLElement
  ): HTMLCanvasElement | undefined {
    return profileNode.querySelector("canvas") || undefined;
  }

  /**
   *
   * First checks cache. If it is not in the cache trys to get the canvas node and turn it into a data:url
   * I am not sure the cache is necessary anymore but there are rumors that canvas.toDataUrl is slow.
   *
   * @param title title of the notification as passed to the window.Notification
   */
  public getProfileImg(title: string): CachedImage {
    const cacheKey = this.getCacheKey(title);
    if (this.imgCache.has(cacheKey)) {
      return this.imgCache.get(cacheKey);
    }
    const profileNode = this.getProfileNodeIfExists(cacheKey);
    if (profileNode != null) {
      const canvasTag = this.getCanvasNodeIfExists(profileNode);
      if (canvasTag != null) {
        this.imgCache.set(cacheKey, canvasTag.toDataURL());
        return canvasTag.toDataURL();
      }
    }
    return undefined;
  }
}
