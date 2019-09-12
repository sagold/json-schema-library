const remotes = require("../../remotes");
const ref = require("./ref");

// @todo fix: add remotes per instance
const draft04Schema = require("../../remotes/draft04.json");

// resolves remote references and returns either the input schema or the referenced remote schema
module.exports = function getTargetSchema($ref, schema) {
    const url = ref.getUrl($ref, schema.id);

    if ($ref.replace(/#$/, "") === "http://json-schema.org/draft-04/schema") {
        return draft04Schema;
    }

    if (remotes[url]) {
        return remotes[url];
    } else if (url) {
        throw new Error(`Unknown remote schema ${url}. It should have been added to 'remotes'-module`);
    }

    return schema;
};
