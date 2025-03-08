import { isJsonError, JsonError } from "../../lib/types";
import { isObject } from "../../lib/utils/isObject";
import { JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";
import { getValue } from "../utils/getValue";

export function parseUnevaluatedProperties(node: SchemaNode) {
    if (!isObject(node.schema.unevaluatedProperties)) {
        return;
    }
    node.unevaluatedProperties = node.compileSchema(
        node.schema.unevaluatedProperties,
        `${node.schema.unevaluatedProperties}/unevaluatedProperties`
    );
}

export function unevaluatedPropertiesValidator({ schema, validators }: SchemaNode): void {
    if (schema.unevaluatedProperties == null) {
        return;
    }
    validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
        console.log("validate unevaluatedProperties");
        const { draft, schema } = node;
        // if not in properties, evaluated by additionalProperties and not matches patternProperties
        // @todo we need to know dynamic parent statements - they should not be counted as evaluated...
        if (!isObject(data)) {
            console.log("invalid data or unevaluated = true");
            return undefined;
        }
        let unevaluated = Object.keys(data);
        if (unevaluated.length === 0) {
            console.log("no data to evaluate");
            return undefined;
        }

        // @note: we do not iterate over reduced schema, so doing this within validate is ok
        const resolvedNode = node.reduce({ data, pointer });
        if (isJsonError(resolvedNode)) {
            console.log("error resolved node", resolvedNode);
            return resolvedNode;
        }
        if (resolvedNode.schema.unevaluatedProperties === true) {
            return undefined;
        }

        const resolvedSchema = resolvedNode.schema;
        console.log("resolved schema", resolvedSchema);
        unevaluated = unevaluated.filter((key) => {
            if (resolvedSchema.properties?.[key]) {
                return false;
            }
            // special case: an evaluation in if statement counts too
            // we have an unevaluated prop only if the if-schema does not match
            if (node.if && isPropertyEvaluated(node.if, key, getValue(data, key))) {
                return false;
            }
            // already checked by resolved node
            // if (testPatterns.find(({ pattern }) => pattern.test(key))) {
            //     return false;
            // }
            // @todo is this evaluated by additionaProperties per property
            if (resolvedSchema.additionalProperties) {
                return false;
            }
            return true;
        });

        if (unevaluated.length === 0) {
            console.log("no unevaluated propertes");
            return undefined;
        }

        const errors: JsonError[] = [];
        if (resolvedSchema.unevaluatedProperties === false) {
            unevaluated.forEach((key) => {
                errors.push(
                    draft.errors.unevaluatedPropertyError({
                        pointer: `${pointer}/${key}`,
                        value: JSON.stringify(data[key]),
                        schema
                    })
                );
            });
            console.log("unevaluiated = false return errors");
            return errors;
        }

        unevaluated.forEach((key) => {
            if (isObject(node.unevaluatedProperties)) {
                // note: only key changes
                const keyErrors = node.unevaluatedProperties.validate(getValue(data, key));
                console.log("test unevaluated property", key, keyErrors);
                errors.push(...keyErrors);
            } else {
                console.log("node.unevaluatedProperties is not an object", node.unevaluatedProperties);
            }
        });

        console.log("done, return errors", unevaluated, errors);
        return errors;
    });
}

/** tests if a property is evaluated by the given schema */
function isPropertyEvaluated(schemaNode: SchemaNode, propertyName: string, value: unknown) {
    const node = schemaNode.get(propertyName);
    if (node == null || isJsonError(node)) {
        return false;
    }
    return node.validate(value).length === 0;

    // const node = schemaNode.resolveRef();
    // const { schema } = node;
    // if (schema.additionalProperties === true) {
    //     return true;
    // }
    // // PROPERTIES
    // if (schema.properties?.[propertyName]) {
    //     const nextSchema = schema.properties?.[propertyName];
    //     if (node.draft.isValid(value, nextSchema)) {
    //         return true;
    //     }
    // }
    // // PATTERN-PROPERTIES
    // const patterns = node.patternProperties ?? [];
    // if (patterns.find(({ pattern }) => pattern.test(propertyName))) {
    //     return true;
    // }
    // // ADDITIONAL-PROPERTIES
    // if (isObject(schema.additionalProperties)) {
    //     const nextSchema = schema.additionalProperties;
    //     return node.draft.validate(node.next(nextSchema), value);
    // }
    // return false;
}
