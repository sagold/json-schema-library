// strips the url of the given reference
module.exports = function stripUrl(ref) {
    if (ref.indexOf("#") > 0) {
        return ref.split("#").pop();
    }
    return ref;
};
