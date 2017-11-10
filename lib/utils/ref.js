function getHostname(url) {
    if (url == null || url.match == null) {
        return false;
    }
    const base = url.match(/(^(https?|file):\/\/[^\/]+)/);
    if (base && base.length) {
        return base[1];
    }
    return false;
}

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
function getUrl(ref, resourcePath = "") {
    if (ref.indexOf("#") > 0) {
        const url = ref.split("#").shift();
        const hostname = getHostname(resourcePath);

        if (/^(http|https|file):\/\//.test(url) === false && hostname !== false) {
            return `${hostname}/${url.replace(/^\//, "")}`;
        }

        return url;
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
