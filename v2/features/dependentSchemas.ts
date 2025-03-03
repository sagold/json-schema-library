import { JsonError } from "../../lib/types";
import { isObject } from "../../lib/utils/isObject";
import { isSchemaNode, JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";

export function dependentSchemasValidator(node: SchemaNode): void {
    if (!isObject(node.schema.dependentSchemas)) {
        return undefined;
    }

    const { dependentSchemas } = node.schema;
    node.dependentSchemas = {};
    Object.keys(dependentSchemas).forEach((property) => {
        const schema = dependentSchemas[property];
        if (isObject(schema)) {
            node.dependentSchemas[property] = node.compileSchema(
                schema,
                `${node.spointer}/dependentSchemas/${property}`
            );
        } else if (typeof schema === "boolean") {
            node.dependentSchemas[property] = schema;
        }
    });

    node.validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
        const { draft, schema, dependentSchemas } = node;
        if (!isObject(data)) {
            return undefined;
        }
        const errors: JsonError[] = [];
        Object.keys(data).forEach((property) => {
            const dependencies = dependentSchemas[property];
            // @draft >= 6 boolean schema
            if (dependencies === true) {
                return;
            }
            if (dependencies === false) {
                errors.push(draft.errors.missingDependencyError({ pointer, schema, value: data }));
                return;
            }
            if (isSchemaNode(dependencies)) {
                errors.push(...dependencies.validate(data, pointer));
                return;
            }
        });
        return errors;
    });
}
