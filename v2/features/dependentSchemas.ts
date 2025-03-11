import { mergeSchema } from "../../lib/mergeSchema";
import { JsonError, JsonSchema } from "../../lib/types";
import { isObject } from "../../lib/utils/isObject";
import { isSchemaNode, JsonSchemaReducerParams, JsonSchemaValidatorParams, SchemaNode } from "../types";

export function parseDependentSchemas(node: SchemaNode) {
    if (!isObject(node.schema.dependentSchemas)) {
        return;
    }

    const { dependentSchemas } = node.schema;
    node.dependentSchemas = {};
    const schemas = Object.keys(dependentSchemas);
    schemas.forEach((property) => {
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

    if (schemas.length === 0) {
        return;
    }

    node.reducers.push(reduceDependentSchemas);
}

reduceDependentSchemas.toJSON = () => "reduceDependentSchemas";
export function reduceDependentSchemas({ node, data }: JsonSchemaReducerParams) {
    if (!isObject(data)) {
        // @todo remove dependentSchemas
        return node;
    }

    let mergedSchema: JsonSchema;
    const { dependentSchemas } = node;
    Object.keys(data).forEach((propertyName) => {
        if (dependentSchemas[propertyName] == null) {
            return;
        }
        mergedSchema = mergedSchema ?? { properties: {} };
        if (isSchemaNode(dependentSchemas[propertyName])) {
            mergedSchema = mergeSchema(mergedSchema, dependentSchemas[propertyName].schema);
        } else {
            mergedSchema.properties[propertyName] = dependentSchemas[propertyName];
        }
    });

    if (mergedSchema == null) {
        return node;
    }

    mergedSchema = mergeSchema(node.schema, mergedSchema, "dependentSchemas");
    return node.compileSchema(mergedSchema, node.spointer);
}

export function dependentSchemasValidator(node: SchemaNode): void {
    if (!isObject(node.dependentSchemas)) {
        return undefined;
    }

    node.validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
        const { schema, dependentSchemas } = node;
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
                errors.push(node.errors.missingDependencyError({ pointer, schema, value: data }));
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
