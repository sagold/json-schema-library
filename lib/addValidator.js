/**
 * @throws Error
 * Adds a custom error. May override existing errors
 *
 * @param {Core} core
 * @param {String} errorId          - id of error @see /lib/validation/errors
 * @param {Function} errorCreator   - function returning an error-object @see /lib/utils/createCustomError
 */
function addError(core, errorId, errorCreator) {
    if (typeof errorCreator !== "function") {
        throw new Error(`Error callback 'errorCreator' must be of type function. Received ${typeof errorCreator}`);
    }
    core.errors[errorId] = errorCreator;
}

/**
 * Adds a custom format validator. Existing format may not be overriden (may still be modified manually)
 * @param {Core} core
 * @param {String} formatType           - format type (i.e. `format: "html"`)
 * @param {Function} validationFunction - called with (core, schema, value, pointer)
 */
function addFormat(core, formatType, validationFunction) {
    if (typeof validationFunction !== "function") {
        throw new Error(`Validation function expected. Received ${typeof validationFunction}`);
    }
    if (core.validateFormat[formatType] == null) {
        core.validateFormat[formatType] = validationFunction;
        return;
    }
    throw new Error(`A format '${formatType}' is already registered to validation`);
}

/**
 * Adds a custom keyword validation to a specific type. May not override existing keywords.
 * Attention: validator function must check for presence of its keyword!
 *
 * @param {Core} core
 * @param {String} datatype             - valid datatype like "object", "array", "string", etc
 * @param {String} keyword              - The keyword to add, i.e. `minWidth: ...`
 * @param {Function} validationFunction - called with (core, schema, value, pointer)
 */
function addKeyword(core, datatype, keyword, validationFunction) {
    if (typeof validationFunction !== "function") {
        throw new Error(`Validation function expected. Received ${typeof validationFunction}`);
    }
    if (core.typeKeywords[datatype] == null) {
        throw new Error(`Unknown datatype ${datatype}. Failed adding custom keyword validation.`);
    }
    if (core.typeKeywords[datatype].includes(keyword)) {
        throw new Error(`A keyword '${keyword}' for the datatype ${datatype} is already registered to validation`);
    }
    core.typeKeywords[datatype].push(keyword);
    core.validateKeyword[keyword] = validationFunction;
}

/**
 * Adds a new type to validation. For implementation details of validationFunction @see /lib/validation/type.
 *
 * @param {Core} core
 * @param {String} datatype             - new datatype to add
 * @param {Function} validationFunction - called with (core, schema, value, pointer)
 */
function addType(core, datatype, validationFunction) {
    if (typeof validationFunction !== "function") {
        throw new Error(`Validation function expected. Received ${typeof validationFunction}`);
    }
    if (core.validateType[datatype] == null) {
        core.validateType[datatype] = validationFunction;
        return;
    }
    throw new Error(`The datatype '${datatype}' does already exist`);
}


module.exports = {
    error: addError,
    format: addFormat,
    keyword: addKeyword,
    type: addType
};
