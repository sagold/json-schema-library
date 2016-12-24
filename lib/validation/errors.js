/* eslint no-invalid-this: 0 */
const createCustomError = require("../utils/createCustomError");


const errors = {
    AdditionalItemsError: createCustomError("AdditionalItemsError"),
    MaximumError: createCustomError("MaximumError"),
    MaxItemsError: createCustomError("MaxItemsError"),
    MaxLengthError: createCustomError("MaxLengthError"),
    MaxPropertiesError: createCustomError("MaxPropertiesError"),
    MinimumError: createCustomError("MinimumError"),
    MinItemsError: createCustomError("MinItemsError"),
    MinLengthError: createCustomError("MinLengthError"),
    MinPropertiesError: createCustomError("MinPropertiesError"),
    MultipleOfError: createCustomError("MultipleOfError"),
    NotError: createCustomError("NotError"),
    PatternError: createCustomError("PatternError"),
    EnumError: createCustomError("EnumError"),

    InvalidTypeError: createCustomError("InvalidTypeError"),
    MissingKeyError: createCustomError("MissingKeyError"),
    TypeError: createCustomError("TypeError"),
    UndefinedValueError: createCustomError("UndefinedValueError")
};

module.exports = errors;
