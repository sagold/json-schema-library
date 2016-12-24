/* eslint no-invalid-this: 0 */
const createCustomError = require("../utils/createCustomError");


const errors = {
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
    MultipleOfError: createCustomError("MultipleOfError"),
    NotError: createCustomError("NotError"),
    PatternError: createCustomError("PatternError"),
    TypeError: createCustomError("TypeError"),
    UndefinedValueError: createCustomError("UndefinedValueError")
};

module.exports = errors;
