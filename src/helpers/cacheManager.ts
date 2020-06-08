import domtoimg from "dom-to-image";
import jetpack from "fs-jetpack";
import path from "path";

type CachedImage = string | undefined | (() => Promise<void>);

export class CacheManager {
  private imgCache: Map<string, string> = new Map();
  constructor(
    private basePath: string,
    private diskCache: Map<string, string>
  ) {}
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
   * @returns {(HTMLImageElement | undefined)} the img tag of the node
   */
  private getImgNodeIfExists(
    profileNode: HTMLElement
  ): HTMLImageElement | undefined {
    return profileNode.querySelector("img") || undefined;
  }

  /**
   *
   * Checks if there is a disk cache of the rendered img at the cache key provided and gets it.
   *
   * @param {string} cacheKey cache index to check
   * @returns {(string | undefined)} the contents of the cache
   */
  private getDiskCacheIfExists(cacheKey: string): string | undefined {
    const cachePath = this.diskCache.get(cacheKey);
    if (cachePath != null && jetpack.file(cachePath)) {
      return jetpack.read(cachePath);
    }
    return undefined;
  }

  /**
   *
   * Finds the node to render to generate an img on the provided profile node returned from the getProfileNodeIfEvists private.
   *
   * @param {HTMLElement} profileNode the node to traverse the children of
   * @returns {(HTMLDivElement | undefined)} node to generate image of
   */
  private getNodeToRenderIfExists(
    profileNode: HTMLElement
  ): HTMLDivElement | undefined {
    return (
      profileNode.querySelector<HTMLDivElement>("div.non-image-avatar") ||
      undefined
    );
  }

  /**
   *
   * Creates the private that will async render and save / cache the node
   *
   * @param {HTMLElement} nodeToRender node to render
   * @param {string} cacheKey name in caches
   * @returns {() => Promise<void>} private that will do the rendering
   */
  private createNodeRenderer(
    nodeToRender: HTMLElement,
    cacheKey: string
  ): () => Promise<void> {
    return async () => {
      const rendered = await domtoimg.toPng(nodeToRender);
      const cachePath = path.join(this.basePath, `${cacheKey}.txt`);
      await jetpack.writeAsync(cachePath, rendered);

      this.imgCache.set(cacheKey, rendered);
    };
  }

  public getProfileImg(title: string): CachedImage {
    const cacheKey = this.getCacheKey(title);
    if (this.imgCache.has(cacheKey)) {
      return this.imgCache.get(cacheKey);
    }
    const profileNode = this.getProfileNodeIfExists(cacheKey);
    if (profileNode != null) {
      const imgTag = this.getImgNodeIfExists(profileNode);
      if (imgTag != null) {
        this.imgCache.set(cacheKey, imgTag.src);
        return imgTag.src;
      }
      const diskCache = this.getDiskCacheIfExists(cacheKey);
      if (diskCache != null) {
        this.imgCache.set(cacheKey, diskCache);
        return diskCache;
      }
      const nodeToRender = this.getNodeToRenderIfExists(profileNode);
      if (nodeToRender != null) {
        return this.createNodeRenderer(nodeToRender, cacheKey);
      }
    }
    return undefined;
  }
}
