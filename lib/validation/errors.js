/* eslint no-invalid-this: 0 */
const createCustomError = require("../utils/createCustomError");


const errors = {
    MaximumError: createCustomError("MaximumError"),
    MaxItemsError: createCustomError("MaxItemsError"),
    MaxLengthError: createCustomError("MaxLengthError"),
    MaxPropertiesError: createCustomError("MaxPropertiesError"),
    MinimumError: createCustomError("MinimumError"),
    MinItemsError: createCustomError("MinItemsError"),
    MinLengthError: createCustomError("MinLengthError"),
    MinPropertiesError: createCustomError("MinPropertiesError"),
    PatternError: createCustomError("PatternError"),

    InvalidTypeError: createCustomError("InvalidTypeError"),
    MissingKeyError: createCustomError("MissingKeyError"),
    TypeMismatchError: createCustomError("TypeMismatchError"),
    UndefinedValueError: createCustomError("UndefinedValueError")
};

module.exports = errors;
