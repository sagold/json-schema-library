import { strict as assert } from "assert";
import { Draft } from "../lib/draft";
import { mergeSchema } from "../lib/mergeSchema";
import { JsonError, JsonSchema } from "../lib/types";
import { SchemaNode, JsonSchemaReducerParams, JsonSchemaValidatorParams } from "./compiler/types";
import { reduceAllOf, reduceIf } from "./compiler/reducer";
import { propertyResolver, additionalPropertyResolver, getValue } from "./compiler/resolver";
import { isObject } from "../lib/utils/isObject";
import { omit } from "../lib/utils/omit";
import resolveRef, { compileRef } from "./ref";

const NODE_METHODS: Pick<SchemaNode, "get" | "getTemplate" | "reduce" | "toJSON" | "compileSchema" | "validate"> = {
    compileSchema,

    get(key: string | number, data?: unknown) {
        let node = this as SchemaNode;
        if (node.reducers.length) {
            node = node.reduce({ data });
        }

        for (const resolver of node.resolvers) {
            const schemaNode = resolver({ data, key, node });
            if (schemaNode) {
                return schemaNode;
            }
        }
    },

    getTemplate(data?: unknown) {
        const node = this as SchemaNode;
        let defaultData = data;
        for (const getDefaultData of node.getDefaultData) {
            defaultData = getDefaultData({ data: defaultData, node }) ?? defaultData;
        }
        return defaultData;
    },

    /*
        node
            - schema
            - resolver
        > resolver
            > schemaNode (containing partial schema)
        > merge all schema with source schema
        > compile schema (again) with partialy schema
    */
    reduce({ data }: JsonSchemaReducerParams) {
        // @path
        const node = { ...(this as SchemaNode) };
        node.schema = resolveRef(node) ?? node.schema;
        const reducers = node.reducers;

        let schema;
        for (let i = 0; i < reducers.length; i += 1) {
            const result = reducers[i]({ data, node });
            if (result) {
                // compilation result for data of current schema
                // in order to merge results, we rebuild node from schema
                // alternatively we would need to merge by node-property
                schema = mergeSchema(schema ?? {}, result.schema);
            }
        }

        if (schema) {
            // recompile to update newly added schema defintions
            schema = mergeSchema(node.schema, schema, "if", "then", "else", "allOf");
            // console.log("reduced schema", schema);
            return compileSchema(this.draft, schema, this.spointer, node);
        }

        // remove dynamic properties of node
        return { ...node, schema: omit(node.schema, "if", "then", "else", "allOf"), reducers: [] };
    },

    validate(data: unknown) {
        const node = this as SchemaNode;
        const errors = [];
        for (const validate of node.validators) {
            const result = validate({ node, data, pointer: "#" });
            if (Array.isArray(result)) {
                errors.push(...result);
            } else if (result) {
                errors.push(result);
            }
        }
        return errors;
    },

    toJSON() {
        return {
            ...this,
            draft: undefined
        };
    }
};

const PARSER: ((node: SchemaNode) => void)[] = [
    function parseIfThenElse(node) {
        const { draft, schema, spointer } = node;
        if (schema.if && (schema.then || schema.else)) {
            node.if = compileSchema(draft, schema.if, `${spointer}/if`, node);
            node.then = schema.then ? compileSchema(draft, schema.then, `${spointer}/then`, node) : undefined;
            node.else = schema.else ? compileSchema(draft, schema.else, `${spointer}/else`, node) : undefined;
            node.reducers.push(reduceIf);
        }
    },
    function parseAllOf(node) {
        const { draft, schema, spointer } = node;
        if (Array.isArray(schema.allOf) && schema.allOf.length) {
            // @todo immediately compile if no resolvers are added
            node.allOf = schema.allOf.map((s, index) => compileSchema(draft, s, `${spointer}/allOf/${index}`, node));
            node.reducers.push(reduceAllOf);
        }
    },
    function parseProperties(node) {
        const { draft, schema, spointer } = node;
        if (schema.properties) {
            node.properties = {};
            Object.keys(schema.properties).forEach((propertyName) => {
                const propertyNode = compileSchema(
                    draft,
                    schema.properties[propertyName],
                    `${spointer}/properties/${propertyName}`,
                    node
                );
                node.properties[propertyName] = propertyNode;
            });
            node.resolvers.push(propertyResolver);
        }
    },
    // must come as last resolver
    function parseAdditionalProperties(node) {
        const { draft, schema, spointer } = node;
        if (schema.additionalProperties !== false) {
            if (isObject(schema.additionalProperties)) {
                node.additionalProperties = compileSchema(
                    draft,
                    schema.additionalProperties,
                    `${spointer}/additionalProperties`,
                    node
                );
            }
            node.resolvers.push(additionalPropertyResolver);
        }
    }
];

const VALIDATORS: ((node: SchemaNode) => void)[] = [
    function validateProperties(node) {
        if (node.properties) {
            // note: this expects PARSER to have compiled properties
            node.validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
                // move validation through properties
                const errors: JsonError[] = [];
                Object.keys(node.properties).forEach((propertyName) => {
                    const propertyNode = node.properties[propertyName];
                    const result = propertyNode.validate(getValue(data, propertyName), `${pointer}/${propertyName}`);
                    if (Array.isArray(result)) {
                        errors.push(...result);
                    } else if (result) {
                        errors.push(result);
                    }
                });
                return errors;
            });
        }
    },

    function validateMaxProperties(node) {
        const { schema, draft } = node;
        if (!isNaN(schema.maxProperties)) {
            node.validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
                const { schema } = node;
                const propertyCount = Object.keys(data).length;
                if (isNaN(schema.maxProperties) === false && schema.maxProperties < propertyCount) {
                    return draft.errors.maxPropertiesError({
                        maxProperties: schema.maxProperties,
                        length: propertyCount,
                        pointer,
                        schema,
                        value: data
                    });
                }
            });
        }
    }
];

const DEFAULT_DATA: ((node: SchemaNode) => void)[] = [
    function getObjectData(node) {
        if (node.schema.type === "object") {
            node.getDefaultData.push(({ data, node }) => {
                const templateData: Record<string, any> = node.schema.default ?? data ?? {};
                if (node.properties) {
                    Object.keys(node.properties).forEach((propertyName) => {
                        templateData[propertyName] = node.properties[propertyName].getTemplate(
                            getValue(templateData, propertyName)
                        );
                    });
                }
                return templateData;
            });
        }
    },
    function getStringData(node) {
        if (node.schema.type === "string") {
            node.getDefaultData.push(({ data, node }) => {
                return node.schema.default ?? data;
            });
        }
    }
];

/**
 * @todo How can we do more work upfront?
 *
 * With compileSchema we replace the schema and all sub-schemas with a schemaNode,
 * wrapping each schema with utilities and as much preevaluation is possible. Each
 * node will be reused for each task, but will create a compiledNode for bound data.
 */
export function compileSchema(draft: Draft, schema: JsonSchema, spointer = "#", parentNode?: SchemaNode) {
    // console.log("compile schema", spointer);
    assert(schema !== undefined, "schema missing");
    const node: SchemaNode = {
        parent: parentNode,
        context: parentNode?.context ?? { ids: {}, remotes: {}, anchors: {}, scopes: {}, rootSchema: schema },
        spointer,
        draft,
        reducers: [],
        resolvers: [],
        validators: [],
        getDefaultData: [],
        schema,
        ...NODE_METHODS
    };

    compileRef(node);

    PARSER.forEach((parse) => parse(node));
    VALIDATORS.forEach((registerValidator) => registerValidator(node));
    DEFAULT_DATA.forEach((registerGetDefaultData) => registerGetDefaultData(node));

    return node;
}
