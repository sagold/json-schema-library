/* eslint-disable max-len, no-control-regex */
import { getTypeOf } from "../utils/getTypeOf";
import validUrl from "valid-url";
import { JsonSchemaValidatorParams, ValidationResult } from "../Keyword";
import { parse as parseIdnEmail } from "smtp-address-parser";
import { JsonError } from "../types";

const isValidIPV4 = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const isValidIPV6 =
    /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i;
const isValidHostname =
    /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)*\.?$/;
const matchDate = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
const matchTime =
    /^(?<time>(?:([0-1]\d|2[0-3]):[0-5]\d(:(?<second>[0-5]\d|60))?))(?:\.\d+)?(?<offset>(?:z|[+-]([0-1]\d|2[0-3])(?::?[0-5]\d)?)?)$/i;
const DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const isValidJsonPointer = /^(?:\/(?:[^~/]|~0|~1)*)*$/;
const isValidRelativeJsonPointer = /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/;
const isValidURIRef =
    /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
// uri-template: https://tools.ietf.org/html/rfc6570
const isValidURITemplate =
    /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i;
const isValidDurationString = /^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/;

// Default Json-Schema formats: date-time, email, hostname, ipv4, ipv6, uri, uriref
export const formats: Record<
    string,
    (options: JsonSchemaValidatorParams) => undefined | JsonError | ValidationResult[]
> = {
    date: ({ node, pointer, data }) => {
        const { schema } = node;
        if (typeof data !== "string" || data === "") {
            return undefined;
        }
        // https://github.com/cfworker/cfworker/blob/main/packages/json-schema/src/format.ts
        // full-date from http://tools.ietf.org/html/rfc3339#section-5.6
        const matches = data.match(matchDate);
        if (!matches) {
            return node.createError("format-date-time-error", { value: data, pointer, schema });
        }
        const year = +matches[1];
        const month = +matches[2];
        const day = +matches[3];
        // https://tools.ietf.org/html/rfc3339#appendix-C
        const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        if (month >= 1 && month <= 12 && day >= 1 && day <= (month == 2 && isLeapYear ? 29 : DAYS[month])) {
            return undefined;
        }
        return node.createError("format-date-error", { value: data, pointer, schema });
    },

    "date-time": ({ node, pointer, data }) => {
        const { schema } = node;
        if (typeof data !== "string" || data === "") {
            return undefined;
        }
        const dateAndTime = data.split(/t/i);
        if (dateAndTime.length === 2) {
            const dateIsValid = formats.date({ node, pointer, data: dateAndTime[0] }) === undefined;
            const timeIsValid = formats.time({ node, pointer, data: dateAndTime[1] }) === undefined;
            if (dateIsValid && timeIsValid) {
                return undefined;
            }
        }
        return node.createError("format-date-time-error", { value: data, pointer, schema });
    },

    duration: ({ node, pointer, data }) => {
        const type = getTypeOf(data);
        if (type !== "string") {
            return undefined;
        }

        // weeks cannot be combined with other units
        const isInvalidDurationString = /(\d+M)(\d+W)|(\d+Y)(\d+W)/;

        if (!isValidDurationString.test(data as string) || isInvalidDurationString.test(data as string)) {
            return node.createError("format-duration-error", {
                value: data,
                pointer,
                schema: node.schema
            });
        }
    },
    email: ({ node, pointer, data }) => {
        const { schema } = node;
        if (typeof data !== "string" || data === "") {
            return undefined;
        }

        const lastIndex = data.lastIndexOf("@");
        const name = data.substr(0, lastIndex);
        const host = data.substr(lastIndex + 1);
        if (!name || !host || name.length > 64 || host.length > 253) {
            return node.createError("format-email-error", { value: data, pointer, schema });
        }

        // if name is in double quotes: "joe bloggs"@example.com, whitespaces, dots etc are allowed
        // so, we remove valid strings in quote
        let strippedName = name;
        if (/^".*"$/.test(name)) {
            strippedName = name.replace(/(^")|([. @]+)|("$)/g, "");
        }

        if (strippedName[0] === "." || strippedName.endsWith(".") || strippedName.includes("..")) {
            return node.createError("format-email-error", { value: data, pointer, schema });
        }
        if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(strippedName)) {
            return node.createError("format-email-error", { value: data, pointer, schema });
        }

        if (/^\[.*\]$/.test(host)) {
            const possibleIp = host.substr(1, host.length - 2);
            if (
                isValidIPV4.test(possibleIp) ||
                isValidIPV6.test(possibleIp) ||
                /IPv6:::[0-9a-f]{1,4}/.test(possibleIp)
            ) {
                return undefined;
            }
        }

        if (!/^[a-z0-9.-]+$/i.test(host)) {
            return node.createError("format-email-error", { value: data, pointer, schema });
        }
        if (!host.split(".").every((part) => /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(part))) {
            return node.createError("format-email-error", { value: data, pointer, schema });
        }
        return undefined;
    },

    /**
     * @draft 7
     * [RFC6531] https://json-schema.org/draft-07/json-schema-validation.html#RFC6531
     */
    "idn-email": ({ node, pointer, data }) => {
        const { schema } = node;
        if (typeof data !== "string" || data === "") {
            return undefined;
        }
        try {
            parseIdnEmail(data);
            return undefined;
        } catch (e) {
            return node.createError("format-email-error", { value: data, pointer, schema });
        }
    },

    hostname: ({ node, pointer, data }) => {
        const { schema } = node;
        if (typeof data !== "string") {
            return undefined;
        }
        if (isValidHostname.test(data)) {
            return undefined;
        }
        return node.createError("format-hostname-error", { value: data, pointer, schema });
    },

    ipv4: ({ node, pointer, data }) => {
        const { schema } = node;
        if (typeof data !== "string" || data === "") {
            return undefined;
        }
        if (data && data[0] === "0") {
            // leading zeroes should be rejected, as they are treated as octals
            return node.createError("format-ipv4-leading-zero-error", { value: data, pointer, schema });
        }
        if (data.length <= 15 && isValidIPV4.test(data)) {
            return undefined;
        }
        return node.createError("format-ipv4-error", { value: data, pointer, schema });
    },

    ipv6: ({ node, pointer, data }) => {
        const { schema } = node;
        if (typeof data !== "string" || data === "") {
            return undefined;
        }
        if (data && data[0] === "0") {
            // leading zeroes should be rejected, as they are treated as octals
            return node.createError("format-ipv6-leading-zero-error", { value: data, pointer, schema });
        }
        if (data.length <= 45 && isValidIPV6.test(data)) {
            return undefined;
        }
        return node.createError("format-ipv6-error", { value: data, pointer, schema });
    },

    "json-pointer": ({ node, pointer, data }) => {
        const { schema } = node;
        if (typeof data !== "string" || data === "") {
            return undefined;
        }
        if (isValidJsonPointer.test(data)) {
            return undefined;
        }
        return node.createError("format-json-pointer-error", { value: data, pointer, schema });
    },

    "relative-json-pointer": ({ node, pointer, data }) => {
        const { schema } = node;
        if (typeof data !== "string") {
            return undefined;
        }
        if (isValidRelativeJsonPointer.test(data)) {
            return undefined;
        }
        return node.createError("format-json-pointer-error", { value: data, pointer, schema });
    },

    regex: ({ node, pointer, data }) => {
        const { schema } = node;
        if (
            typeof data === "object" ||
            typeof data === "number" ||
            Array.isArray(data) ||
            getTypeOf(data) === "boolean"
        ) {
            return undefined;
        }
        if (typeof data === "string" && /\\Z$/.test(data) === false) {
            try {
                new RegExp(data, "u");
                return undefined;
            } catch (e) {} // eslint-disable-line no-empty

            return node.createError("format-regex-error", { value: data, pointer, schema });
        }
        // v7 tests, ignore non-regex values

        return node.createError("format-regex-error", { value: data, pointer, schema });
    },

    // hh:mm:ss.sTZD
    // RFC 3339 https://datatracker.ietf.org/doc/html/rfc3339#section-4
    time: ({ node, pointer, data }) => {
        const { schema } = node;
        if (typeof data !== "string" || data === "") {
            return undefined;
        }

        // https://github.com/cfworker/cfworker/blob/main/packages/json-schema/src/format.ts
        const matches = data.match(matchTime);
        if (!matches) {
            return node.createError("format-date-time-error", { value: data, pointer, schema });
        }

        // leap second
        if (matches.groups.second === "60") {
            // bail early
            if (/23:59:60(z|\+00:00)/i.test(data)) {
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
                } else {
                    deltaTime = (24 + hour - offsetHour) * 60 + (min - offsetMin);
                }
                const hours = Math.floor(deltaTime / 60);
                const actualHour = hours % 24;
                const actualMinutes = deltaTime - hours * 60;
                if (actualHour === 23 && actualMinutes === 59) {
                    return undefined;
                }
            }
            return node.createError("format-date-time-error", { value: data, pointer, schema });
        }

        return undefined;
    },

    uri: ({ node, pointer, data }) => {
        const { schema } = node;
        if (typeof data !== "string" || data === "") {
            return undefined;
        }
        if (validUrl.isUri(data)) {
            return undefined;
        }
        return node.createError("format-uri-error", { value: data, pointer, schema });
    },

    "uri-reference": ({ node, pointer, data }) => {
        const { schema } = node;
        if (typeof data !== "string" || data === "") {
            return undefined;
        }
        if (isValidURIRef.test(data)) {
            return undefined;
        }
        return node.createError("format-uri-reference-error", { value: data, pointer, schema });
    },

    "uri-template": ({ node, pointer, data }) => {
        const { schema } = node;
        if (typeof data !== "string" || data === "") {
            return undefined;
        }
        if (isValidURITemplate.test(data)) {
            return undefined;
        }
        return node.createError("format-uri-template-error", { value: data, pointer, schema });
    },

    url: ({ node, data, pointer }) => {
        const { schema } = node;
        if (data === "" || validUrl.isWebUri(`${data}`)) {
            return undefined;
        }
        return node.createError("format-url-error", { value: data, pointer, schema });
    },

    uuid: ({ node, data, pointer }) => {
        const { schema } = node;
        if (typeof data !== "string" || data === "") {
            return undefined;
        }
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data)) {
            return undefined;
        }
        return node.createError("format-uuid-error", { value: data, pointer, schema });
    }
};
