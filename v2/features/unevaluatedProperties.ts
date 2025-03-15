import { isJsonError, JsonError } from "../../lib/types";
import { isObject } from "../../lib/utils/isObject";
import { isSchemaNode, JsonSchemaValidatorParams, SchemaNode } from "../types";
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
    validators.push(({ node, data, pointer, path }: JsonSchemaValidatorParams) => {
        // if not in properties, evaluated by additionalProperties and not matches patternProperties
        // @todo we need to know dynamic parent statements - they should not be counted as evaluated...
        if (!isObject(data) || node.schema.additionalProperties === true) {
            return undefined;
        }

        // this will break?
        let reducedNode = node.reduce({ data, pointer, path });
        if (isSchemaNode(reducedNode) && reducedNode.schema.additionalProperties === true) {
            return undefined;
        }
        reducedNode = isSchemaNode(reducedNode) ? reducedNode : node;
        // console.log("EVAL", reducedNode.schema);

        const unevaluated = Object.keys(data);
        if (unevaluated.length === 0) {
            return undefined;
        }

        const errors: JsonError[] = [];
        for (let i = 0; i < unevaluated.length; i += 1) {
            const propertyName = unevaluated[i];
            const child = node.get(propertyName, data, path);
            // console.log(`CHILD '${propertyName}':`, data[propertyName], "=>", child?.schema);
            if (isSchemaNode(child)) {
                if (child.validate(data[propertyName], `${pointer}/${propertyName}`, path).length > 0) {
                    errors.push(
                        node.errors.unevaluatedPropertyError({
                            pointer: `${pointer}/${propertyName}`,
                            value: JSON.stringify(data[propertyName]),
                            schema: node.schema
                        })
                    );
                    continue;
                }
            }

            if (child === undefined) {
                // console.log(propertyName, "is unevaluated", node.schema);
                if (node.if && isPropertyEvaluated(node.if, propertyName, data)) {
                    // skip
                } else if (reducedNode.unevaluatedProperties) {
                    const validationResult = node.unevaluatedProperties.validate(
                        data[propertyName],
                        `${pointer}/${propertyName}`,
                        path
                    );
                    errors.push(...validationResult);
                } else if (reducedNode.schema.unevaluatedProperties === false) {
                    errors.push(
                        node.errors.unevaluatedPropertyError({
                            pointer: `${pointer}/${propertyName}`,
                            value: JSON.stringify(data[propertyName]),
                            schema: node.schema
                        })
                    );
                }
            }
        }

        return errors;

        // @note: we do not iterate over reduced schema, so doing this within validate is ok
        // @todo resolvedNode is not required here: spec test with nested unevaluatedProperties in allOf
        // is true, basically evaluating all nodes @see "unevaluatedProperties with nested unevaluatedProperties"
        // const resolvedNode = node.reduce({ data, pointer });
        // if (isJsonError(resolvedNode)) {
        //     return resolvedNode;
        // }
        // if (resolvedNode.schema.unevaluatedProperties === true) {
        //     return undefined;
        // }

        // const resolvedSchema = resolvedNode.schema;
        // unevaluated = unevaluated.filter((key) => {
        //     if (resolvedSchema.properties?.[key]) {
        //         return false;
        //     }
        //     // special case: an evaluation in if statement counts too
        //     // we have an unevaluated prop only if the if-schema does not match
        //     if (node.if && isPropertyEvaluated(node.if, key, getValue(data, key))) {
        //         return false;
        //     }
        //     // patternProperties already checked by resolved node
        //     // @todo is this evaluated by additionaProperties per property
        //     if (resolvedSchema.additionalProperties) {
        //         return false;
        //     }
        //     return true;
        // });

        // if (unevaluated.length === 0) {
        //     return undefined;
        // }

        // const errors: JsonError[] = [];
        // if (resolvedSchema.unevaluatedProperties === false) {
        //     unevaluated.forEach((key) => {
        //         errors.push(
        //             node.errors.unevaluatedPropertyError({
        //                 pointer: `${pointer}/${key}`,
        //                 value: JSON.stringify(data[key]),
        //                 schema
        //             })
        //         );
        //     });
        //     return errors;
        // }

        // unevaluated.forEach((key) => {
        //     if (isObject(node.unevaluatedProperties)) {
        //         // note: only key changes
        //         const keyErrors = node.unevaluatedProperties.validate(getValue(data, key));
        //         errors.push(...keyErrors);
        //     }
        // });
        // return errors;
    });
}

/** tests if a property is evaluated by the given schema */
function isPropertyEvaluated(schemaNode: SchemaNode, propertyName: string, data: unknown) {
    const node = schemaNode.get(propertyName, data);
    if (node == null || isJsonError(node)) {
        return false;
    }
    return node.validate(getValue(data, propertyName)).length === 0;
}
