/* draft-06 */
import { JSONSchema, JSONValidator, JSONError, isJSONError } from "../types";
import getTypeOf from "../getTypeOf";
import { Draft } from "../draft";
import { mergeSchema } from "../mergeSchema";
import { uniqueItems } from "../utils/uniqueItems";

function isObject(v: any): v is Record<string, unknown> {
    return getTypeOf(v) === "object";
}

/**
 * returns dependencies as an object json schema. does not merge with input
 * json schema. you probably will need to do so to correctly resolve
 * references.
 *
 * @returns merged json schema defined by dependencies or undefined
 */
export function resolveDependencies(
    draft: Draft,
    schema: JSONSchema,
    data: unknown
): JSONSchema | undefined {
    const { dependencies } = schema;
    if (!isObject(dependencies) || !isObject(data)) {
        return;
    }
    let updated = false;
    let resolvedSchema: JSONSchema = { type: "object", required: [] };
    Object.keys(dependencies).forEach((prop) => {
        if (data[prop] == null && !schema.required?.includes(prop)) {
            return;
        }
        const dependency = dependencies[prop];
        if (Array.isArray(dependency)) {
            updated = true;
            resolvedSchema.required.push(...dependency);
            return;
        }
        if (isObject(dependency)) {
            updated = true;
            resolvedSchema = mergeSchema(resolvedSchema, dependency);
            return;
        }
    });

    if (updated) {
        resolvedSchema.required = uniqueItems(resolvedSchema.required);
        delete resolvedSchema.dependencies;
    }

    return updated ? resolvedSchema : undefined;
}

/**
 * steps into dependencies
 * @returns json schema or undefined if 'key' is not defined
 */
export function stepIntoDependencies(
    draft: Draft,
    key: string,
    schema: JSONSchema,
    data: unknown,
    pointer: string
) {
    const { dependencies } = schema;
    if (getTypeOf(dependencies) === "object") {
        const dependentProperties = Object.keys(dependencies).filter(
            (propertyName) =>
                // data[propertyName] !== undefined &&
                getTypeOf(dependencies[propertyName]) === "object"
        );

        for (let i = 0, l = dependentProperties.length; i < l; i += 1) {
            const dependentProperty = dependentProperties[i];
            const schema = draft.step(
                key,
                dependencies[dependentProperty],
                data,
                `${pointer}/${dependentProperty}`
            );
            if (!isJSONError(schema)) {
                return schema;
            }
        }
    }
}

const validateDependencies: JSONValidator = (
    draft,
    schema,
    value: Record<string, unknown>,
    pointer
) => {
    if (getTypeOf(schema.dependencies) !== "object") {
        return undefined;
    }

    const errors: JSONError[] = [];
    Object.keys(value).forEach((property) => {
        if (schema.dependencies[property] === undefined) {
            return;
        }

        // @draft >= 6 boolean schema
        if (schema.dependencies[property] === true) {
            return;
        }
        if (schema.dependencies[property] === false) {
            errors.push(draft.errors.missingDependencyError({ pointer }));
            return;
        }

        let dependencyErrors;
        const type = getTypeOf(schema.dependencies[property]);
        if (type === "array") {
            dependencyErrors = schema.dependencies[property]
                .filter((dependency: any) => value[dependency] === undefined)
                .map((missingProperty: any) =>
                    draft.errors.missingDependencyError({ missingProperty, pointer })
                );
        } else if (type === "object") {
            dependencyErrors = draft.validate(value, schema.dependencies[property], pointer);
        } else {
            throw new Error(
                `Invalid dependency definition for ${pointer}/${property}. Must be string[] or schema`
            );
        }

        errors.push(...dependencyErrors);
    });

    return errors.length > 0 ? errors : undefined;
};

export { validateDependencies };
