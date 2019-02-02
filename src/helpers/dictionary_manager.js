import fs from 'fs';
import https from 'https';
import path from 'path';
import { SPELLING_DICTIONARIES_PATH, SUPPORTED_LANGUAGES_PATH } from '../constants';
// import settings from 'electron-settings';

export default class DictionaryManager {

    static setupDictionaries() {

        if (!fs.existsSync(SPELLING_DICTIONARIES_PATH)) {
            fs.mkdirSync(SPELLING_DICTIONARIES_PATH);
        }

        if (!fs.existsSync(SUPPORTED_LANGUAGES_PATH)) {
            // Should check if we already have the dictionary for the current language before doing this
            // Adapted from: https://stackoverflow.com/questions/35697058/download-and-store-files-inside-electron-app

            let supportedLanguagesJsonFile = fs.createWriteStream(SUPPORTED_LANGUAGES_PATH);
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
                response.pipe(supportedLanguagesJsonFile);
            });

            supportedLanguagesJsonFile.on('error', (err) => {
                console.log('supported languages error downloading', err);
            });
            supportedLanguagesJsonFile.on('finish', (finished) => {
                console.log('supported languages finished downloading', finished);
                console.log('the download file as JSON', JSON.parse(fs.readFileSync(SUPPORTED_LANGUAGES_PATH)));
            });
        }

        //const userLanguage = state.currentLanguage;
        const userLanguage = 'en-US';
        const userLanguageAffFile = path.join(SPELLING_DICTIONARIES_PATH, `${userLanguage}-user.aff`);
        const userLanguageDicFile = path.join(SPELLING_DICTIONARIES_PATH, `${userLanguage}-user.dic`)

        if (!fs.existsSync(userLanguageAffFile) || !fs.existsSync(userLanguageDicFile)) {
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

            // Should check if we already have the dictionary for the current language before doing this
            // Adapted from: https://stackoverflow.com/questions/35697058/download-and-store-files-inside-electron-app
            const requestOptions = {
                host: 'api.github.com',
                port: 443,
                path: '/repos/wooorm/dictionaries/contents/dictionaries',
                method: 'GET',
                headers: {
                    'User-Agent': 'Android Messages Desktop App'
                }
            }

            https.get(requestOptions, (response) => {
                //response.
                console.log('github dictionaries check', response.statusCode);
                var body = '';
                response.on('data', function (chunk) {
                    body += chunk;
                });
                response.on('end', function () {
                    //console.log(body);
                    if (response.statusCode === 200 || response.statusCode === 302) {
                        //console.log('body', typeof body);
                        const listOfDictionaries = JSON.parse(body);
                        console.log('the download file from http response', listOfDictionaries);
                        const listOfSupportedLanguages = listOfDictionaries.map((folder) => {
                            if (folder.type === 'dir') {
                                return folder.name
                            }
                        });

                        let downloadDictionaryKey = null;

                        console.log('the list of languages supported by wooorm dictionaries', listOfSupportedLanguages);
                        if (listOfSupportedLanguages.includes(userLanguage)) {
                            downloadDictionaryKey = userLanguage;
                            console.log('your language is supported by the spellchecker!');
                        } else if (userLanguage in specialLanguageCases) {
                            console.log('your language is a supported special case', specialLanguageCases[userLanguage]);
                            downloadDictionaryKey = specialLanguageCases[userLanguage];
                        } else {
                            const closestLanguageMatch = listOfSupportedLanguages.filter(
                                (language) => language.substr(0, 2) === userLanguage.substr(0, 2)
                            );
                            if (closestLanguageMatch.length) {
                                console.log('your language is not supported but there\'s a similar language,', closestLanguageMatch[0]);
                                downloadDictionaryKey = closestLanguageMatch[0];
                            } else {
                                console.log('sorry, no spell checking support for your language');
                            }
                        }

                        if (downloadDictionaryKey) {
                            console.log('we should download the dictionary');

                            // https://raw.githubusercontent.com/wooorm/dictionaries/master/dictionaries/en-US/index.aff
                            const dictBaseUrl = `https://raw.githubusercontent.com/wooorm/dictionaries/master/dictionaries/${downloadDictionaryKey}/index`
                            // Use this ^ with this v to download the language files and put them in the right spot

                            let affFile = fs.createWriteStream(userLanguageAffFile);
                            let affRequest = https.get(`${dictBaseUrl}.aff`, (response) => {
                                response.pipe(affFile);
                            });

                            affFile.on('error', (err) => {
                                console.log('aff error downloading', err);
                            });
                            affFile.on('finish', (finished) => {
                                console.log('aff finished downloading', finished);
                            });

                            let dicFile = fs.createWriteStream(userLanguageDicFile);
                            let dicRequest = https.get(`${dictBaseUrl}.dic`, (response) => {
                                response.pipe(dicFile);
                            });

                            dicFile.on('error', (err) => {
                                console.log('dic error downloading', err);
                            });
                            dicFile.on('finish', (finished) => {
                                console.log('dic finished downloading', finished);
                            });

                            // init the spellchecker by sending an event
                        }


                    }
                });
            });
        } else {
            console.log('the dictionary files already exist');
            // init the spellchecker by sending an event
        }
    }

    static derpSherp() {
        console.log('derpySherpy');
    }

}
