export default {
    reset() {
        Object.keys(this).forEach(key => {
            if (typeof this[key] !== "function" && key !== "http://json-schema.org/draft-04/schema") {
                delete this[key];
            }
        });
    }
};
