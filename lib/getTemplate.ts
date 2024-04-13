/* eslint quote-props: 0, max-statements-per-line: ["error", { "max": 2 }] */
import { resolveOneOfFuzzy } from "./features/oneOf";
import getTypeOf from "./getTypeOf";
import merge from "./utils/merge";
import copy from "./utils/copy";
import settings from "./config/settings";
import { JsonSchema, JsonPointer, isJsonError } from "./types";
import { isSchemaNode } from "./schemaNode";
import { Draft } from "./draft";
import { isEmpty } from "./utils/isEmpty";
import { resolveIfSchema } from "./features/if";
import { mergeAllOfSchema, resolveSchema } from "./features/allOf";
import { resolveDependencies } from "./features/dependencies";
import { mergeSchema } from "./mergeSchema";

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
};

const defaultOptions: TemplateOptions = settings.templateDefaultOptions;

let cache: Record<string, JsonSchema>;
function shouldResolveRef(schema: JsonSchema, pointer: JsonPointer) {
    const { $ref } = schema;
    if ($ref == null) {
        return true;
    }
    const value = cache[pointer] == null || cache[pointer][$ref] == null ? 0 : cache[pointer][$ref];
    return value < settings.GET_TEMPLATE_RECURSION_LIMIT;
}

function resolveRef(draft: Draft, schema: JsonSchema, pointer: JsonPointer) {
    const { $ref } = schema;
    if ($ref == null) {
        return schema;
    }
    // @todo pointer + ref is redundant?
    cache[pointer] = cache[pointer] || {};
    cache[pointer][$ref] = cache[pointer][$ref] || 0;
    cache[pointer][$ref] += 1;
    return draft.createNode(schema, pointer).resolveRef().schema;
}

function convertValue(type: string, value: any) {
    if (type === "string") {
        return JSON.stringify(value);
    } else if (typeof value !== "string") {
        return null;
    }
    try {
        value = JSON.parse(value);
        if (typeof value === type) {
            return value;
        }
    } catch (e) {} // eslint-disable-line no-empty
    return null;
}

/**
 * Resolves $ref, allOf and anyOf schema-options, returning a combined json-schema.
 * Also returns a pointer-property on schema, that must be used as current pointer.
 *
 * @param draft
 * @param schema
 * @param data
 * @param pointer
 * @return resolved json-schema or input-schema
 */
function createTemplateSchema(
    draft: Draft,
    schema: JsonSchema,
    data: unknown,
    pointer: JsonPointer,
    opts: TemplateOptions
): JsonSchema | false {
    // invalid schema
    if (getTypeOf(schema) !== "object") {
        return Object.assign({ pointer }, schema);
    }
    // return if reached recursion limit
    if (shouldResolveRef(schema, pointer) === false && data == null) {
        return false;
    }

    // resolve $ref and copy schema
    let templateSchema = copy(resolveRef(draft, schema, pointer));

    // @feature anyOf
    if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
        // test if we may resolve
        if (shouldResolveRef(schema.anyOf[0], `${pointer}/anyOf/0`)) {
            const resolvedAnyOf = resolveRef(draft, schema.anyOf[0], `${pointer}/anyOf/0`);
            templateSchema = merge(templateSchema, resolvedAnyOf);
            // add pointer return-value, if any
            templateSchema.pointer = schema.anyOf[0].$ref || templateSchema.pointer;
        }
        delete templateSchema.anyOf;
    }

    // @feature allOf
    if (Array.isArray(schema.allOf)) {
        const mayResolve = schema.allOf
            .map((allOf, index) => shouldResolveRef(allOf, `${pointer}/allOf/${index}`))
            .reduceRight((next, before) => next && before, true);

        if (mayResolve) {
            // before merging all-of, we need to resolve all if-then-else statesments
            // we need to udpate data on the way to trigger if-then-else schemas sequentially.
            // Note that this will make if-then-else order-dependent
            const allOf: JsonSchema[] = [];
            let extendedData = copy(data);
            for (let i = 0; i < schema.allOf.length; i += 1) {
                const allNode = draft.createNode(schema.allOf[i], pointer);
                allOf.push(resolveSchema(allNode, extendedData).schema);
                extendedData = getTemplate(draft, extendedData, { type: schema.type, ...allOf[i] }, `${pointer}/allOf/${i}`, opts);
            }

            const resolvedSchema = mergeAllOfSchema(draft, { allOf });
            if (resolvedSchema) {
                templateSchema = mergeSchema(templateSchema, resolvedSchema);
            }
        }
    }

    templateSchema.pointer = templateSchema.pointer || schema.$ref || pointer;
    return templateSchema;
}

const isJsonSchema = (template: unknown): template is JsonSchema =>
    template && typeof template === "object";

/**
 * Create data object matching the given schema
 *
 * @param draft - json schema draft
 * @param [data] - optional template data
 * @param [schema] - json schema, defaults to rootSchema
 * @return created template data
 */
function getTemplate(
    draft: Draft,
    data?: unknown,
    _schema?: JsonSchema,
    pointer?: JsonPointer,
    opts?: TemplateOptions
) {
    if (_schema == null) {
        throw new Error(`getTemplate: missing schema for data: ${JSON.stringify(data)}`);
    }
    if (pointer == null) {
        throw new Error("Missing pointer");
    }

    // resolve $ref references, allOf and first anyOf definitions
    let schema = createTemplateSchema(draft, _schema, data, pointer, opts);
    if (!isJsonSchema(schema)) {
        return undefined;
    }
    pointer = schema.pointer;

    if (schema?.const) {
        return schema.const;
    }

    // @feature oneOf
    if (Array.isArray(schema.oneOf)) {
        if (isEmpty(data)) {
            const type =
                schema.oneOf[0].type ||
                schema.type ||
                (schema.const && typeof schema.const) ||
                getTypeOf(data);
            schema = { ...schema.oneOf[0], type };
        } else {
            // find correct schema for data
            const oneNode = draft.createNode(schema, pointer);
            const resolvedNode = resolveOneOfFuzzy(oneNode, data);
            if (isJsonError(resolvedNode)) {
                if (data != null && opts.removeInvalidData !== true) {
                    return data;
                }
                // override
                schema = schema.oneOf[0];
                data = undefined;
            } else {
                const resolvedSchema = resolvedNode.schema;
                resolvedSchema.type = resolvedSchema.type ?? schema.type;
                schema = resolvedSchema;
            }
        }
    }

    // @todo Array.isArray(schema.type)
    // -> hasDefault? return
    // if not -> pick first types
    if (!isJsonSchema(schema) || schema.type == null) {
        return undefined;
    }

    // @attention - very special case to support file instances
    if (data instanceof File) {
        return data;
    }

    const type = Array.isArray(schema.type)
        ? selectType(schema.type, data, schema.default)
        : schema.type;

    // reset invalid type
    const javascriptTypeOfData = getTypeOf(data);


    if (
        data != null &&
        javascriptTypeOfData !== type &&
        !(javascriptTypeOfData === "number" && type === "integer")
    ) {
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

    const templateData = TYPE[type](draft, schema, data, pointer, opts);
    return templateData;
}

function selectType(types: string[], data: unknown, defaultValue: unknown) {
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

const TYPE: Record<
    string,
    (
        draft: Draft,
        schema: JsonSchema,
        data: unknown,
        pointer: JsonPointer,
        opts: TemplateOptions
    ) => unknown
> = {
    null: (draft, schema, data) => getDefault(schema, data, null),
    string: (draft, schema, data) => getDefault(schema, data, ""),
    number: (draft, schema, data) => getDefault(schema, data, 0),
    integer: (draft, schema, data) => getDefault(schema, data, 0),
    boolean: (draft, schema, data) => getDefault(schema, data, false),
    object: (
        draft,
        schema,
        data: Record<string, unknown> | undefined,
        pointer: JsonPointer,
        opts: TemplateOptions
    ) => {
        const template = schema.default === undefined ? {} : schema.default;
        const d: Record<string, unknown> = {}; // do not assign data here, to keep ordering from json-schema
        const required = (opts.extendDefaults === false && schema.default !== undefined) ? [] : (schema.required ?? []);

        if (schema.properties) {
            Object.keys(schema.properties).forEach((key) => {
                const value = data == null || data[key] == null ? template[key] : data[key];
                const isRequired = required.includes(key);

                // Omit adding a property if it is not required or optional props should be added
                if (value != null || isRequired || opts.addOptionalProps) {
                    d[key] = getTemplate(
                        draft,
                        value,
                        schema.properties[key],
                        `${pointer}/properties/${key}`,
                        opts
                    );
                }
            });
        }

        // @feature dependencies
        // has to be done after resolving properties so dependency may trigger
        const dNode = draft.createNode(schema, pointer);
        let dependenciesSchema = resolveDependencies(dNode, d);
        if (dependenciesSchema) {
            dependenciesSchema = mergeSchema(schema, dependenciesSchema);
            delete dependenciesSchema.dependencies;
            const dependencyData = getTemplate(
                draft,
                data,
                dependenciesSchema,
                `${pointer}/dependencies`,
                opts
            );
            Object.assign(d, dependencyData);
        }

        if (data) {
            if (
                opts.removeInvalidData === true &&
                (schema.additionalProperties === false ||
                    getTypeOf(schema.additionalProperties) === "object")
            ) {
                if (getTypeOf(schema.additionalProperties) === "object") {
                    Object.keys(data).forEach((key) => {
                        if (d[key] == null) {
                            // merge valid missing data (additionals) to resulting object
                            if (draft.isValid(data[key], schema.additionalProperties)) {
                                d[key] = data[key];
                            }
                        }
                    });
                }
            } else {
                // merge any missing data (additionals) to resulting object
                Object.keys(data).forEach((key) => d[key] == null && (d[key] = data[key]));
            }
        }

        // @feature if-then-else
        const node = draft.createNode(schema, pointer);
        const ifSchema = resolveIfSchema(node, d);
        if (isSchemaNode(ifSchema)) {
            const additionalData = getTemplate(
                draft,
                d,
                { type: "object", ...ifSchema.schema },
                pointer,
                opts
            );
            Object.assign(d, additionalData);
        }

        // returns object, which is ordered by json-schema
        return d;
    },
    // build array type of items, ignores additionalItems
    array: (
        draft: Draft,
        schema: JsonSchema,
        data: unknown[],
        pointer: JsonPointer,
        opts: TemplateOptions
    ) => {
        if (schema.items == null) {
            return data || []; // items are undefined
        }

        const template = schema.default === undefined ? [] : schema.default;
        const d: unknown[] = data || template;
        const minItems = (opts.extendDefaults === false && schema.default !== undefined) ? 0 : (schema.minItems || 0);

        // build defined set of items
        if (Array.isArray(schema.items)) {
            for (let i = 0, l = Math.max(minItems ?? 0, schema.items?.length ?? 0); i < l; i += 1) {
                d[i] = getTemplate(
                    draft,
                    d[i] == null ? template[i] : d[i],
                    schema.items[i],
                    `${pointer}/items/${i}`,
                    opts
                );
            }
            return d;
        }

        // abort if the schema is invalid
        if (getTypeOf(schema.items) !== "object") {
            return d;
        }

        // resolve allOf and first anyOf definition
        const templateSchema = createTemplateSchema(draft, schema.items, data, pointer, opts);
        if (templateSchema === false) {
            return d;
        }
        pointer = templateSchema.pointer || pointer;

        // build data for first oneOf-schema
        if (templateSchema.oneOf && d.length === 0) {
            const oneOfSchema = templateSchema.oneOf[0];
            for (let i = 0; i < minItems; i += 1) {
                d[i] = getTemplate(
                    draft,
                    d[i] == null ? template[i] : d[i],
                    oneOfSchema,
                    `${pointer}/oneOf/0`,
                    opts
                );
            }
            return d;
        }

        // complete data selecting correct oneOf-schema
        if (templateSchema.oneOf && d.length > 0) {
            const itemCount = Math.max(minItems, d.length);
            for (let i = 0; i < itemCount; i += 1) {
                let value = d[i] == null ? template[i] : d[i];
                const oneNode = draft.createNode(templateSchema, pointer);
                let one = resolveOneOfFuzzy(oneNode, value);

                if (one == null || isJsonError(one)) {
                    // schema could not be resolved or data is invalid
                    if (value != null && opts.removeInvalidData !== true) {
                        // keep invalid value
                        d[i] = value;
                    } else {
                        // replace invalid value
                        value = undefined;
                        one = templateSchema.oneOf[0];
                        d[i] = getTemplate(draft, value, one, `${pointer}/oneOf/${i}`, opts);
                    }
                } else {
                    // schema is valid
                    d[i] = getTemplate(draft, value, one.schema, `${pointer}/oneOf/${i}`, opts);
                }
            }
            return d;
        }

        // build data from items-definition
        if (templateSchema.type) {
            for (let i = 0, l = Math.max(minItems, d.length); i < l; i += 1) {
                d[i] = getTemplate(
                    draft,
                    d[i] == null ? template[i] : d[i],
                    templateSchema,
                    `${pointer}/items`,
                    opts
                );
            }
            return d;
        }

        return d;
    }
};

function getDefault(schema: JsonSchema, templateValue: any, initValue: any) {
    if (templateValue != null) {
        return templateValue;
    } else if (schema.const) {
        return schema.const;
    } else if (schema.default === undefined && Array.isArray(schema.enum)) {
        return schema.enum[0];
    } else if (schema.default === undefined) {
        return initValue;
    }
    return schema.default;
}

export default (
    draft: Draft,
    data?: any,
    schema: JsonSchema = draft.rootSchema,
    opts?: TemplateOptions
) => {
    cache = {};
    if (opts) {
        return getTemplate(draft, data, schema, "#", { ...defaultOptions, ...opts });
    }
    return getTemplate(draft, data, schema, "#", defaultOptions);
};
