const errors = require("./errors");
const validUrl = require("valid-url");


// Default JSON-Schema formats: date-time, email, hostname, ipv4, ipv6, uri, uriref
const FormatValidation = {

    url: (core, schema, value, pointer) => {
        const isUrl = validUrl.isWebUri(value) != null;
        if (isUrl || value === "") {
            return undefined;
        }
        return errors.formatUrlError({ value, pointer });
    }
};


module.exports = FormatValidation;
