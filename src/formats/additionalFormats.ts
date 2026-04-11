/* eslint-disable no-control-regex */
import { isAsciiIdn, isUri, isIdnEmail, isIri, isIriReference, isIdn } from "@hyperjump/json-schema-formats";
import { type Draft } from "src/Draft";
import { JsonSchemaValidatorParams, ValidationReturnType } from "src/Keyword";

const isValidIPV4 = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const isValidIPV6 =
    /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i;
const isValidURIRef =
    /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
// uri-template: https://tools.ietf.org/html/rfc6570
const isValidURITemplate =
    /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i;

export function addFormats(drafts: Draft[]) {
    drafts.forEach((draft) => (draft.formats = { ...formats, ...draft.formats }));
}

export const formats: Record<string, (options: JsonSchemaValidatorParams) => ValidationReturnType> = {
    hostname: ({ node, pointer, data }) => {
        const { schema } = node;
        if (typeof data !== "string" || isAsciiIdn(data)) {
            return undefined;
        }
        return node.createError("format-hostname-error", { value: data, pointer, schema });
    },

    "idn-hostname": ({ node, pointer, data }) => {
        if (typeof data !== "string" || isIdn(data)) {
            return undefined;
        }
        return node.createError("format-idn-hostname-error", { value: data, pointer, schema: node.schema });
    },

    /**
     * @draft 7
     * [RFC6531] https://json-schema.org/draft-07/json-schema-validation.html#RFC6531
     */
    "idn-email": ({ node, pointer, data }) => {
        if (typeof data !== "string" || data === "" || isIdnEmail(data)) {
            return undefined;
        }
        return node.createError("format-email-error", { value: data, pointer, schema: node.schema });
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

    iri: ({ node, pointer, data }) => {
        const { schema } = node;
        if (typeof data !== "string" || data === "" || isIri(data)) {
            return undefined;
        }
        return node.createError("format-iri-error", { value: data, pointer, schema });
    },

    "iri-reference": ({ node, pointer, data }) => {
        const { schema } = node;
        if (typeof data !== "string" || data === "" || isIriReference(data)) {
            return undefined;
        }
        return node.createError("format-iri-reference-error", { value: data, pointer, schema });
    },
    uri: ({ node, pointer, data }) => {
        if (typeof data !== "string" || data === "" || isUri(data)) {
            return undefined;
        }
        return node.createError("format-uri-error", { value: data, pointer, schema: node.schema });
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
    }
};
