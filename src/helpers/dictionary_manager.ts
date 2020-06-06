import * as path from "path";
import * as fsJetpack from "fs-jetpack";
import { SPELLING_DICTIONARIES_PATH, RESOURCES_PATH } from "../constants";
import fetch from "node-fetch";

interface GithubEntry {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: string;
}

async function getSupportedLanguages(): Promise<GithubEntry[]> {
  const fileData = (await fsJetpack.readAsync(
    path.resolve(RESOURCES_PATH, "supportedLanguages.json")
  )) as string;
  return JSON.parse(fileData);
}

async function getLanguageObject(locale: string): Promise<GithubEntry> {
  /*
   * It is possible for Electron to return a locale code for which there are multiple
   * "close match" dictionaries but no exact match. For these special cases, we
   * hardcode which dictionary should be used here.
   *
   *  For a system returning just generic "English", load the Queen's English because its spellings
   * are more common anywhere outside of USA, where en-US should always be returned.
   *
   * Electron returns "hy" for any dialect of Armenian but there are only dictionaries for Eastern
   * Armenian and Western Armenian--no generic "Armenian." According to Wikipedia, Eastern Armenian
   * is more widely spoken and acts as a superset of Western Armenian. Since there is no other
   * reliable way to tell which dialect a user would prefer, we use Eastern Armenian because of the
   * larger number of speakers of that language.
   */

  if (locale === "en-US") {
    locale = "en";
  } else if (locale === "de-DE") {
    locale = "de";
  }

  let language: GithubEntry;

  // Every locale code for which a dictionary exists, as an array
  const supportedLanguages = (await getSupportedLanguages()).filter(
    (language) => language.type === "dir"
  );
  const names = supportedLanguages.map((language) => language.name);
  if (names.includes(locale)) {
    language = supportedLanguages[names.indexOf(locale)];
  } else {
    // language may be supported, we'll try to find the closest match available (i.e. another dialect of the same language)
    const indexOfClosestMatch = names
      .map((language) => language.substr(0, 2))
      .indexOf(locale.substr(0, 2));
    if (indexOfClosestMatch) {
      language = supportedLanguages[indexOfClosestMatch];
    } else {
      throw new Error("Locale not supported");
    }
  }
  return language;
}

export interface Dictionary {
  aff: string;
  dic: string;
}

export async function getDictionary(locale: string): Promise<Dictionary> {
  const language = await getLanguageObject(locale);
  const dirPath = path.resolve(SPELLING_DICTIONARIES_PATH(), language.name);
  const fileRoot = path.resolve(dirPath, "index");

  // creates dir
  const langDir = await fsJetpack.dirAsync(dirPath);
  // if both files dont exist
  const contents = await langDir.listAsync();

  if (
    !contents?.includes(fileRoot + ".aff") ||
    !contents?.includes(fileRoot + ".dic")
  ) {
    const downloadEntries = (await (
      await fetch(language.url)
    ).json()) as GithubEntry[];
    const downloads = downloadEntries.filter((download) =>
      ["aff", "dic"].includes(download.name.split(".")[1])
    );
    await Promise.all(
      downloads.map(async (download) => {
        if (download.download_url) {
          const content = await (await fetch(download.download_url)).text();
          return await fsJetpack.writeAsync(
            fileRoot + "." + download.name.split(".")[1],
            content
          );
        } else {
          throw new Error("Download not found");
        }
      })
    );
  }
  return {
    aff: fileRoot + ".aff",
    dic: fileRoot + ".dic",
  };
}
