import { statSync } from 'fs';
import { userInfo } from 'os';
import sudo from 'sudo-prompt';
import { IS_LINUX, SPELLING_DICTIONARIES_PATH } from '../constants';

function maybeGetValidJson(jsonText) {
    if (jsonText === null || jsonText === false || jsonText === '') {
        return false;
    }

    try {
        return JSON.parse(jsonText);
    } catch {
        return false;
    }
}

function isObject(maybeObj) {
    return typeof maybeObj === 'object';
}

function isDictionariesFolderOwnedByUser() {
    const stat = statSync(SPELLING_DICTIONARIES_PATH);
    const mUserInfo = userInfo();
    return isObject(stat) && isObject(mUserInfo) && 'uid' in stat && 'uid' in mUserInfo && stat.uid === mUserInfo.uid;
}

function currentUserAndGroupId() {
    const mUserInfo = userInfo();
    if (isObject(mUserInfo) && 'uid' in mUserInfo) {
        const { uid, gid } = mUserInfo;
        return {
            uid,
            gid
        };
    }
    return null;
}

function runSudoCommandPromise(command, options) {
    return new Promise((resolve, reject) => {
        sudo.exec(command, options,
            function (error, stdout, stderr) {
                if (error) {
                    reject(error);
                }
                resolve(stdout);
            }
        );
    });
}

function promptLinuxUserAndChangePermissions() {
    return new Promise(async (resolve, reject) => {
        if (!IS_LINUX) {
            reject(null);
            return;
        }
        if (isDictionariesFolderOwnedByUser()) {
            resolve(true);
            return;
        }
        const user = currentUserAndGroupId();
        if (user === null) {
            reject(null); // Couldn't get user and group ID
            return;
        }
        const options = {
            name: 'Android Messages Desktop'
        };
        try {
            // Must quote path, otherwise this would fail with paths that would require escaping (such as with spaces)
            await runSudoCommandPromise(`chown -R ${user.uid}:${user.gid} "${SPELLING_DICTIONARIES_PATH}"`, options);
            resolve(true);
        }
        catch (error) {
            reject(error);
        }
    })

}

export {
    maybeGetValidJson,
    isObject,
    isDictionariesFolderOwnedByUser,
    currentUserAndGroupId,
    promptLinuxUserAndChangePermissions
}
