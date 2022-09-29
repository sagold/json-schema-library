/**
 * @throws Error
 * Adds a custom error. May override existing errors
 *
 * @param core
 * @param errorId id of error @see /lib/validation/errors
 * @param errorCreator - function returning an error-object @see /lib/utils/createCustomError
 */
function addError(core, errorId, errorCreator) {
    if (typeof errorCreator !== "function") {
        throw new Error(`Error callback 'errorCreator' must be of type function. Received '${typeof errorCreator}'`);
    }
    core.errors[errorId] = errorCreator;
}
/**
 * Adds a custom format validator. Existing format may not be overriden (may still be modified manually)
 * @param core
 * @param formatType - format type (i.e. `format: "html"`)
 * @param validationFunction - called with (core, schema, value, pointer)
 */
function addFormat(core, formatType, validationFunction) {
    if (typeof validationFunction !== "function") {
        throw new Error(`Validation function expected. Received ${typeof validationFunction}`);
    }
    if (core.validateFormat[formatType]) {
        throw new Error(`A format '${formatType}' is already registered to validation`);
    }
    core.validateFormat[formatType] = validationFunction;
}
/**
 * Adds a custom keyword validation to a specific type. May not override existing keywords.
 *
 * @param core
 * @param datatype - valid datatype like "object", "array", "string", etc
 * @param keyword - The keyword to add, i.e. `minWidth: ...`
 * @param validationFunction - called with (core, schema, value, pointer)
 */
function addKeyword(core, datatype, keyword, validationFunction) {
    if (typeof validationFunction !== "function") {
        throw new Error(`Validation function expected. Received ${typeof validationFunction}`);
    }
    if (core.typeKeywords[datatype] == null) {
        throw new Error(`Unknown datatype ${datatype}. Failed adding custom keyword validation.`);
    }
    if (core.typeKeywords[datatype].includes(keyword) === false) {
        core.typeKeywords[datatype].push(keyword);
    }
    core.validateKeyword[keyword] = validationFunction;
}
export default {
    error: addError,
    format: addFormat,
    keyword: addKeyword
};
