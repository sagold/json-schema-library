/**
 * @draft-06
 */
import { JsonSchema, JsonValidator, JsonError } from "../types";
import getTypeOf from "../getTypeOf";
import { Draft } from "../draft";
import { mergeSchema } from "../mergeSchema";
import { uniqueItems } from "../utils/uniqueItems";
import { isObject } from "../utils/isObject";

/**
 * returns dependencies as an object json schema. does not merge with input
 * json schema. you probably will need to do so to correctly resolve
 * references.
 *
 * @returns merged json schema defined by dependencies or undefined
 */
export function resolveDependencies(
    draft: Draft,
    schema: JsonSchema,
    data: unknown
): JsonSchema | undefined {
    const { dependencies } = schema;
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
            resolvedSchema = mergeSchema(resolvedSchema, draft.resolveRef(dependency));
            return;
        }
    });
    if (updated) {
        resolvedSchema.required = uniqueItems(resolvedSchema.required);
        return resolvedSchema;
    }
}

/**
 * validate dependencies definition for given input data
 */
const validateDependencies: JsonValidator = (
    draft,
    schema,
    value: Record<string, unknown>,
    pointer
) => {
    if (getTypeOf(schema.dependencies) !== "object") {
        return undefined;
    }

    const errors: JsonError[] = [];
    Object.keys(value).forEach((property) => {
        if (schema.dependencies[property] === undefined) {
            return;
        }

        // @draft >= 6 boolean schema
        if (schema.dependencies[property] === true) {
            return;
        }
        if (schema.dependencies[property] === false) {
            errors.push(draft.errors.missingDependencyError({ pointer, schema, value }));
            return;
        }

        let dependencyErrors;
        const type = getTypeOf(schema.dependencies[property]);
        if (type === "array") {
            dependencyErrors = schema.dependencies[property]
                .filter((dependency: any) => value[dependency] === undefined)
                .map((missingProperty: any) =>
                    draft.errors.missingDependencyError({ missingProperty, pointer, schema, value })
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
