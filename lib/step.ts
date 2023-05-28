import getTypeOf from "./getTypeOf";
import createSchemaOf from "./createSchemaOf";
import errors from "./validation/errors";
import merge from "./utils/merge";
import { JSONSchema, JSONPointer, JSONError, isJSONError } from "./types";
import { Draft as Core } from "./draft";

const stepType = {
    array: (
        core: Core,
        key: string,
        schema: JSONSchema,
        data: any,
        pointer: JSONPointer
    ): JSONSchema | JSONError => {
        const itemsType = getTypeOf(schema.items);

        if (itemsType === "object") {
            // oneOf
            if (Array.isArray(schema.items.oneOf)) {
                return core.resolveOneOf(data[key], schema.items, pointer);
            }

            // anyOf
            if (Array.isArray(schema.items.anyOf)) {
                // schema of current object
                return core.resolveAnyOf(data[key], schema.items, pointer);
            }

            // allOf
            if (Array.isArray(schema.items.allOf)) {
                return core.resolveAllOf(data[key], schema.items, pointer);
            }

            // spec: ignore additionalItems, when items is schema-object
            return core.resolveRef(schema.items);
        }

        if (itemsType === "array") {
            // @draft >= 7 bool schema, items:[true, false]
            if (schema.items[key] === true) {
                return createSchemaOf(data[key]);
            }
            // @draft >= 7 bool schema, items:[true, false]
            if (schema.items[key] === false) {
                return errors.invalidDataError({
                    key,
                    value: data[key],
                    pointer
                });
            }

            if (schema.items[key]) {
                return core.resolveRef(schema.items[key]);
            }

            if (schema.additionalItems === false) {
                return errors.additionalItemsError({
                    key,
                    value: data[key],
                    pointer
                });
            }

            if (schema.additionalItems === true || schema.additionalItems === undefined) {
                return createSchemaOf(data[key]);
            }

            if (getTypeOf(schema.additionalItems) === "object") {
                return schema.additionalItems;
            }

            throw new Error(
                `Invalid schema ${JSON.stringify(schema, null, 4)} for ${JSON.stringify(
                    data,
                    null,
                    4
                )}`
            );
        }

        if (schema.additionalItems !== false && data[key]) {
            // @todo reevaluate: incomplete schema is created here
            // @todo support additionalItems: {schema}
            return createSchemaOf(data[key]);
        }

        return new Error(`Invalid array schema for ${key} at ${pointer}`) as JSONError;
    },

    object: (
        core: Core,
        key: string,
        schema: JSONSchema,
        data: any,
        pointer: JSONPointer
    ): JSONSchema | JSONError => {
        if (Array.isArray(schema.oneOf)) {
            // update current schema
            const oneOfSchema = core.resolveOneOf(data, schema, pointer);
            // resolveOneOf does currently not apply merge with base schema
            schema = merge(schema, oneOfSchema);
            if (isJSONError(schema)) {
                return schema;
            }
        }

        if (Array.isArray(schema.anyOf)) {
            // update current schema
            schema = core.resolveAnyOf(data, schema, pointer);
            if (isJSONError(schema)) {
                return schema;
            }
        }

        if (Array.isArray(schema.allOf)) {
            // update current schema
            schema = core.resolveAllOf(data, schema, pointer);
            if (isJSONError(schema)) {
                return schema;
            }
        }

        let targetSchema;

        // step into object-properties
        if (schema.properties && schema.properties[key] !== undefined) {
            // @todo patternProperties also validate properties

            targetSchema = core.resolveRef(schema.properties[key]);
            if (isJSONError(targetSchema)) {
                return targetSchema;
            }

            // check if there is a oneOf selection, which must be resolved
            if (targetSchema && Array.isArray(targetSchema.oneOf)) {
                // @special case: this is a mix of a schema and optional definitions
                // we resolve the schema here and add the original schema to `oneOfSchema`
                let resolvedSchema = core.resolveOneOf(
                    data[key],
                    targetSchema,
                    `${pointer}/${key}`
                );

                const oneOfIndex = targetSchema.oneOf.findIndex((s) => s === resolvedSchema);

                resolvedSchema.variableSchema = true;
                resolvedSchema.oneOfIndex = oneOfIndex;
                resolvedSchema.oneOfSchema = targetSchema;
                return resolvedSchema;
            }

            // resolved schema or error
            if (targetSchema) {
                return targetSchema;
            }
        }

        // @draft <= 07
        const { dependencies } = schema;
        if (getTypeOf(dependencies) === "object") {
            const dependentProperties = Object.keys(dependencies).filter(
                (propertyName) =>
                    // data[propertyName] !== undefined &&
                    getTypeOf(dependencies[propertyName]) === "object"
            );

            for (let i = 0, l = dependentProperties.length; i < l; i += 1) {
                const dependentProperty = dependentProperties[i];
                const schema = step(
                    core,
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

        // @draft >= 07
        if (schema.if && (schema.then || schema.else)) {
            // console.log("test if-then-else");
            const isValid = core.isValid(data, schema.if);
            if (isValid && schema.then) {
                const resolvedThen = step(core, key, schema.then, data, pointer);
                if (typeof resolvedThen.type === "string" && resolvedThen.type !== "error") {
                    return resolvedThen;
                }
            }
            if (!isValid && schema.else) {
                const resolvedElse = step(core, key, schema.else, data, pointer);
                if (typeof resolvedElse.type === "string" && resolvedElse.type !== "error") {
                    return resolvedElse;
                }
            }
        }

        // find matching property key
        if (getTypeOf(schema.patternProperties) === "object") {
            let regex;
            const patterns = Object.keys(schema.patternProperties);
            for (let i = 0, l = patterns.length; i < l; i += 1) {
                regex = new RegExp(patterns[i]);
                if (regex.test(key)) {
                    return schema.patternProperties[patterns[i]];
                }
            }
        }

        if (getTypeOf(schema.additionalProperties) === "object") {
            return schema.additionalProperties;
        }

        if (schema.additionalProperties === true) {
            return createSchemaOf(data[key]);
        }

        return errors.unknownPropertyError({
            property: key,
            value: data,
            // pointer: `${pointer}/${key}`,
            pointer: `${pointer}`
        });
    }
};

/**
 * Returns the json-schema of the given object property or array item.
 * e.g. it steps by one key into the data
 *
 *  This helper determines the location of the property within the schema (additional properties, oneOf, ...) and
 *  returns the correct schema.
 *
 * @param  core      - validator
 * @param  key       - property-name or array-index
 * @param  schema    - json schema of current data
 * @param  data      - parent of key
 * @param  [pointer] - pointer to schema and data (parent of key)
 * @return Schema or Error if failed resolving key
 */
export default function step(
    core: Core,
    key: string | number,
    schema: JSONSchema,
    data?: any,
    pointer: JSONPointer = "#"
): JSONSchema | JSONError {
    // @draft >= 4 ?
    if (Array.isArray(schema.type)) {
        const dataType = getTypeOf(data);
        if (schema.type.includes(dataType)) {
            // @ts-ignore
            return stepType[dataType](core, `${key}`, schema, data, pointer);
        }
        return core.errors.typeError({
            value: data,
            pointer,
            expected: schema.type,
            received: dataType
        });
    }

    const expectedType = schema.type || getTypeOf(data);
    // @ts-ignore
    const stepFunction = stepType[expectedType];
    if (stepFunction) {
        return stepFunction(core, `${key}`, schema, data, pointer);
    }
    return new Error(`Unsupported schema type ${schema.type} for key ${key}`) as JSONError;
}
