import validUrl from "valid-url";
import { parse as parseIdnEmail } from "smtp-address-parser";
// referenced
// https://github.com/cfworker/cfworker/blob/main/packages/json-schema/src/format.ts
// https://gist.github.com/marcelotmelo/b67f58a08bee6c2468f8
const isValidDateTime = new RegExp("^([0-9]+)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\\.[0-9]+)?(([Zz])|([\\+|\\-]([01][0-9]|2[0-3]):[0-5][0-9]))$");
const isValidIPV4 = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const isValidIPV6 = /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i;
const isValidHostname = /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)*\.?$/;
const matchDate = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
// const matchTime = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
const matchTime = /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i;
const DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const isValidJsonPointer = /^(?:\/(?:[^~/]|~0|~1)*)*$/;
const isValidRelativeJsonPointer = /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/;
const isValidURIRef = /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
// uri-template: https://tools.ietf.org/html/rfc6570
const isValidURITemplate = /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i;
// Default Json-Schema formats: date-time, email, hostname, ipv4, ipv6, uri, uriref
const formatValidators = {
    date: (draft, schema, value, pointer) => {
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        // https://github.com/cfworker/cfworker/blob/main/packages/json-schema/src/format.ts
        // full-date from http://tools.ietf.org/html/rfc3339#section-5.6
        const matches = value.match(matchDate);
        if (!matches) {
            return draft.errors.formatDateTimeError({ value, pointer, schema });
        }
        const year = +matches[1];
        const month = +matches[2];
        const day = +matches[3];
        // https://tools.ietf.org/html/rfc3339#appendix-C
        const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        if (month >= 1 &&
            month <= 12 &&
            day >= 1 &&
            day <= (month == 2 && isLeapYear ? 29 : DAYS[month])) {
            return undefined;
        }
        return draft.errors.formatDateError({ value, pointer, schema });
    },
    "date-time": (draft, schema, value, pointer) => {
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        if (value === "" || isValidDateTime.test(value)) {
            if (new Date(value).toString() === "Invalid Date") {
                return draft.errors.formatDateTimeError({ value, pointer, schema });
            }
            return undefined;
        }
        return draft.errors.formatDateTimeError({ value, pointer, schema });
    },
    email: (draft, schema, value, pointer) => {
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        // taken from https://github.com/ExodusMovement/schemasafe/blob/master/src/formats.js
        if (value[0] === '"') {
            return draft.errors.formatEmailError({ value, pointer, schema });
        }
        const [name, host, ...rest] = value.split("@");
        if (!name || !host || rest.length !== 0 || name.length > 64 || host.length > 253) {
            return draft.errors.formatEmailError({ value, pointer, schema });
        }
        if (name[0] === "." || name.endsWith(".") || name.includes("..")) {
            return draft.errors.formatEmailError({ value, pointer, schema });
        }
        if (!/^[a-z0-9.-]+$/i.test(host) || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(name)) {
            return draft.errors.formatEmailError({ value, pointer, schema });
        }
        if (!host.split(".").every((part) => /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(part))) {
            return draft.errors.formatEmailError({ value, pointer, schema });
        }
        return undefined;
    },
    /**
     * @draft 7
     * [RFC6531] https://json-schema.org/draft-07/json-schema-validation.html#RFC6531
     */
    "idn-email": (draft, schema, value, pointer) => {
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        try {
            parseIdnEmail(value);
            return undefined;
        }
        catch (e) {
            return draft.errors.formatEmailError({ value, pointer, schema });
        }
    },
    hostname: (draft, schema, value, pointer) => {
        if (typeof value !== "string") {
            return undefined;
        }
        if (value === "" || isValidHostname.test(value)) {
            return undefined;
        }
        return draft.errors.formatHostnameError({ value, pointer, schema });
    },
    ipv4: (draft, schema, value, pointer) => {
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        if (value && value[0] === "0") {
            // leading zeroes should be rejected, as they are treated as octals
            return draft.errors.formatIPV4LeadingZeroError({ value, pointer, schema });
        }
        if (value.length <= 15 && isValidIPV4.test(value)) {
            return undefined;
        }
        return draft.errors.formatIPV4Error({ value, pointer, schema });
    },
    ipv6: (draft, schema, value, pointer) => {
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        if (value && value[0] === "0") {
            // leading zeroes should be rejected, as they are treated as octals
            return draft.errors.formatIPV6LeadingZeroError({ value, pointer, schema });
        }
        if (value.length <= 45 && isValidIPV6.test(value)) {
            return undefined;
        }
        return draft.errors.formatIPV6Error({ value, pointer, schema });
    },
    "json-pointer": (draft, schema, value, pointer) => {
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        if (isValidJsonPointer.test(value)) {
            return undefined;
        }
        return draft.errors.formatJsonPointerError({ value, pointer, schema });
    },
    "relative-json-pointer": (draft, schema, value, pointer) => {
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        if (isValidRelativeJsonPointer.test(value)) {
            return undefined;
        }
        return draft.errors.formatJsonPointerError({ value, pointer, schema });
    },
    regex: (draft, schema, value, pointer) => {
        if (typeof value === "string" && /\\Z$/.test(value) === false) {
            try {
                new RegExp(value);
                return undefined;
            }
            catch (e) { } // eslint-disable-line no-empty
            return draft.errors.formatRegExError({ value, pointer, schema });
        }
        // v7 tests, ignore non-regex values
        if (typeof value === "object" || typeof value === "number" || Array.isArray(value)) {
            return undefined;
        }
        return draft.errors.formatRegExError({ value, pointer, schema });
    },
    // hh:mm:ss.sTZD
    // https://opis.io/json-schema/2.x/formats.html
    // regex https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch04s07.html
    time: (draft, schema, value, pointer) => {
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        // https://github.com/cfworker/cfworker/blob/main/packages/json-schema/src/format.ts
        const matches = value.match(matchTime);
        return matches ? undefined : draft.errors.formatDateTimeError({ value, pointer, schema });
        // if (!matches) {
        //     return errors.formatDateTimeError({ value, pointer, schema });
        // }
        // const hour = +matches[1];
        // const minute = +matches[2];
        // const second = +matches[3];
        // const timeZone = !!matches[5];
        // if (
        //     ((hour <= 23 && minute <= 59 && second <= 59) ||
        //         (hour == 23 && minute == 59 && second == 60)) &&
        //     timeZone
        // ) {
        //     return undefined;
        // }
        // return errors.formatTimeError({ value, pointer, schema });
    },
    uri: (draft, schema, value, pointer) => {
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        if (validUrl.isUri(value)) {
            return undefined;
        }
        return draft.errors.formatURIError({ value, pointer, schema });
    },
    "uri-reference": (draft, schema, value, pointer) => {
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        if (isValidURIRef.test(value)) {
            return undefined;
        }
        return draft.errors.formatURIReferenceError({ value, pointer, schema });
    },
    "uri-template": (draft, schema, value, pointer) => {
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        if (isValidURITemplate.test(value)) {
            return undefined;
        }
        return draft.errors.formatURITemplateError({ value, pointer, schema });
    },
    url: (draft, schema, value, pointer) => {
        if (value === "" || validUrl.isWebUri(value)) {
            return undefined;
        }
        return draft.errors.formatURLError({ value, pointer, schema });
    }
};
export default formatValidators;
