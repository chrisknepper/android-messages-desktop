import fs from 'fs';
import https from 'https';
import path from 'path';
import { SPELLING_DICTIONARIES_PATH, SUPPORTED_LANGUAGES_PATH, DICTIONARY_CACHE_TIME } from '../constants';

export default class DictionaryManager {

    static async getSupportedLanguages() {

        return new Promise((resolve, reject) => {
            if (!fs.existsSync(SPELLING_DICTIONARIES_PATH)) {
                fs.mkdirSync(SPELLING_DICTIONARIES_PATH);
            }

            if (fs.existsSync(SUPPORTED_LANGUAGES_PATH)) {
                const fileInfo = fs.statSync(SUPPORTED_LANGUAGES_PATH);
                const fileModifiedTime = parseInt(stats.mtimeMs, 10);
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
                path: '/repos/wooorm/dictionaries/contents/dictionaries',
                method: 'GET',
                headers: {
                    'User-Agent': 'Android Messages Desktop App'
                }
            };

            https.get(requestOptions, (response) => {
                if (response.statusCode === 200 || response.statusCode === 302) {
                    // Only create the local file if it exists on Github
                    let supportedLanguagesJsonFile = fs.createWriteStream(SUPPORTED_LANGUAGES_PATH);
                    response.pipe(supportedLanguagesJsonFile);

                    supportedLanguagesJsonFile.on('error', (err) => {
                        fs.unlinkSync(SUPPORTED_LANGUAGES_PATH);
                        reject(null);
                    });
                    supportedLanguagesJsonFile.on('finish', (finished) => {
                        resolve(JSON.parse(fs.readFileSync(SUPPORTED_LANGUAGES_PATH)));
                    });
                } else {
                    reject(null);
                }
            });
        });
    }

    static doesLanguageExistForLocale(userLanguage, supportedLocales) {
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
                userLanguageAffFile: path.join(SPELLING_DICTIONARIES_PATH, `${userLanguage}-user.aff`),
                userLanguageDicFile: path.join(SPELLING_DICTIONARIES_PATH, `${userLanguage}-user.dic`)
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

                    const dictBaseUrl = `https://raw.githubusercontent.com/wooorm/dictionaries/master/dictionaries/${localeKey}/index`

                    
                    https.get(`${dictBaseUrl}.aff`, (response) => {
                        if (response.statusCode === 200 || response.statusCode === 302) {
                            let affFile = fs.createWriteStream(localDictionaryFiles.userLanguageAffFile);
                            response.pipe(affFile);

                            affFile.on('error', (err) => {
                                console.log('aff error downloading', err);
                                reject(null);
                            });
                            affFile.on('finish', (finished) => {
                                console.log('aff finished downloading', finished, 'dic is', downloadState.dicFile);
                                downloadState.affFile = true;

                                (downloadState.affFile && downloadState.dicFile) && resolve(localDictionaryFiles);
                            });
                        }
                    });

                    https.get(`${dictBaseUrl}.dic`, (response) => {
                        if (response.statusCode === 200 || response.statusCode === 302) {
                            let dicFile = fs.createWriteStream(localDictionaryFiles.userLanguageDicFile);
                            response.pipe(dicFile);

                            dicFile.on('error', (err) => {
                                console.log('dic error downloading', err);
                                reject(null);
                            });
                            dicFile.on('finish', (finished) => {
                                console.log('dic finished downloading', finished, 'aff is', downloadState.affFile);
                                downloadState.dicFile = true;

                                (downloadState.affFile && downloadState.dicFile) && resolve(localDictionaryFiles);
                            });
                        }
                    });
                }
            }
        });
    }

}
