/* eslint-disable max-len */
const errors = require("./errors");
const validUrl = require("valid-url");

// https://gist.github.com/marcelotmelo/b67f58a08bee6c2468f8
const isValidDateTime = new RegExp("^([0-9]+)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\\.[0-9]+)?(([Zz])|([\\+|\\-]([01][0-9]|2[0-3]):[0-5][0-9]))$");
const isValidIPV4 = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const isValidIPV6 = /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i;
const isValidHostname = /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)*\.?$/;


// Default JSON-Schema formats: date-time, email, hostname, ipv4, ipv6, uri, uriref
const FormatValidation = {

    "date-time": (core, schema, value, pointer) => {
        if (typeof value !== "string") {
            return undefined;
        }
        if (value === "" || isValidDateTime.test(value)) {
            if (new Date(value).toString() === "Invalid Date") {
                return errors.formatDateTimeError({ value, pointer });
            }
            return undefined;
        }
        return errors.formatDateTimeError({ value, pointer });
    },

    email: (core, schema, value, pointer) => {
        // taken from https://github.com/ExodusMovement/schemasafe/blob/master/src/formats.js
        if (typeof value !== "string") {
            return undefined;
        }
        if (value[0] === '"') {
            return errors.formatEmailError({ value, pointer });
        }
        const [name, host, ...rest] = value.split('@');
        if (!name || !host || rest.length !== 0 || name.length > 64 || host.length > 253 ) {
            return errors.formatEmailError({ value, pointer });
        }
        if (name[0] === '.' || name.endsWith('.') || name.includes('..')) {
            return errors.formatEmailError({ value, pointer });
        }
        if (!/^[a-z0-9.-]+$/i.test(host) || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(name)) {
            return errors.formatEmailError({ value, pointer });
        }
        if (!host.split('.').every(part => /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(part))) {
            return errors.formatEmailError({ value, pointer });
        }
        return undefined;
    },

    hostname: (core, schema, value, pointer) => {
        if (typeof value !== "string") {
            return undefined;
        }
        if (value === "" || isValidHostname.test(value)) {
            return undefined;
        }
        return errors.formatHostnameError({ value, pointer });
    },

    ipv4: (core, schema, value, pointer) => {
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        if (value.length <= 15 && isValidIPV4.test(value)) {
            return undefined;
        }
        return errors.formatIPV4Error({ value, pointer });
    },

    ipv6: (core, schema, value, pointer) => {
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        if (value.length <= 45 && isValidIPV6.test(value)) {
            return undefined;
        }
        return errors.formatIPV6Error({ value, pointer });
    },

    regex: (core, schema, value, pointer) => {
        if (typeof value === "string" && /\\Z$/.test(value) === false) {
            return undefined;
        }
        return errors.formatRegExError({ value, pointer });
    },

    uri: (core, schema, value, pointer) => {
        if (typeof value !== "string") {
            return undefined;
        }
        if (value === "" || validUrl.isUri(value)) {
            return undefined;
        }
        return errors.formatUriError({ value, pointer });
    },

    url: (core, schema, value, pointer) => {
        if (value === "" || validUrl.isWebUri(value)) {
            return undefined;
        }
        return errors.formatUrlError({ value, pointer });
    }
};


module.exports = FormatValidation;
