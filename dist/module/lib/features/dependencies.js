import getTypeOf from "../getTypeOf";
import { mergeSchema } from "../mergeSchema";
import { uniqueItems } from "../utils/uniqueItems";
import { isObject } from "../utils/isObject";
/**
 * @todo add support for dependentRequired (draft 2019-09)
 * returns dependencies as an object json schema. does not merge with input
 * json schema. you probably will need to do so to correctly resolve
 * references.
 *
 * @returns merged json schema defined by dependencies or undefined
 */
export function resolveDependencies(draft, schema, data) {
    var _a;
    // @draft >= 2019-09 dependentSchemas
    const dependencies = (_a = schema.dependencies) !== null && _a !== void 0 ? _a : schema.dependentSchemas;
    if (!isObject(dependencies) || !isObject(data)) {
        return;
    }
    let updated = false;
    let resolvedSchema = { required: [] };
    Object.keys(dependencies).forEach((prop) => {
        var _a, _b;
        if (data[prop] == null &&
            !(((_a = schema.required) === null || _a === void 0 ? void 0 : _a.includes(prop)) || ((_b = resolvedSchema.required) === null || _b === void 0 ? void 0 : _b.includes(prop)))) {
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
 * @draft 2019-09
 */
export const validateDependentRequired = (draft, schema, value, pointer) => {
    const dependentRequired = schema.dependentRequired;
    if (!isObject(dependentRequired)) {
        return undefined;
    }
    const errors = [];
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
export const validateDependentSchemas = (draft, schema, value, pointer) => {
    const dependentSchemas = schema.dependentSchemas;
    if (!isObject(dependentSchemas)) {
        return undefined;
    }
    const errors = [];
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
        draft.validate(value, dependencies, pointer).map(error => errors.push(error));
    });
    return errors;
};
/**
 * validate dependencies definition for given input data
 */
export const validateDependencies = (draft, schema, value, pointer) => {
    // @draft >= 2019-09 dependentSchemas
    const dependencies = schema.dependencies;
    if (!isObject(dependencies)) {
        return undefined;
    }
    const errors = [];
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
                .filter((dependency) => value[dependency] === undefined)
                .map((missingProperty) => draft.errors.missingDependencyError({ missingProperty, pointer, schema, value }));
        }
        else if (type === "object") {
            dependencyErrors = draft.validate(value, dependencies[property], pointer);
        }
        else {
            throw new Error(`Invalid dependency definition for ${pointer}/${property}. Must be string[] or schema`);
        }
        errors.push(...dependencyErrors);
    });
    return errors.length > 0 ? errors : undefined;
};
