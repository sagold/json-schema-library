import copy from "fast-copy";
import getTypeOf from "../utils/getTypeOf";
import { getSchemaType } from "../utils/getSchemaType";
import { getValue } from "../utils/getValue";
import { isEmpty } from "../utils/isEmpty";
import { isJsonError } from "../types";
import { isObject } from "../utils/isObject";
import { isSchemaNode, SchemaNode } from "../types";
import { mergeNode } from "../mergeNode";
import { reduceOneOfFuzzy } from "../features/oneOf";

export type TemplateOptions = {
    /** Add all properties (required and optional) to the generated data */
    addOptionalProps?: boolean;
    /** Remove data that does not match input schema. Defaults to false */
    removeInvalidData?: boolean;
    /** Set to false to take default values as they are and not extend them.
     *  Defaults to true.
     *  This allows to control template data e.g. enforcing arrays to be empty,
     *  regardless of minItems settings.
     */
    extendDefaults?: boolean;
    /**
     * Limits how often a $ref should be followed before aborting. Prevents infinite data-structure.
     * Defaults to 1
     */
    recursionLimit?: number;
    /** @internal disables recursion limit for next call */
    disableRecusionLimit?: boolean;
    /** @internal context to track recursion limit */
    cache?: Record<string, Record<string, number>>;
};

function safeResolveRef(node: SchemaNode, options: TemplateOptions) {
    if (node.ref == null) {
        return undefined;
    }
    const { cache, recursionLimit = 1 } = options;

    const origin = node.schemaId;
    cache[origin] = cache[origin] ?? {};
    cache[origin][node.ref] = cache[origin][node.ref] ?? 0;
    const value = cache[origin][node.ref];
    if (value >= recursionLimit && options.disableRecusionLimit !== true) {
        return false;
    }
    options.disableRecusionLimit = false;
    cache[origin][node.ref] += 1;
    const resolvedNode = node.resolveRef();
    if (resolvedNode && resolvedNode !== node) {
        return resolvedNode;
    }

    return undefined;
}

function canResolveRef(node: SchemaNode, options: TemplateOptions) {
    const counter = options.cache?.[node.schemaId]?.[node.ref] ?? -1;
    return counter < options.recursionLimit;
}

// only convert values where we do not lose original data
function convertValue(type: string | undefined, value: any) {
    const valueType = getTypeOf(value);
    if (type === undefined || value == null || valueType === type || (valueType === "number" && type === "integer")) {
        return value;
    }

    if (type === "string") {
        return JSON.stringify(value);
    } else if (valueType !== "string") {
        return value;
    }

    try {
        const parsedValue = JSON.parse(value);
        if (getTypeOf(parsedValue) === type) {
            return parsedValue;
        }
    } catch (e) {} // eslint-disable-line no-empty

    return value;
}

export function getTemplate(node: SchemaNode, data?: unknown, opts?: TemplateOptions) {
    if (opts?.cache == null) {
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

    if (node.schema?.const !== undefined) {
        return node.schema?.const;
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

    // @feature allOf
    if (currentNode.allOf?.length) {
        currentNode.allOf.forEach((partialNode) => {
            defaultData = partialNode.getTemplate(defaultData, opts) ?? defaultData;
        });
    }

    // @feature anyOf
    if (currentNode.anyOf?.length > 0) {
        defaultData = currentNode.anyOf[0].getTemplate(defaultData, opts) ?? defaultData;
    }

    // @feature oneOf
    if (currentNode.oneOf?.length > 0) {
        if (isEmpty(defaultData)) {
            currentNode = mergeNode(currentNode, currentNode.oneOf[0]);
        } else {
            // find correct schema for data
            const resolvedNode = reduceOneOfFuzzy({ node: currentNode, data: defaultData });
            if (isJsonError(resolvedNode)) {
                if (defaultData != null && opts.removeInvalidData !== true) {
                    return defaultData;
                }
                // override
                currentNode = currentNode.oneOf[0];
                defaultData = undefined;
            } else {
                currentNode = mergeNode(currentNode, resolvedNode);
            }
        }
    }

    const resolvedNode = safeResolveRef(currentNode, opts);
    if (resolvedNode === false) {
        return defaultData;
    }

    if (resolvedNode && resolvedNode !== currentNode) {
        defaultData = resolvedNode.getTemplate(defaultData, opts) ?? defaultData;
        currentNode = resolvedNode;
    }

    // if (TYPE[type] == null) {
    //     // in case we could not resolve the type
    //     // (schema-type could not be resolved and returned an error)
    //     if (opts.removeInvalidData) {
    //         return undefined;
    //     }
    //     return data;
    // }

    const type = getSchemaType(currentNode, defaultData);
    const templateData = TYPE[type as string]?.(currentNode, defaultData, opts);
    return templateData === undefined ? defaultData : templateData;
}

const TYPE: Record<string, (node: SchemaNode, data: unknown, opts: TemplateOptions) => unknown> = {
    null: (node, data) => getDefault(node, data, null),
    string: (node, data) => getDefault(node, data, ""),
    number: (node, data) => getDefault(node, data, 0),
    integer: (node, data) => getDefault(node, data, 0),
    boolean: (node, data) => getDefault(node, data, false),
    // object: (draft, schema, data: Record<string, unknown> | undefined, pointer: JsonPointer, opts: TemplateOptions) => {
    object: (node, data, opts) => {
        const schema = node.schema;
        const template = schema.default === undefined ? {} : schema.default;
        const d: Record<string, any> = {}; // do not assign data here, to keep ordering from json-schema
        const required = opts.extendDefaults === false && schema.default !== undefined ? [] : (schema.required ?? []);

        if (node.properties) {
            Object.keys(node.properties).forEach((propertyName) => {
                const propertyNode = node.properties[propertyName];
                const isRequired = required.includes(propertyName);
                const input = getValue(data, propertyName);
                const value = data === undefined || input === undefined ? getValue(template, propertyName) : input;
                // Omit adding a property if it is not required or optional props should be added
                if (value != null || isRequired || opts.addOptionalProps) {
                    d[propertyName] = propertyNode.getTemplate(value, opts);
                }
            });
        }

        if (isObject(node.dependencies)) {
            Object.keys(node.dependencies).forEach((propertyName) => {
                const propertyValue = node.dependencies[propertyName];
                const hasValue = getValue(d, propertyName) !== undefined;
                if (hasValue && Array.isArray(propertyValue)) {
                    propertyValue.forEach((addProperty) => {
                        const propertyNode = node.get(addProperty, d);
                        if (isSchemaNode(propertyNode)) {
                            d[addProperty] = propertyNode.getTemplate(getValue(d, addProperty), opts);
                        }
                    });
                } else if (d[propertyName] !== undefined && isSchemaNode(propertyValue)) {
                    const dependencyData = propertyValue.getTemplate(data ?? d, opts);
                    Object.assign(d, dependencyData);
                }
                // if false and removeInvalidData => remove from data
            });
        }

        // @feature dependencies - has to be done after resolving properties so dependency may trigger
        if (node.dependentSchemas) {
            Object.keys(node.dependentSchemas).forEach((prop) => {
                if (d[prop] !== undefined && isObject(node.dependentSchemas[prop])) {
                    const dependencyData = node.dependentSchemas[prop].getTemplate(data ?? d, opts);
                    Object.assign(d, dependencyData);
                }
                // if false and removeInvalidData => remove from data
            });
        }

        // console.log("getTemplate object", data, opts);
        if (data) {
            if (
                opts.removeInvalidData === true &&
                (schema.additionalProperties === false || isObject(schema.additionalProperties))
            ) {
                if (isSchemaNode(node.additionalProperties)) {
                    Object.keys(data).forEach((key) => {
                        if (d[key] == null) {
                            // merge valid missing data (additionals) to resulting object
                            const value = getValue(data, key);
                            if (node.additionalProperties.validate(value).length === 0) {
                                d[key] = value;
                            }
                        }
                    });
                }
            } else {
                // merge any missing data (additionals) to resulting object
                Object.keys(data).forEach((key) => d[key] == null && (d[key] = getValue(data, key)));
            }
        }

        // @feature if-then-else
        if (node.if) {
            const errors = node.if.validate(d);
            if (errors.length === 0 && node.then) {
                const templateData = node.then.getTemplate(d, opts);
                Object.assign(d, templateData);
            } else if (errors.length > 0 && node.else) {
                const templateData = node.else.getTemplate(d, opts);
                Object.assign(d, templateData);
            }
        }

        // returns object, which is ordered by json-schema
        return { ...template, ...d };
    },
    // build array type of items, ignores additionalItems
    array: (node, data, opts) => {
        const schema = node.schema;
        const template = schema.default === undefined ? [] : schema.default;
        const d: unknown[] = Array.isArray(data) ? [...data] : template;
        const minItems = opts.extendDefaults === false && schema.default !== undefined ? 0 : (schema.minItems ?? 0);

        // when there are no array-items are defined
        if (schema.items == null) {
            // => all items are additionalItems
            if (node.additionalItems) {
                const itemCount = Math.max(minItems, d.length);
                for (let i = 0; i < itemCount; i += 1) {
                    d[i] = node.additionalItems.getTemplate(d[i], opts);
                }
            }
            return d || [];
        }

        // when items are defined per index
        if (node.itemsList) {
            const input = Array.isArray(data) ? data : [];

            // build defined set of items
            const length = Math.max(minItems ?? 0, node.itemsList.length);
            for (let i = 0; i < length; i += 1) {
                const childNode = node.itemsList[i] ?? node.additionalItems;
                if ((childNode && canResolveRef(childNode, opts)) || input[i] !== undefined) {
                    const result = childNode.getTemplate(d[i] == null ? template[i] : d[i], opts);
                    if (result !== undefined) {
                        d[i] = result;
                    }
                }
            }
            return d || [];
        }

        // this has to be defined as we checked all other cases
        if (node.itemsObject == null) {
            return d;
        }

        // build data from items-definition
        // @ts-expect-error asd
        if ((node.itemsObject && canResolveRef(node.itemsObject, opts)) || data?.length > 0) {
            // @attention this should disable cache or break intended behaviour as we reset it after loop
            // @todo test recursion of itemsObject
            // intention: reset cache after each property. last call will add counters
            const cache = { ...opts.cache };
            for (let i = 0, l = Math.max(minItems, d.length); i < l; i += 1) {
                opts.cache = copy(cache);
                const options = { ...opts, disableRecusionLimit: true };
                const result = node.itemsObject.getTemplate(d[i] == null ? template[i] : d[i], options);
                // @attention if getTemplate aborts recursion it currently returns undefined)
                if (result === undefined) {
                    return d;
                } else {
                    d[i] = result;
                }
            }
        }

        return d;
    }
};

function getDefault({ schema }: SchemaNode, templateValue: any, initValue: any) {
    if (templateValue !== undefined) {
        return convertValue(schema.type, templateValue);
    } else if (schema.const) {
        return schema.const;
    } else if (schema.default === undefined && Array.isArray(schema.enum)) {
        return schema.enum[0];
    } else if (schema.default === undefined) {
        return initValue;
    }
    return schema.default;
}
