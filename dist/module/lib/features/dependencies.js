import getTypeOf from "../getTypeOf";
import { mergeSchema } from "../mergeSchema";
import { uniqueItems } from "../utils/uniqueItems";
function isObject(v) {
    return getTypeOf(v) === "object";
}
/**
 * returns dependencies as an object json schema. does not merge with input
 * json schema. you probably will need to do so to correctly resolve
 * references.
 *
 * @returns merged json schema defined by dependencies or undefined
 */
export function resolveDependencies(draft, schema, data) {
    const { dependencies } = schema;
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
        if (Array.isArray(dependency)) {
            updated = true;
            resolvedSchema.required.push(...dependency);
            return;
        }
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
 * steps into dependencies
 * @returns json schema or undefined if 'key' is not defined
 */
// export function stepIntoDependencies(
//     draft: Draft,
//     key: string,
//     schema: JsonSchema,
//     data: unknown,
//     pointer: string
// ) {
//     const { dependencies } = schema;
//     if (getTypeOf(dependencies) === "object") {
//         const dependentProperties = Object.keys(dependencies).filter(
//             (propertyName) =>
//                 // data[propertyName] !== undefined &&
//                 getTypeOf(dependencies[propertyName]) === "object"
//         );
//         for (let i = 0, l = dependentProperties.length; i < l; i += 1) {
//             const dependentProperty = dependentProperties[i];
//             const schema = draft.step(
//                 key,
//                 dependencies[dependentProperty],
//                 data,
//                 `${pointer}/${dependentProperty}`
//             );
//             if (!isJsonError(schema)) {
//                 return schema;
//             }
//         }
//     }
// }
/**
 * validate dependencies definition for given input data
 */
const validateDependencies = (draft, schema, value, pointer) => {
    if (getTypeOf(schema.dependencies) !== "object") {
        return undefined;
    }
    const errors = [];
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
                .filter((dependency) => value[dependency] === undefined)
                .map((missingProperty) => draft.errors.missingDependencyError({ missingProperty, pointer }));
        }
        else if (type === "object") {
            dependencyErrors = draft.validate(value, schema.dependencies[property], pointer);
        }
        else {
            throw new Error(`Invalid dependency definition for ${pointer}/${property}. Must be string[] or schema`);
        }
        errors.push(...dependencyErrors);
    });
    return errors.length > 0 ? errors : undefined;
};
export { validateDependencies };
