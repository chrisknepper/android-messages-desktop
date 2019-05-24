import { statSync } from fs;
import { userInfo } from os;
import { SPELLING_DICTIONARIES_PATH } from 'constants';

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

export {
    maybeGetValidJson,
    isObject,
    isDictionariesFolderOwnedByUser,
    currentUserAndGroupId
}