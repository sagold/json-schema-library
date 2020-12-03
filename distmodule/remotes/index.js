export default {
    "http://json-schema.org/draft-04/schema": require("./draft04.json"),
    reset() {
        Object.keys(this).forEach(key => {
            if (typeof this[key] !== "function" && key !== "http://json-schema.org/draft-04/schema") {
                delete this[key];
            }
        });
    }
};
