/* eslint no-invalid-this: 0 */
const createCustomError = require("../utils/createCustomError");


const errors = {
    AdditionalPropertiesError: createCustomError("AdditionalPropertiesError"),
    AdditionalItemsError: createCustomError("AdditionalItemsError"),
    EnumError: createCustomError("EnumError"),
    InvalidTypeError: createCustomError("InvalidTypeError"),
    MaximumError: createCustomError("MaximumError"),
    MaxItemsError: createCustomError("MaxItemsError"),
    MaxLengthError: createCustomError("MaxLengthError"),
    MaxPropertiesError: createCustomError("MaxPropertiesError"),
    MinimumError: createCustomError("MinimumError"),
    MinItemsError: createCustomError("MinItemsError"),
    MinLengthError: createCustomError("MinLengthError"),
    MinPropertiesError: createCustomError("MinPropertiesError"),
    MissingKeyError: createCustomError("MissingKeyError"),
    MissingOneOfPropertyError: createCustomError("MissingOneOfPropertyError"),
    MultipleOfError: createCustomError("MultipleOfError"),
    NoAdditionalPropertiesError: createCustomError("NoAdditionalPropertiesError"),
    NotError: createCustomError("NotError"),
    OneOfPropertyError: createCustomError("OneOfPropertyError"),
    PatternError: createCustomError("PatternError"),
    TypeError: createCustomError("TypeError"),
    UndefinedValueError: createCustomError("UndefinedValueError")
};

module.exports = errors;
