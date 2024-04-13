/**
 * @draft 06, 2019-09
 */
import { JsonSchema, JsonError } from "../types";
import getTypeOf from "../getTypeOf";
import { mergeSchema } from "../mergeSchema";
import { uniqueItems } from "../utils/uniqueItems";
import { isObject } from "../utils/isObject";
import { JsonValidator } from "../validation/type";
import { SchemaNode } from "../schemaNode";

/**
 * @todo add support for dependentRequired (draft 2019-09)
 * returns dependencies as an object json schema. does not merge with input
 * json schema. you probably will need to do so to correctly resolve
 * references.
 *
 * @returns merged json schema defined by dependencies or undefined
 */
export function resolveDependencies(node: SchemaNode, data: unknown): JsonSchema | undefined {
    const { schema } = node;
    // @draft >= 2019-09 dependentSchemas
    const dependencies = schema.dependencies ?? schema.dependentSchemas;
    if (!isObject(dependencies) || !isObject(data)) {
        return;
    }
    let updated = false;
    let resolvedSchema: JsonSchema = { required: [] };
    Object.keys(dependencies).forEach((prop) => {
        if (
            data[prop] == null &&
            !(schema.required?.includes(prop) || resolvedSchema.required?.includes(prop))
        ) {
            return;
        }

        const dependency = dependencies[prop];
        // dependency array
        if (Array.isArray(dependency)) {
            updated = true;
            resolvedSchema.required.push(...dependency);
            return;
        }

        // dependency schema
        if (isObject(dependency)) {
            updated = true;
            const dNode = node.next(dependency).resolveRef();
            resolvedSchema = mergeSchema(resolvedSchema, dNode.schema);
            return;
        }
    });
    if (updated) {
        resolvedSchema.required = uniqueItems(resolvedSchema.required);
        return resolvedSchema;
    }
}

/**
 * @draft 2019-09
 */
export const validateDependentRequired: JsonValidator = (node, value: Record<string, unknown>) => {
    const { draft, schema, pointer } = node;
    const dependentRequired = schema.dependentRequired;
    if (!isObject(dependentRequired)) {
        return undefined;
    }
    const errors: JsonError[] = [];
    Object.keys(value).forEach((property) => {
        const dependencies = dependentRequired[property];
        // @draft >= 6 boolean schema
        if (dependencies === true) {
            return;
        }
        if (dependencies === false) {
            errors.push(draft.errors.missingDependencyError({ pointer, schema, value }));
            return;
        }
        if (!Array.isArray(dependencies)) {
            return;
        }
        for (let i = 0, l = dependencies.length; i < l; i += 1) {
            if (value[dependencies[i]] === undefined) {
                errors.push(draft.errors.missingDependencyError({ missingProperty: dependencies[i], pointer, schema, value }));
            }
        }
    });
    return errors;
};

/**
 * @draft 2019-09
 */
export const validateDependentSchemas: JsonValidator = (node, value: Record<string, unknown>) => {
    const { draft, schema, pointer } = node;
    const dependentSchemas = schema.dependentSchemas;
    if (!isObject(dependentSchemas)) {
        return undefined;
    }
    const errors: JsonError[] = [];
    Object.keys(value).forEach((property) => {
        const dependencies = dependentSchemas[property];
        // @draft >= 6 boolean schema
        if (dependencies === true) {
            return;
        }
        if (dependencies === false) {
            errors.push(draft.errors.missingDependencyError({ pointer, schema, value }));
            return;
        }
        if (!isObject(dependencies)) {
            return;
        }

        draft.validate(node.next(dependencies), value).map(error => errors.push(error));
    });
    return errors;
};

/**
 * validate dependencies definition for given input data
 */
export const validateDependencies: JsonValidator = (node, value: Record<string, unknown>) => {
    const { draft, schema, pointer } = node;
    // @draft >= 2019-09 dependentSchemas
    const dependencies = schema.dependencies;
    if (!isObject(dependencies)) {
        return undefined;
    }

    const errors: JsonError[] = [];
    Object.keys(value).forEach((property) => {
        if (dependencies[property] === undefined) {
            return;
        }
        // @draft >= 6 boolean schema
        if (dependencies[property] === true) {
            return;
        }
        if (dependencies[property] === false) {
            errors.push(draft.errors.missingDependencyError({ pointer, schema, value }));
            return;
        }
        let dependencyErrors;
        const type = getTypeOf(dependencies[property]);
        const propertyValue = dependencies[property];
        if (Array.isArray(propertyValue)) {
            dependencyErrors = propertyValue
                .filter((dependency: any) => value[dependency] === undefined)
                .map((missingProperty: any) =>
                    draft.errors.missingDependencyError({ missingProperty, pointer, schema, value })
                );
        } else if (type === "object") {
            dependencyErrors = draft.validate(node.next(dependencies[property]), value);

        } else {
            throw new Error(
                `Invalid dependency definition for ${pointer}/${property}. Must be string[] or schema`
            );
        }

        errors.push(...dependencyErrors);
    });

    return errors.length > 0 ? errors : undefined;
};
