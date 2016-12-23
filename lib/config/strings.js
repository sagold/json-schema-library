module.exports = {

    // validation errors
    MaximumError: "Value in {{pointer}} is {{length}}, but should be {{maximum}} at maximum",
    MaxItemsError: "Too many items in {{pointer}}, should be {{maximum}} at most, but got {{length}}",
    MaxLengthError: "Value {{pointer}} should have a maximum length of {{maxLength}}, but got {{length}}.",
    MaxPropertiesError: "Too many properties in {{pointer}}, should be {{maximum}} at most, but got {{length}}",
    MinimumError: "Value in {{pointer}} is {{length}}, but should be {{minimum}} at minimum",
    MinItemsError: "Too few items in {{pointer}}, should be at least {{minimum}}, but got {{length}}",
    MinLengthError: "Value {{pointer}} should have a minimum length of {{minLength}}, but got {{length}}.",
    MinPropertiesError: "Too few properties in {{pointer}}, should be at least {{minimum}}, but got {{length}}",
    MultipleOfError: "Expected {{value}} in {{pointer}} to be multiple of {{multipleOf}}",
    EnumError: "Expected given value {{value}} in {{pointer}} to be one of {{values}}",
    MissingKeyError: "Missing property {{key}} in {{pointer}}",
    PatternError: "Value in {{pointer}} should match {{pattern}}",
    UndefinedValueError: "Vaue undefined in value {{pointer}}"
};
