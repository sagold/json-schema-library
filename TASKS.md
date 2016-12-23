# Tasks

## 16/12

**Milestone** custom validator (form-validation, oneOfProperty, use current schema)

- [✓] -- Breaking -- change isValid to return boolean
- [✓] -- Features -- return custom errors in data validation
- [✓] -- Breaking -- use `step` in isValid -- bad: circular dependencies with step -> guessOneOfSchema -> isValid --X-> step
