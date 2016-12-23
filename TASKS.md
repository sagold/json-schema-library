# Tasks

## 16/12

**Milestone** custom validator (form-validation, oneOfProperty, use current schema)

- [ ] -- Features -- items: [] schema (order/defined indices)
- [ ] -- Features -- additionalItems: Boolean | Schema
- [ ] -- Features -- not
- [ ] -- Features -- allOf
- [ ] -- Features -- anyOf
- [✓] -- Breaking -- change isValid to return boolean
- [✓] -- Features -- return custom errors in data validation
- [✓] -- Breaking -- use `step` in isValid -- bad: circular dependencies with step -> guessOneOfSchema -> isValid --X-> step
