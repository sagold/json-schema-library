import { SchemaNode } from "./types";
import { reduceAllOf, reduceIf } from "./reducer";
import { propertyResolver, additionalPropertyResolver, itemsObjectResolver, itemsListResolver } from "./resolver";
import { isObject } from "../../lib/utils/isObject";

export const PARSER: ((node: SchemaNode) => void)[] = [
    function parseIfThenElse(node) {
        const { draft, schema, spointer } = node;
        if (schema.if && (schema.then || schema.else)) {
            node.if = node.compileSchema(draft, schema.if, `${spointer}/if`, node);
            node.then = schema.then ? node.compileSchema(draft, schema.then, `${spointer}/then`, node) : undefined;
            node.else = schema.else ? node.compileSchema(draft, schema.else, `${spointer}/else`, node) : undefined;
            node.reducers.push(reduceIf);
        }
    },
    function parseAllOf(node) {
        const { draft, schema, spointer } = node;
        if (Array.isArray(schema.allOf) && schema.allOf.length) {
            // @todo immediately compile if no resolvers are added
            node.allOf = schema.allOf.map((s, index) =>
                node.compileSchema(draft, s, `${spointer}/allOf/${index}`, node)
            );
            node.reducers.push(reduceAllOf);
        }
    },
    function parseProperties(node) {
        const { draft, schema, spointer } = node;
        if (schema.properties) {
            node.properties = {};
            Object.keys(schema.properties).forEach((propertyName) => {
                const propertyNode = node.compileSchema(
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
    function parseItems(node) {
        const { draft, schema, spointer } = node;
        if (isObject(schema.items)) {
            const propertyNode = node.compileSchema(draft, schema.items, `${spointer}/items`, node);
            node.itemsObject = propertyNode;
            node.resolvers.push(itemsObjectResolver);
        } else if (Array.isArray(schema.items)) {
            node.itemsList = schema.items.map((itemSchema, index) =>
                node.compileSchema(draft, itemSchema, `${spointer}/items/${index}`, node)
            );
            node.resolvers.push(itemsListResolver);
        }
    },
    // must come as last resolver
    function parseAdditionalProperties(node) {
        const { draft, schema, spointer } = node;
        if (schema.additionalProperties !== false) {
            if (isObject(schema.additionalProperties)) {
                node.additionalProperties = node.compileSchema(
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
