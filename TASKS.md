# Tasks

## 16/12

**Milestone** custom validator (form-validation, oneOfProperty, validate currently existing schemas)
**Milestone** customizable default and form (json-editor) validation

- [ ] -- Breaking -- Add sort of 'core' to custim validation, stepper, errors etc and simplify function depenency inject
- [ ] -- Features -- oneOf -> oneOfProperty ( + Documentation)
- [ ] -- Features -- additionalItems: Boolean | Schema
- [ ] -- Features -- allOf
- [ ] -- Features -- anyOf
- [✓] -- Breaking -- change isValid to return boolean
- [✓] -- Breaking -- use `step` in isValid -- bad: circular dependencies with step -> guessOneOfSchema -> isValid --X-> step
- [✓] -- Features -- items: [] schema (order/defined indices)
- [✓] -- Features -- not
- [✓] -- Features -- return custom errors in data validation
- [✓] Basics
