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
        const { draft, schema } = node;
        // if not in properties, evaluated by additionalProperties and not matches patternProperties
        // @todo we need to know dynamic parent statements - they should not be counted as evaluated...
        if (!isObject(data)) {
            return undefined;
        }
        let unevaluated = Object.keys(data);
        if (unevaluated.length === 0) {
            return undefined;
        }

        // @note: we do not iterate over reduced schema, so doing this within validate is ok
        // @todo resolvedNode is not required here: spec test with nested unevaluatedProperties in allOf
        // is true, basically evaluating all nodes @see "unevaluatedProperties with nested unevaluatedProperties"
        const resolvedNode = node.reduce({ data, pointer });
        if (isJsonError(resolvedNode)) {
            return resolvedNode;
        }
        if (resolvedNode.schema.unevaluatedProperties === true) {
            return undefined;
        }

        const resolvedSchema = resolvedNode.schema;
        unevaluated = unevaluated.filter((key) => {
            if (resolvedSchema.properties?.[key]) {
                return false;
            }
            // special case: an evaluation in if statement counts too
            // we have an unevaluated prop only if the if-schema does not match
            if (node.if && isPropertyEvaluated(node.if, key, getValue(data, key))) {
                return false;
            }
            // patternProperties already checked by resolved node
            // @todo is this evaluated by additionaProperties per property
            if (resolvedSchema.additionalProperties) {
                return false;
            }
            return true;
        });

        if (unevaluated.length === 0) {
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
            return errors;
        }

        unevaluated.forEach((key) => {
            if (isObject(node.unevaluatedProperties)) {
                // note: only key changes
                const keyErrors = node.unevaluatedProperties.validate(getValue(data, key));
                errors.push(...keyErrors);
            }
        });

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
}
