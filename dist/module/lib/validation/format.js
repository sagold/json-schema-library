import validUrl from "valid-url";
import { parse as parseIdnEmail } from "smtp-address-parser";
import getTypeOf from "../getTypeOf";
const isValidIPV4 = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const isValidIPV6 = /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i;
const isValidHostname = /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)*\.?$/;
const matchDate = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
const matchTime = /^(?<time>(?:([0-1]\d|2[0-3]):[0-5]\d:(?<second>[0-5]\d|60)))(?:\.\d+)?(?<offset>(?:z|[+-]([0-1]\d|2[0-3])(?::?[0-5]\d)?))$/i;
const DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const isValidJsonPointer = /^(?:\/(?:[^~/]|~0|~1)*)*$/;
const isValidRelativeJsonPointer = /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/;
const isValidURIRef = /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
// uri-template: https://tools.ietf.org/html/rfc6570
const isValidURITemplate = /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i;
const isValidDurationString = /^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/;
// Default Json-Schema formats: date-time, email, hostname, ipv4, ipv6, uri, uriref
const formatValidators = {
    date: (node, value) => {
        const { draft, schema, pointer } = node;
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
    "date-time": (node, value) => {
        const { draft, schema, pointer } = node;
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        const dateAndTime = value.split(/t/i);
        if (dateAndTime.length === 2) {
            const dateIsValid = formatValidators.date(node, dateAndTime[0]) === undefined;
            const timeIsValid = formatValidators.time(node, dateAndTime[1]) === undefined;
            if (dateIsValid && timeIsValid) {
                return undefined;
            }
        }
        return draft.errors.formatDateTimeError({ value, pointer, schema });
    },
    duration: (node, value) => {
        const type = getTypeOf(value);
        if (type !== "string") {
            return undefined;
        }
        // weeks cannot be combined with other units
        const isInvalidDurationString = /(\d+M)(\d+W)|(\d+Y)(\d+W)/;
        if (!isValidDurationString.test(value) ||
            isInvalidDurationString.test(value)) {
            return node.draft.errors.formatDurationError({
                value,
                pointer: node.pointer,
                schema: node.schema
            });
        }
    },
    email: (node, value) => {
        const { draft, schema, pointer } = node;
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
    "idn-email": (node, value) => {
        const { draft, schema, pointer } = node;
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
    hostname: (node, value) => {
        const { draft, schema, pointer } = node;
        if (typeof value !== "string") {
            return undefined;
        }
        if (value === "" || isValidHostname.test(value)) {
            return undefined;
        }
        return draft.errors.formatHostnameError({ value, pointer, schema });
    },
    ipv4: (node, value) => {
        const { draft, schema, pointer } = node;
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
    ipv6: (node, value) => {
        const { draft, schema, pointer } = node;
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
    "json-pointer": (node, value) => {
        const { draft, schema, pointer } = node;
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        if (isValidJsonPointer.test(value)) {
            return undefined;
        }
        return draft.errors.formatJsonPointerError({ value, pointer, schema });
    },
    "relative-json-pointer": (node, value) => {
        const { draft, schema, pointer } = node;
        if (typeof value !== "string") {
            return undefined;
        }
        if (isValidRelativeJsonPointer.test(value)) {
            return undefined;
        }
        return draft.errors.formatJsonPointerError({ value, pointer, schema });
    },
    regex: (node, value) => {
        const { draft, schema, pointer } = node;
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
    // RFC 3339 https://datatracker.ietf.org/doc/html/rfc3339#section-4
    time: (node, value) => {
        const { draft, schema, pointer } = node;
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        // https://github.com/cfworker/cfworker/blob/main/packages/json-schema/src/format.ts
        const matches = value.match(matchTime);
        if (!matches) {
            return draft.errors.formatDateTimeError({ value, pointer, schema });
        }
        // leap second
        if (matches.groups.second === "60") {
            // bail early
            if (/23:59:60(z|\+00:00)/i.test(value)) {
                return undefined;
            }
            // check if sum matches 23:59
            const minutes = matches.groups.time.match(/(\d+):(\d+):/);
            const offsetMinutes = matches.groups.offset.match(/(\d+):(\d+)/);
            if (offsetMinutes) {
                const hour = parseInt(minutes[1]);
                const offsetHour = parseInt(offsetMinutes[1]);
                const min = parseInt(minutes[2]);
                const offsetMin = parseInt(offsetMinutes[2]);
                let deltaTime;
                if (/^-/.test(matches.groups.offset)) {
                    deltaTime = (hour + offsetHour) * 60 + (min + offsetMin);
                }
                else {
                    deltaTime = (24 + hour - offsetHour) * 60 + (min - offsetMin);
                }
                const hours = Math.floor(deltaTime / 60);
                const actualHour = hours % 24;
                const actualMinutes = deltaTime - hours * 60;
                if (actualHour === 23 && actualMinutes === 59) {
                    return undefined;
                }
            }
            return draft.errors.formatDateTimeError({ value, pointer, schema });
        }
        return undefined;
    },
    uri: (node, value) => {
        const { draft, schema, pointer } = node;
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        if (validUrl.isUri(value)) {
            return undefined;
        }
        return draft.errors.formatURIError({ value, pointer, schema });
    },
    "uri-reference": (node, value) => {
        const { draft, schema, pointer } = node;
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        if (isValidURIRef.test(value)) {
            return undefined;
        }
        return draft.errors.formatURIReferenceError({ value, pointer, schema });
    },
    "uri-template": (node, value) => {
        const { draft, schema, pointer } = node;
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        if (isValidURITemplate.test(value)) {
            return undefined;
        }
        return draft.errors.formatURITemplateError({ value, pointer, schema });
    },
    url: (node, value) => {
        const { draft, schema, pointer } = node;
        if (value === "" || validUrl.isWebUri(value)) {
            return undefined;
        }
        return draft.errors.formatURLError({ value, pointer, schema });
    },
    uuid: (node, value) => {
        const { draft, schema, pointer } = node;
        if (typeof value !== "string" || value === "") {
            return undefined;
        }
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
            return undefined;
        }
        return draft.errors.formatUUIDError({ value, pointer, schema });
    }
};
export default formatValidators;
