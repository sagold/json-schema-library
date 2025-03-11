-   do not use reduce in validation, this messes up recursive resolution
-   since we currently do not use get in validation, spec does not test this. This also means we have duplicate logic for the same functionality
-   all functionality is (probably) based on:
    -- validate
    -- reduce (uses validate)
    -- getTemplate (uses reduce)
    -- getSchema (uses validate and reduce) and
    -- the node-tree
-   reduce schema currently resolves to schema false if there is an error. This is required in unevaluatedProperties are returning an error is probably the right behaviour for reduce (@see v1 reduceSchema). So, add unevaluatedProperties without reduce?
-   unevalutatedItems spec test merge order is different as defined (local is overriden by reference schema, but should be the other way)
-   get (getSchema) must return undefined for missing schema (do not create schema based on data only)

## context

**context binds all json-schema:**

```yaml
context:
    - remotes: RootNode[]
```

**context is RootNode specific:**

```yaml
context:
    - rootNode: JsonSchemaRootNode
    - PARSERS: JsonSchemaSpec Parser of this json-schema spec
    - VALIDATORA: JsonSchemaSpec Validators of this json-schema spec
```
