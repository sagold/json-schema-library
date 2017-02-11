/* eslint no-invalid-this: 0 */
const createCustomError = require("../utils/createCustomError");


const errors = {
    additionalItemsError: createCustomError("AdditionalItemsError"),
    additionalPropertiesError: createCustomError("AdditionalPropertiesError"),
    enumError: createCustomError("EnumError"),
    invalidTypeError: createCustomError("InvalidTypeError"),
    maximumError: createCustomError("MaximumError"),
    maxItemsError: createCustomError("MaxItemsError"),
    maxLengthError: createCustomError("MaxLengthError"),
    maxPropertiesError: createCustomError("MaxPropertiesError"),
    minimumError: createCustomError("MinimumError"),
    minItemsError: createCustomError("MinItemsError"),
    minLengthError: createCustomError("MinLengthError"),
    minPropertiesError: createCustomError("MinPropertiesError"),
    missingKeyError: createCustomError("MissingKeyError"),
    missingOneOfPropertyError: createCustomError("MissingOneOfPropertyError"),
    multipleOfError: createCustomError("MultipleOfError"),
    multipleOneOfError: createCustomError("MultipleOneOfError"),
    noAdditionalPropertiesError: createCustomError("NoAdditionalPropertiesError"),
    notError: createCustomError("NotError"),
    oneOfError: createCustomError("OneOfError"),
    oneOfPropertyError: createCustomError("OneOfPropertyError"),
    patternError: createCustomError("PatternError"),
    typeError: createCustomError("TypeError"),
    undefinedValueError: createCustomError("UndefinedValueError"),
    invalidSchemaError: createCustomError("InvalidSchemaError")
};


module.exports = errors;
