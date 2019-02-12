import fs from 'fs';
import https from 'https';
import path from 'path';
import { RESOURCES_PATH, SPELLING_DICTIONARIES_PATH, SUPPORTED_LANGUAGES_PATH, DICTIONARY_CACHE_TIME } from '../constants';

// Use a known existing commit to dictionaries in case something bad happens to master
const DICTIONARIES_COMMIT_HASH = '2de863c';

export default class DictionaryManager {

    static async getSupportedLanguages() {

        return new Promise((resolve, reject) => {
            if ((!fs.existsSync(RESOURCES_PATH)) || (!fs.existsSync(SPELLING_DICTIONARIES_PATH))) {
                reject(null); // Folders where files go don't exist so bail
            }

            if (fs.existsSync(SUPPORTED_LANGUAGES_PATH)) {
                const fileInfo = fs.statSync(SUPPORTED_LANGUAGES_PATH);
                const fileModifiedTime = parseInt(fileInfo.mtimeMs, 10);
                const nowTime = new Date().getTime();
                if (DICTIONARY_CACHE_TIME > Math.abs(nowTime - fileModifiedTime)) {
                    // Supported languages file has not reached max cache time yet (30 days), so use it
                    try {
                        const supportedLanguagesJsonParsed = JSON.parse(fs.readFileSync(SUPPORTED_LANGUAGES_PATH));
                        resolve(supportedLanguagesJsonParsed);
                        return;
                    }
                    catch (err) {
                        // JSON is corrupt, delete and try to download again
                        fs.unlinkSync(SUPPORTED_LANGUAGES_PATH);
                    }
                }
            }

            // Adapted from: https://stackoverflow.com/questions/35697058/download-and-store-files-inside-electron-app

            const requestOptions = {
                host: 'api.github.com',
                port: 443,
                path: `/repos/wooorm/dictionaries/contents/dictionaries?ref=${DICTIONARIES_COMMIT_HASH}`,
                method: 'GET',
                headers: {
                    'User-Agent': 'chrisknepper/android-messages-desktop'
                }
            };

            https.get(requestOptions, (response) => {
                if (response.statusCode === 200 || response.statusCode === 302) {
                    // Only create the local file if it exists on Github
                    let supportedLanguagesJsonFile = fs.createWriteStream(SUPPORTED_LANGUAGES_PATH);
                    response.pipe(supportedLanguagesJsonFile);

                    supportedLanguagesJsonFile.on('error', (err) => {
                        fs.unlinkSync(SUPPORTED_LANGUAGES_PATH);
                        reject(null); // File write error
                    });
                    supportedLanguagesJsonFile.on('finish', (finished) => {
                        try {
                            const supportedLanguagesJsonParsed = JSON.parse(fs.readFileSync(SUPPORTED_LANGUAGES_PATH));
                            resolve(supportedLanguagesJsonParsed);
                        }
                        catch (error) {
                            reject(null); // The file just downloaded isn't parse-able as JSON
                        }
                    });
                } else {
                    reject(null);
                }
            }).on('error', (error) => {
                reject(null); // Request for JSON failed (likely either Github down or API error)
            });
        });
    }

    static doesLanguageExistForLocale(userLanguage, supportedLocales) {
        if (!userLanguage) {
            return null;
        }
        /*
         * It is possible for Electron to return a locale code for which there are multiple
         * "close match" dictionaries but no exact match. For these special cases, we
         * hardcode which dictionary should be used here.
         */
        const specialLanguageCases = {
            // For a system returning just generic "English", load the Queen's English because its spellings
            // are more common anywhere outside of USA, where en-US should always be returned.
            en: 'en-GB',
            /*
             * Electron returns "hy" for any dialect of Armenian but there are only dictionaries for Eastern
             * Armenian and Western Armenian--no generic "Armenian." According to Wikipedia, Eastern Armenian
             * is more widely spoken and acts as a superset of Western Armenian. Since there is no other
             * reliable way to tell which dialect a user would prefer, we use Eastern Armenian because of the
             * larger number of speakers of that language.
             */
            hy: 'hy-arevela'
        };

        let downloadDictionaryKey = null;

        // Every locale code for which a dictionary exists, as an array
        const listOfSupportedLanguages = supportedLocales.map((folder) => {
            if (folder.type === 'dir') {
                return folder.name
            }
        });

        if (listOfSupportedLanguages.includes(userLanguage)) { // language has an exact match and is supported
            downloadDictionaryKey = userLanguage;
        } else if (userLanguage in specialLanguageCases) { // language is a special case and is supported
            downloadDictionaryKey = specialLanguageCases[userLanguage];
        } else { // language may be supported, we'll try to find the closest match available (i.e. another dialect of the same language)
            const closestLanguageMatch = listOfSupportedLanguages.filter(
                (language) => language.substr(0, 2) === userLanguage.substr(0, 2)
            );
            if (closestLanguageMatch.length) {
                downloadDictionaryKey = closestLanguageMatch[0];
            }
            // else, there are no dictionaries available...womp womp
        }

        return downloadDictionaryKey;
    }

    static async getLanguagePath(userLanguage, localeKey) {
        return new Promise((resolve, reject) => {
            const localDictionaryFiles = {
                userLanguageAffFile: path.join(SPELLING_DICTIONARIES_PATH, `${userLanguage}.aff`),
                userLanguageDicFile: path.join(SPELLING_DICTIONARIES_PATH, `${userLanguage}.dic`)
            };

            // TODO: Similar time-based cache busting for the dictionary files themselves as we do for supported languages file
            if (fs.existsSync(localDictionaryFiles.userLanguageAffFile) && fs.existsSync(localDictionaryFiles.userLanguageDicFile)) {
                resolve(localDictionaryFiles);
            } else {
                if (localeKey) {
                    // Try to download the dictionary files for a language

                    const downloadState = {
                        affFile: false,
                        dicFile: false
                    };

                    const dictBaseUrl = `https://raw.githubusercontent.com/wooorm/dictionaries/${DICTIONARIES_COMMIT_HASH}/dictionaries/${localeKey}/index`

                    
                    https.get(`${dictBaseUrl}.aff`, (response) => {
                        if (response.statusCode === 200 || response.statusCode === 302) {
                            let affFile = fs.createWriteStream(localDictionaryFiles.userLanguageAffFile);
                            response.pipe(affFile);

                            affFile.on('error', (err) => {
                                reject(null);  // File write error
                            });
                            affFile.on('finish', (finished) => {
                                downloadState.affFile = true;

                                (downloadState.affFile && downloadState.dicFile) && resolve(localDictionaryFiles);
                            });
                        }
                    }).on('error', (error) => {
                        reject(null); // File download error (Github down or file doesn't exist)
                    });

                    https.get(`${dictBaseUrl}.dic`, (response) => {
                        if (response.statusCode === 200 || response.statusCode === 302) {
                            let dicFile = fs.createWriteStream(localDictionaryFiles.userLanguageDicFile);
                            response.pipe(dicFile);

                            dicFile.on('error', (err) => {
                                reject(null);  // File write error
                            });
                            dicFile.on('finish', (finished) => {
                                downloadState.dicFile = true;

                                (downloadState.affFile && downloadState.dicFile) && resolve(localDictionaryFiles);
                            });
                        }
                    }).on('error', (error) => {
                        reject(null); // File download error (Github down or file doesn't exist)
                    });
                }
            }
        });
    }

}
