/**
 * @throws Error
 * Adds a custom error. May override existing errors
 *
 * @param draft
 * @param errorId id of error @see /lib/validation/errors
 * @param errorCreator - function returning an error-object @see /lib/utils/createCustomError
 */
function addError(draft, errorId, errorCreator) {
    if (typeof errorCreator !== "function") {
        throw new Error(`Error callback 'errorCreator' must be of type function. Received '${typeof errorCreator}'`);
    }
    draft.errors[errorId] = errorCreator;
}
/**
 * Adds a custom format validator. Existing format may not be overriden (may still be modified manually)
 * @param draft
 * @param formatType - format type (i.e. `format: "html"`)
 * @param validationFunction - called with (draft, schema, value, pointer)
 */
function addFormat(draft, formatType, validationFunction) {
    if (typeof validationFunction !== "function") {
        throw new Error(`Validation function expected. Received ${typeof validationFunction}`);
    }
    if (draft.validateFormat[formatType]) {
        throw new Error(`A format '${formatType}' is already registered to validation`);
    }
    draft.validateFormat[formatType] = validationFunction;
}
/**
 * Adds a custom keyword validation to a specific type. May not override existing keywords.
 *
 * @param draft
 * @param datatype - valid datatype like "object", "array", "string", etc
 * @param keyword - The keyword to add, i.e. `minWidth: ...`
 * @param validationFunction - called with (draft, schema, value, pointer)
 */
function addKeyword(draft, datatype, keyword, validationFunction) {
    if (typeof validationFunction !== "function") {
        throw new Error(`Validation function expected. Received ${typeof validationFunction}`);
    }
    if (draft.typeKeywords[datatype] == null) {
        throw new Error(`Unknown datatype ${datatype}. Failed adding custom keyword validation.`);
    }
    if (draft.typeKeywords[datatype].includes(keyword) === false) {
        draft.typeKeywords[datatype].push(keyword);
    }
    draft.validateKeyword[keyword] = validationFunction;
}
export default {
    error: addError,
    format: addFormat,
    keyword: addKeyword
};
