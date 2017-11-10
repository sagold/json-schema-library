// strips the url of the given reference
function getPointer(ref) {
    if (ref.indexOf("#") > 0) {
        return ref.split("#").pop();
    }

    if (/^(http|https|file):\/\//.test(ref)) {
        return "";
    }

    return ref;
}

// strips the pointer from the json-schema-pointer
function getUrl(ref) {
    if (ref.indexOf("#") > 0) {
        return ref.split("#").shift();
    }

    if (/^(http|https|file):\/\//.test(ref)) {
        return ref;
    }

    return false;
}

module.exports = {
    getPointer,
    getUrl
};
