/* eslint no-invalid-this: 0 */
import createCustomError, { CreateError } from "../utils/createCustomError";


const errors: { [p: string]: CreateError } = {
    additionalItemsError: createCustomError("AdditionalItemsError"),
    additionalPropertiesError: createCustomError("AdditionalPropertiesError"),
    anyOfError: createCustomError("AnyOfError"),
    allOfError: createCustomError("AllOfError"),
    enumError: createCustomError("EnumError"),
    formatUrlError: createCustomError("FormatUrlError"),
    formatUriError: createCustomError("FormatUriError"),
    formatDateTimeError: createCustomError("FormatDateTimeError"),
    formatEmailError: createCustomError("FormatEmailError"),
    formatHostnameError: createCustomError("FormatHostnameError"),
    formatIPV4Error: createCustomError("FormatIPV4Error"),
    formatIPV4LeadingZeroError: createCustomError("FormatIPV4LeadingZeroError"),
    formatIPV6Error: createCustomError("FormatIPV6Error"),
    formatIPV6LeadingZeroError: createCustomError("FormatIPV6LeadingZeroError"),
    formatRegExError: createCustomError("FormatRegExError"),
    invalidSchemaError: createCustomError("InvalidSchemaError"),
    invalidDataError: createCustomError("InvalidDataError"),
    invalidTypeError: createCustomError("InvalidTypeError"),
    invalidPropertyNameError: createCustomError("InvalidPropertyNameError"),
    maximumError: createCustomError("MaximumError"),
    maxItemsError: createCustomError("MaxItemsError"),
    maxLengthError: createCustomError("MaxLengthError"),
    maxPropertiesError: createCustomError("MaxPropertiesError"),
    minimumError: createCustomError("MinimumError"),
    minItemsError: createCustomError("MinItemsError"),
    minLengthError: createCustomError("MinLengthError"),
    minPropertiesError: createCustomError("MinPropertiesError"),
    missingDependencyError: createCustomError("MissingDependencyError"),
    missingOneOfPropertyError: createCustomError("MissingOneOfPropertyError"),
    multipleOfError: createCustomError("MultipleOfError"),
    multipleOneOfError: createCustomError("MultipleOneOfError"),
    noAdditionalPropertiesError: createCustomError("NoAdditionalPropertiesError"),
    notError: createCustomError("NotError"),
    oneOfError: createCustomError("OneOfError"),
    oneOfPropertyError: createCustomError("OneOfPropertyError"),
    patternError: createCustomError("PatternError"),
    patternPropertiesError: createCustomError("PatternPropertiesError"),
    requiredPropertyError: createCustomError("RequiredPropertyError"),
    typeError: createCustomError("TypeError"),
    undefinedValueError: createCustomError("UndefinedValueError"),
    uniqueItemsError: createCustomError("UniqueItemsError"),
    unknownPropertyError: createCustomError("UnknownPropertyError"),
    valueNotEmptyError: createCustomError("ValueNotEmptyError")
};


export default errors;
