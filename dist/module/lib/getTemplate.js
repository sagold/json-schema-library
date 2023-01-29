/* eslint quote-props: 0, max-statements-per-line: ["error", { "max": 2 }] */
import resolveOneOfFuzzy from "./resolveOneOf.fuzzy";
import getTypeOf from "./getTypeOf";
import merge from "./utils/merge";
import copy from "./utils/copy";
import settings from "./config/settings";
import { isJSONError } from "./types";
import { isEmpty } from "./utils/isEmpty";
const defaultOptions = {
    addOptionalProps: true,
    removeInvalidData: false
};
let cache;
function shouldResolveRef(schema, pointer) {
    const { $ref } = schema;
    if ($ref == null) {
        return true;
    }
    const value = cache[pointer] == null || cache[pointer][$ref] == null ? 0 : cache[pointer][$ref];
    return value < settings.GET_TEMPLATE_RECURSION_LIMIT;
}
function resolveRef(core, schema, pointer) {
    // ensure we refactored consistently
    if (pointer == null) {
        throw new Error(`missing pointer ${pointer}`);
    }
    const { $ref } = schema;
    if ($ref == null) {
        return schema;
    }
    // @todo pointer + ref is redundant?
    cache[pointer] = cache[pointer] || {};
    cache[pointer][$ref] = cache[pointer][$ref] || 0;
    cache[pointer][$ref] += 1;
    return core.resolveRef(schema);
}
function convertValue(type, value) {
    if (type === "string") {
        return JSON.stringify(value);
    }
    else if (typeof value !== "string") {
        return null;
    }
    try {
        value = JSON.parse(value);
        if (typeof value === type) {
            return value;
        }
    }
    catch (e) { } // eslint-disable-line no-empty
    return null;
}
/**
 * Resolves $ref, allOf and anyOf schema-options, returning a combined json-schema.
 * Also returns a pointer-property on schema, that must be used as current pointer.
 * @param core
 * @param schema
 * @param data
 * @param pointer
 * @return resolved json-schema or input-schema
 */
function createTemplateSchema(core, schema, data, pointer) {
    // invalid schema
    if (getTypeOf(schema) !== "object") {
        return Object.assign({ pointer }, schema);
    }
    // return if reached recursion limit
    if (shouldResolveRef(schema, pointer) === false && data == null) {
        return false;
    }
    // resolve $ref and copy schema
    let templateSchema = copy(resolveRef(core, schema, pointer));
    if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
        // test if we may resolve
        if (shouldResolveRef(schema.anyOf[0], `${pointer}/anyOf/0`)) {
            const resolvedAnyOf = resolveRef(core, schema.anyOf[0], `${pointer}/anyOf/0`);
            templateSchema = merge(templateSchema, resolvedAnyOf);
            // add pointer return-value, if any
            templateSchema.pointer = schema.anyOf[0].$ref || templateSchema.pointer;
        }
        delete templateSchema.anyOf;
    }
    // resolve allOf
    if (Array.isArray(schema.allOf)) {
        for (let i = 0, l = schema.allOf.length; i < l; i += 1) {
            // test if we may resolve
            if (shouldResolveRef(schema.allOf[i], `${pointer}/allOf/${i}`)) {
                templateSchema = merge(templateSchema, resolveRef(core, schema.allOf[i], `${pointer}/allOf/${i}`));
                // add pointer return-value, if any
                templateSchema.pointer = schema.allOf[i].$ref || templateSchema.pointer;
            }
        }
        delete templateSchema.allOf;
    }
    templateSchema.pointer = templateSchema.pointer || schema.$ref || pointer;
    return templateSchema;
}
const isJSONSchema = (template) => template && typeof template === "object";
/**
 * Create data object matching the given schema
 *
 * @param core - json schema core
 * @param [data] - optional template data
 * @param [schema] - json schema, defaults to rootSchema
 * @return created template data
 */
function getTemplate(core, data, _schema, pointer, opts) {
    if (_schema == null) {
        throw new Error(`getTemplate: missing schema for data: ${JSON.stringify(data)}`);
    }
    if (pointer == null) {
        throw new Error("Missing pointer");
    }
    // resolve $ref references, allOf and first anyOf definitions
    let schema = createTemplateSchema(core, _schema, data, pointer);
    if (!isJSONSchema(schema)) {
        return undefined;
    }
    pointer = schema.pointer;
    if (schema === null || schema === void 0 ? void 0 : schema.const) {
        return schema.const;
    }
    if (Array.isArray(schema.oneOf)) {
        if (isEmpty(data)) {
            const type = schema.oneOf[0].type ||
                schema.type ||
                (schema.const && typeof schema.const) ||
                getTypeOf(data);
            schema = { ...schema.oneOf[0], type };
        }
        else {
            // find correct schema for data
            const resolvedSchema = resolveOneOfFuzzy(core, data, schema);
            if (isJSONError(resolvedSchema)) {
                if (data != null && opts.removeInvalidData !== true) {
                    return data;
                }
                // override
                schema = schema.oneOf[0];
                data = undefined;
            }
            else {
                schema = resolvedSchema;
            }
        }
    }
    // @todo Array.isArray(schema.type)
    // -> hasDefault? return
    // if not -> pick first types
    if (!isJSONSchema(schema) || schema.type == null) {
        return undefined;
    }
    const type = Array.isArray(schema.type)
        ? selectType(schema.type, data, schema.default)
        : schema.type;
    // reset invalid type
    const dataType = getTypeOf(data);
    if (data != null && dataType !== type && !(dataType === "number" && type === "integer")) {
        data = convertValue(type, data);
    }
    if (TYPE[type] == null) {
        // in case we could not resolve the type
        // (schema-type could not be resolved and returned an error)
        if (opts.removeInvalidData) {
            return undefined;
        }
        return data;
    }
    const templateData = TYPE[type](core, schema, data, pointer, opts);
    return templateData;
}
function selectType(types, data, defaultValue) {
    if (data == undefined) {
        if (defaultValue != null) {
            const defaultType = getTypeOf(defaultValue);
            if (types.includes(defaultType)) {
                return defaultType;
            }
        }
        return types[0];
    }
    const dataType = getTypeOf(data);
    if (types.includes(dataType)) {
        return dataType;
    }
    return types[0];
}
const TYPE = {
    null: (core, schema, data) => getDefault(schema, data, null),
    string: (core, schema, data) => getDefault(schema, data, ""),
    number: (core, schema, data) => getDefault(schema, data, 0),
    integer: (core, schema, data) => getDefault(schema, data, 0),
    boolean: (core, schema, data) => getDefault(schema, data, false),
    object: (core, schema, data, pointer, opts) => {
        var _a;
        const template = schema.default === undefined ? {} : schema.default;
        const d = {}; // do not assign data here, to keep ordering from json-schema
        const required = (_a = schema.required) !== null && _a !== void 0 ? _a : [];
        if (schema.properties) {
            Object.keys(schema.properties).forEach((key) => {
                const value = data == null || data[key] == null ? template[key] : data[key];
                const isRequired = required.includes(key);
                // Omit adding a property if it is not required or optional props should be added
                if (value != null || isRequired || opts.addOptionalProps) {
                    d[key] = getTemplate(core, value, schema.properties[key], `${pointer}/properties/${key}`, opts);
                }
            });
        }
        if (schema.dependencies) {
            Object.keys(schema.dependencies).forEach((key) => {
                if (d[key] === undefined) {
                    return;
                }
                const dependency = schema.dependencies[key];
                // dependencyRequired: { key: ['prop1', 'prop2'] }
                if (Array.isArray(dependency)) {
                    dependency.forEach((prop) => {
                        d[prop] = getTemplate(core, d[prop], schema.properties[prop], `${pointer}/properties/${prop}`, opts);
                    });
                    return;
                }
                if (getTypeOf(dependency) !== "object") {
                    return;
                }
                const result = getTemplate(core, data, {
                    ...dependency,
                    // required: Object.keys(dependency.properties || {}).concat(
                    //     dependency.required ?? []
                    // ),
                    type: "object"
                }, `${pointer}/dependencies/${key}`, opts);
                if (result && !isJSONError(result)) {
                    Object.assign(d, result);
                }
            });
        }
        if (data) {
            // merge any missing data (additionals) to resulting object
            Object.keys(data).forEach((key) => d[key] == null && (d[key] = data[key]));
        }
        if (schema.if && (schema.then || schema.else)) {
            const isValid = core.isValid(d, schema.if);
            if (isValid && schema.then) {
                const additionalData = core.getTemplate(d, { type: "object", ...schema.then }, opts);
                Object.assign(d, additionalData);
            }
            else if (!isValid && schema.else) {
                const additionalData = core.getTemplate(d, { type: "object", ...schema.else }, opts);
                Object.assign(d, additionalData);
            }
        }
        // returns object, which is ordered by json-schema
        return d;
    },
    // build array type of items, ignores additionalItems
    array: (core, schema, data, pointer, opts) => {
        var _a, _b, _c;
        const template = schema.default === undefined ? [] : schema.default;
        schema.minItems = schema.minItems || 0;
        const d = data || [];
        // items are undefined
        if (schema.items == null) {
            return d;
        }
        // build defined set of items
        if (Array.isArray(schema.items)) {
            for (let i = 0, l = Math.max((_a = schema.minItems) !== null && _a !== void 0 ? _a : 0, (_c = (_b = schema.items) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0); i < l; i += 1) {
                d[i] = getTemplate(core, d[i] == null ? template[i] : d[i], schema.items[i], `${pointer}/items/${i}`, opts);
            }
            return d;
        }
        // abort if the schema is invalid
        if (getTypeOf(schema.items) !== "object") {
            return d;
        }
        // resolve allOf and first anyOf definition
        const templateSchema = createTemplateSchema(core, schema.items, data, pointer);
        if (templateSchema === false) {
            return d;
        }
        pointer = templateSchema.pointer || pointer;
        // build oneOf
        if (templateSchema.oneOf && d.length === 0) {
            const oneOfSchema = templateSchema.oneOf[0];
            for (let i = 0; i < schema.minItems; i += 1) {
                d[i] = getTemplate(core, d[i] == null ? template[i] : d[i], oneOfSchema, `${pointer}/oneOf/0`, opts);
            }
            return d;
        }
        if (templateSchema.oneOf && d.length > 0) {
            const itemCount = Math.max(schema.minItems, d.length);
            for (let i = 0; i < itemCount; i += 1) {
                let value = d[i] == null ? template[i] : d[i];
                let one = resolveOneOfFuzzy(core, value, templateSchema);
                if (one == null || isJSONError(one)) {
                    // schema could not be resolved or data is invalid
                    if (value != null && opts.removeInvalidData !== true) {
                        // keep invalid value
                        d[i] = value;
                    }
                    else {
                        // replace invalid value
                        value = undefined;
                        one = templateSchema.oneOf[0];
                        d[i] = getTemplate(core, value, one, `${pointer}/oneOf/${i}`, opts);
                    }
                }
                else {
                    // schema is valid
                    d[i] = getTemplate(core, value, one, `${pointer}/oneOf/${i}`, opts);
                }
            }
            return d;
        }
        // build items-definition
        if (templateSchema.type) {
            for (let i = 0, l = Math.max(schema.minItems, d.length); i < l; i += 1) {
                d[i] = getTemplate(core, d[i] == null ? template[i] : d[i], templateSchema, `${pointer}/items`, opts);
            }
            return d;
        }
        return d;
    }
};
function getDefault(schema, templateValue, initValue) {
    if (templateValue != null) {
        return templateValue;
    }
    else if (schema.const) {
        return schema.const;
    }
    else if (schema.default === undefined && Array.isArray(schema.enum)) {
        return schema.enum[0];
    }
    else if (schema.default === undefined) {
        return initValue;
    }
    return schema.default;
}
export default (core, data, schema = core.rootSchema, opts = defaultOptions) => {
    cache = { mi: {} };
    return getTemplate(core, data, schema, "#", opts);
};
