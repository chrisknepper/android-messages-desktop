import fs from 'fs';
import https from 'https';
import path from 'path';
import { SPELLING_DICTIONARIES_PATH, SUPPORTED_LANGUAGES_PATH, DICTIONARY_CACHE_TIME } from '../constants';
import { maybeGetValidJson, isObject } from './utilities';

// Use a known existing commit to dictionaries in case something bad happens to master
const DICTIONARIES_COMMIT_HASH = '2de863c';

export default class DictionaryManager {

    static isFileExpired(filePath) {
        const fileInfo = fs.statSync(filePath);
        const fileModifiedTime = parseInt(fileInfo.mtimeMs, 10);
        const nowTime = new Date().getTime();
        const millisecondsSinceFileUpdated = Math.abs(nowTime - fileModifiedTime);
        return millisecondsSinceFileUpdated >= DICTIONARY_CACHE_TIME;
    }

    static async getSupportedLanguages() {

        return new Promise((resolve, reject) => {
            if (!fs.existsSync(SPELLING_DICTIONARIES_PATH())) {
                reject(null); // Folders where files go don't exist so bail
                return;
            }

            if (fs.existsSync(SUPPORTED_LANGUAGES_PATH())) {
                if (!DictionaryManager.isFileExpired(SUPPORTED_LANGUAGES_PATH())) {
                    // Supported languages file has not reached max cache time yet (30 days), so try to use it
                    const jsonStringFromFile = fs.readFileSync(SUPPORTED_LANGUAGES_PATH());
                    const supportedLanguagesJsonParsed = maybeGetValidJson(jsonStringFromFile);
                    if (isObject(supportedLanguagesJsonParsed) && Array.isArray(supportedLanguagesJsonParsed)) {
                        resolve(supportedLanguagesJsonParsed);
                        return;
                    }
                }

                // If this point is reached, the file exists but isn't valid JSON, so this function will continue
                // (and try to download it again)
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
                    let supportedLanguagesJsonFile = fs.createWriteStream(SUPPORTED_LANGUAGES_PATH());
                    response.pipe(supportedLanguagesJsonFile);

                    supportedLanguagesJsonFile.on('error', (err) => {
                        // something went wrong with the download and we may or may not have part of the file
                        // let's set it to empty since calling unlink is hit or miss for non-root Linux users
                        if (fs.existsSync((SUPPORTED_LANGUAGES_PATH()))) {
                            fs.writeFileSync((SUPPORTED_LANGUAGES_PATH()), '');
                        }
                        reject(null); // File write error
                        return;
                    });
                    supportedLanguagesJsonFile.on('finish', (finished) => {
                        const jsonStringFromFile = fs.readFileSync(SUPPORTED_LANGUAGES_PATH());
                        const supportedLanguagesJsonParsed = maybeGetValidJson(jsonStringFromFile);
                        if (isObject(supportedLanguagesJsonParsed) && Array.isArray(supportedLanguagesJsonParsed)) {
                            resolve(supportedLanguagesJsonParsed);
                        }
                    });
                } else {
                    reject(null);
                    return;
                }
            }).on('error', (error) => {
                reject(null); // Request for JSON failed (likely either Github down or API error)
            });
        });
    }

    static doesLanguageExistForLocale(userLanguage, supportedLocales) {
        if ((!userLanguage) || (!Array.isArray(supportedLocales))) {
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
                userLanguageAffFile: path.join(SPELLING_DICTIONARIES_PATH(), `${userLanguage}.aff`),
                userLanguageDicFile: path.join(SPELLING_DICTIONARIES_PATH(), `${userLanguage}.dic`)
            };

            const languageDictFilesExist = fs.existsSync(localDictionaryFiles.userLanguageAffFile) && fs.existsSync(localDictionaryFiles.userLanguageDicFile);
            const languageDictFilesTooOld = DictionaryManager.isFileExpired(localDictionaryFiles.userLanguageAffFile); // Only need to check one of the two
            if (languageDictFilesExist && !languageDictFilesTooOld) {
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
