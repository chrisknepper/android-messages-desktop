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

export {
    maybeGetValidJson,
    isObject
}