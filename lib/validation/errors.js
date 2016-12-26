/* eslint no-invalid-this: 0 */
const createCustomError = require("../utils/createCustomError");


const errors = {
    AdditionalItemsError: createCustomError("AdditionalItemsError"),
    AdditionalPropertiesError: createCustomError("AdditionalPropertiesError"),
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
    MultipleOneOfError: createCustomError("MultipleOneOfError"),
    NoAdditionalPropertiesError: createCustomError("NoAdditionalPropertiesError"),
    NotError: createCustomError("NotError"),
    OneOfError: createCustomError("OneOfError"),
    OneOfPropertyError: createCustomError("OneOfPropertyError"),
    PatternError: createCustomError("PatternError"),
    TypeError: createCustomError("TypeError"),
    UndefinedValueError: createCustomError("UndefinedValueError"),
    InvalidSchemaError: createCustomError("InvalidSchemaError")
};


module.exports = errors;
