import copy from "fast-copy";
import { getTypeOf } from "../utils/getTypeOf";
import { getSchemaType } from "../utils/getSchemaType";
import { getValue } from "../utils/getValue";
import { isEmpty } from "../utils/isEmpty";
import { isJsonError } from "../types";
import { isObject } from "../utils/isObject";
import { isSchemaNode } from "../types";
import { mergeNode } from "../mergeNode";
import { reduceOneOfFuzzy } from "../keywords/oneOf";
function safeResolveRef(node, options) {
    var _a, _b;
    if (node.$ref == null) {
        return undefined;
    }
    const { cache, recursionLimit = 1 } = options;
    const origin = node.schemaId;
    cache[origin] = (_a = cache[origin]) !== null && _a !== void 0 ? _a : {};
    cache[origin][node.$ref] = (_b = cache[origin][node.$ref]) !== null && _b !== void 0 ? _b : 0;
    const value = cache[origin][node.$ref];
    if (value >= recursionLimit && options.disableRecusionLimit !== true) {
        return false;
    }
    options.disableRecusionLimit = false;
    cache[origin][node.$ref] += 1;
    const resolvedNode = node.resolveRef();
    if (resolvedNode && resolvedNode !== node) {
        return resolvedNode;
    }
    return undefined;
}
function canResolveRef(node, options) {
    var _a, _b, _c;
    const counter = (_c = (_b = (_a = options.cache) === null || _a === void 0 ? void 0 : _a[node.schemaId]) === null || _b === void 0 ? void 0 : _b[node.$ref]) !== null && _c !== void 0 ? _c : -1;
    return counter < options.recursionLimit;
}
// only convert values where we do not lose original data
function convertValue(type, value) {
    const valueType = getTypeOf(value);
    if (type === undefined || value == null || valueType === type || (valueType === "number" && type === "integer")) {
        return value;
    }
    if (type === "string") {
        return JSON.stringify(value);
    }
    else if (valueType !== "string") {
        return value;
    }
    try {
        const parsedValue = JSON.parse(value);
        if (getTypeOf(parsedValue) === type) {
            return parsedValue;
        }
    }
    catch (e) { } // eslint-disable-line no-empty
    return value;
}
export function getData(node, data, opts) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if ((opts === null || opts === void 0 ? void 0 : opts.cache) == null) {
        throw new Error("Missing options");
    }
    // @ts-expect-error boolean schema
    if (node.schema === false || node.schema === true) {
        return data;
    }
    // @attention - very special case to support file instances
    if (data instanceof File) {
        return data;
    }
    if (((_a = node.schema) === null || _a === void 0 ? void 0 : _a.const) !== undefined) {
        return (_b = node.schema) === null || _b === void 0 ? void 0 : _b.const;
    }
    let currentNode = node;
    let defaultData = data;
    if (Array.isArray(node.schema.enum) && node.schema.enum.length > 0) {
        if (data === undefined) {
            return node.schema.enum[0];
        }
    }
    if (node.schema.default !== undefined) {
        if (defaultData === undefined) {
            defaultData = node.schema.default;
        }
    }
    // @keyword allOf
    if ((_c = currentNode.allOf) === null || _c === void 0 ? void 0 : _c.length) {
        currentNode.allOf.forEach((partialNode) => {
            var _a;
            defaultData = (_a = partialNode.getData(defaultData, opts)) !== null && _a !== void 0 ? _a : defaultData;
        });
    }
    // @keyword anyOf
    if (((_d = currentNode.anyOf) === null || _d === void 0 ? void 0 : _d.length) > 0) {
        defaultData = (_e = currentNode.anyOf[0].getData(defaultData, opts)) !== null && _e !== void 0 ? _e : defaultData;
    }
    // @keyword oneOf
    if (((_f = currentNode.oneOf) === null || _f === void 0 ? void 0 : _f.length) > 0) {
        if (isEmpty(defaultData)) {
            currentNode = mergeNode(currentNode, currentNode.oneOf[0]);
        }
        else {
            // find correct schema for data
            const resolvedNode = reduceOneOfFuzzy({ node: currentNode, data: defaultData });
            if (isJsonError(resolvedNode)) {
                if (defaultData != null && opts.removeInvalidData !== true) {
                    return defaultData;
                }
                // override
                currentNode = currentNode.oneOf[0];
                defaultData = undefined;
            }
            else {
                currentNode = mergeNode(currentNode, resolvedNode);
            }
        }
    }
    const resolvedNode = safeResolveRef(currentNode, opts);
    if (resolvedNode === false) {
        return defaultData;
    }
    if (resolvedNode && resolvedNode !== currentNode) {
        defaultData = (_g = resolvedNode.getData(defaultData, opts)) !== null && _g !== void 0 ? _g : defaultData;
        currentNode = resolvedNode;
    }
    const type = getSchemaType(currentNode, defaultData);
    const templateData = (_h = TYPE[type]) === null || _h === void 0 ? void 0 : _h.call(TYPE, currentNode, defaultData, opts);
    return templateData === undefined ? defaultData : templateData;
}
const TYPE = {
    null: (node, data) => getDefault(node, data, null),
    string: (node, data) => getDefault(node, data, ""),
    number: (node, data) => getDefault(node, data, 0),
    integer: (node, data) => getDefault(node, data, 0),
    boolean: (node, data) => getDefault(node, data, false),
    // object: (draft, schema, data: Record<string, unknown> | undefined, pointer: JsonPointer, opts: TemplateOptions) => {
    object: (node, data, opts) => {
        var _a;
        const schema = node.schema;
        const template = schema.default === undefined ? {} : schema.default;
        const d = {}; // do not assign data here, to keep ordering from json-schema
        const required = opts.extendDefaults === false && schema.default !== undefined ? [] : ((_a = schema.required) !== null && _a !== void 0 ? _a : []);
        if (node.properties) {
            Object.keys(node.properties).forEach((propertyName) => {
                const propertyNode = node.properties[propertyName];
                const isRequired = required.includes(propertyName);
                const input = getValue(data, propertyName);
                const value = data === undefined || input === undefined ? getValue(template, propertyName) : input;
                // Omit adding a property if it is not required or optional props should be added
                if (value != null || isRequired || opts.addOptionalProps) {
                    d[propertyName] = propertyNode.getData(value, opts);
                }
            });
        }
        if (isObject(node.dependencies)) {
            Object.keys(node.dependencies).forEach((propertyName) => {
                const propertyValue = node.dependencies[propertyName];
                const hasValue = getValue(d, propertyName) !== undefined;
                if (hasValue && Array.isArray(propertyValue)) {
                    propertyValue.forEach((addProperty) => {
                        const { node: propertyNode } = node.getChild(addProperty, d);
                        if (propertyNode) {
                            d[addProperty] = propertyNode.getData(getValue(d, addProperty), opts);
                        }
                    });
                }
                else if (d[propertyName] !== undefined && isSchemaNode(propertyValue)) {
                    const dependencyData = propertyValue.getData(data !== null && data !== void 0 ? data : d, opts);
                    Object.assign(d, dependencyData);
                }
                // if false and removeInvalidData => remove from data
            });
        }
        // @keyword dependencies - has to be done after resolving properties so dependency may trigger
        if (node.dependentSchemas) {
            Object.keys(node.dependentSchemas).forEach((prop) => {
                const dependency = node.dependentSchemas[prop];
                if (d[prop] !== undefined && isSchemaNode(dependency)) {
                    const dependencyData = dependency.getData(data !== null && data !== void 0 ? data : d, opts);
                    Object.assign(d, dependencyData);
                }
                // if false and removeInvalidData => remove from data
            });
        }
        // console.log("getData object", data, opts);
        if (data) {
            if (opts.removeInvalidData === true &&
                (schema.additionalProperties === false || isObject(schema.additionalProperties))) {
                if (isSchemaNode(node.additionalProperties)) {
                    Object.keys(data).forEach((key) => {
                        if (d[key] == null) {
                            // merge valid missing data (additionals) to resulting object
                            const value = getValue(data, key);
                            if (node.additionalProperties.validate(value).valid) {
                                d[key] = value;
                            }
                        }
                    });
                }
            }
            else {
                // merge any missing data (additionals) to resulting object
                Object.keys(data).forEach((key) => d[key] == null && (d[key] = getValue(data, key)));
            }
        }
        // @keyword if-then-else
        if (node.if) {
            const { errors } = node.if.validate(d);
            if (errors.length === 0 && node.then) {
                const templateData = node.then.getData(d, opts);
                Object.assign(d, templateData);
            }
            else if (errors.length > 0 && node.else) {
                const templateData = node.else.getData(d, opts);
                Object.assign(d, templateData);
            }
        }
        // returns object, which is ordered by json-schema
        return { ...template, ...d };
    },
    // build array type of items, ignores additionalItems
    array: (node, data, opts) => {
        var _a, _b;
        const schema = node.schema;
        const template = schema.default === undefined ? [] : schema.default;
        const d = Array.isArray(data) ? [...data] : template;
        const minItems = opts.extendDefaults === false && schema.default !== undefined ? 0 : ((_a = schema.minItems) !== null && _a !== void 0 ? _a : 0);
        // when there are no array-items are defined
        if (schema.prefixItems == null) {
            // => all items are additionalItems
            if (node.items && (canResolveRef(node.items, opts) || (d === null || d === void 0 ? void 0 : d.length) > 0)) {
                const cache = { ...opts.cache };
                const itemCount = Math.max(minItems, d.length);
                for (let i = 0; i < itemCount; i += 1) {
                    opts.cache = copy(cache);
                    const options = { ...opts, disableRecusionLimit: true };
                    d[i] = node.items.getData(d[i] == null ? template[i] : d[i], options);
                }
            }
            return d || [];
        }
        // when items are defined per index
        if (node.prefixItems) {
            const input = Array.isArray(data) ? data : [];
            // build defined set of items
            const length = Math.max(minItems !== null && minItems !== void 0 ? minItems : 0, node.prefixItems.length);
            for (let i = 0; i < length; i += 1) {
                const childNode = (_b = node.prefixItems[i]) !== null && _b !== void 0 ? _b : node.items;
                if ((childNode && canResolveRef(childNode, opts)) || input[i] !== undefined) {
                    const result = childNode.getData(d[i] == null ? template[i] : d[i], opts);
                    if (result !== undefined) {
                        d[i] = result;
                    }
                }
            }
            return d || [];
        }
        // this has to be defined as we checked all other cases
        if (node.items == null) {
            return d;
        }
        // build data from items-definition
        // @ts-expect-error asd
        if ((node.items && canResolveRef(node.items, opts)) || (data === null || data === void 0 ? void 0 : data.length) > 0) {
            // @attention this should disable cache or break intended behaviour as we reset it after loop
            // @todo test recursion of items
            // intention: reset cache after each property. last call will add counters
            const cache = { ...opts.cache };
            for (let i = 0, l = Math.max(minItems, d.length); i < l; i += 1) {
                opts.cache = copy(cache);
                const options = { ...opts, disableRecusionLimit: true };
                const result = node.items.getData(d[i] == null ? template[i] : d[i], options);
                // @attention if getData aborts recursion it currently returns undefined)
                if (result === undefined) {
                    return d;
                }
                else {
                    d[i] = result;
                }
            }
        }
        return d;
    }
};
function getDefault({ schema }, templateValue, initValue) {
    if (templateValue !== undefined) {
        return convertValue(schema.type, templateValue);
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
