/* eslint max-len: 0 */
module.exports = {
    // validation errors
    AdditionalItemsError: "Array at `{{pointer}}` may not have an additional item `{{key}}`",
    AdditionalPropertiesError: "Additional property `{{property}}` on `{{pointer}}` does not match schema `{{schema}}`",
    EnumError: "Expected given value `{{value}}` in `{{pointer}}` to be one of `{{values}}`",
    MaximumError: "Value in `{{pointer}}` is `{{length}}`, but should be `{{maximum}}` at maximum",
    MaxItemsError: "Too many items in `{{pointer}}`, should be `{{maximum}}` at most, but got `{{length}}`",
    MaxLengthError: "Value `{{pointer}}` should have a maximum length of `{{maxLength}}`, but got `{{length}}`.",
    MaxPropertiesError: "Too many properties in `{{pointer}}`, should be `{{maximum}}` at most, but got `{{length}}`",
    MinimumError: "Value in `{{pointer}}` is `{{length}}`, but should be `{{minimum}}` at minimum",
    MinItemsError: "Too few items in `{{pointer}}`, should be at least `{{minimum}}`, but got `{{length}}`",
    MinLengthError: "Value `{{pointer}}` should have a minimum length of `{{minLength}}`, but got `{{length}}`.",
    MinPropertiesError: "Too few properties in `{{pointer}}`, should be at least `{{minimum}}`, but got `{{length}}`",
    MissingKeyError: "Missing property `{{key}}` in `{{pointer}}`",
    MissingOneOfPropertyError: "Value at `{{pointer}}` must have a property `{{property}}`",
    MultipleOfError: "Expected `{{value}}` in `{{pointer}}` to be multiple of `{{multipleOf}}`",
    MultipleOneOfError: "Value `{{value}}` should not match multiple schemas in oneOf `{{matches}}`",
    NoAdditionalPropertiesError: "Additional property `{{property}}` in `{{pointer}}` is not allowed",
    NotError: "Value `{{value}}` at pointer should not match schema `{{not}}`",
    OneOfError: "Value `{{value}}` in `{{pointer}}` does not match any given oneof schema",
    OneOfPropertyError: "Failed finding a matching oneOfProperty schema in `{{pointer}}` where `{{property}}` matches `{{value}}`",
    PatternError: "Value in `{{pointer}}` should match `{{pattern}}`, but received `{{received}}`",
    TypeError: "Expected `{{value}}` ({{received}}) in `{{pointer}}` to be of type `{{expected}}`",
    UndefinedValueError: "Vaue undefined in value `{{pointer}}`"
};
