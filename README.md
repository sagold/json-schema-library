# json-schema-library

**Customizable and hackable json-validator and json-schema utilities for traversal, data generation and validation**


> This package offers tools and utilities to work with json-schema, create and validate data. Unfortunately, most
> packages, editors or validators do not care to expose basic json-schema functionality. This repository
> lessens the pain building tools around json-schema. The tools currently support only a basic json-schema, but
> will hopefully expand over time.

Instead of small memory footprint or high performance, this package focuses on exposing utilities for browser and node
environments. Furthermore, current validation and retrieval functions perform a lazy check, which is required for form
evaluation in i.e. json editors.

`npm i json-schema-library`.

This package is tested on node v6.9.1.


## Overview

Refer to the [unit-tests](./test/unit/) for up to date examples of each function. Most functions require a _core-helper_
which holds all required functions are configs to perform its task. This _core-helper_ may be modified to extend, remove
or modify any used functions or configuration lists.

Cores can be found under cores in either _index.js_ or under _lib/cores/_ and are instantiated with
`new Core(jsonSchema)`. The default-core i.e. implements json schema draft04. But you can also add a json-editor (form)
specific core. Most functions require arguments in the following order _core, jsonSchema, jsonData, jsonPointer_.

### getSchema(schema, pointer, data)

return the json 'schema' matching 'data' at 'pointer'. Should be modified to use a step/next-function, which is already
within the logic (advance VS retrieve from root -> support both)

```js
const core = new require("json-schema-library").core.draft04(rootSchema),
const targetSchema = getSchema(core, rootSchema, '#/path/to/target', rootData);
```

Currently may also return an error:

```js
if (targetSchema instanceOf Error) {
    throw targetSchema;
}
```



### SchemaService(schema)

binds the schema to getSchema.

```js
const schemaService = new SchemaService(rootSchema); // default core 'draft04'
const targetSchema = schemaService.get('#/path/to/target', rootData);
```


### getTemplate(schema, data, rootSchema = schema)

return data which is valid to the given json-schema. Additionally, a data object may be given, which will be
extended by any missing items or properties.

```js
const baseData = getTemplate(
    { type: "object", properties: { target: { type: "string", default: "v" } } },
    { other: true }
); // returns { other: true, target: "v" }
```


### createSchemaOf(data)

returns a json schema which is valid against data.

```js
const baseSchema = getTemplate({ target: "" });
// returns {type: "object", properties: { target: "string"}},
```

### validate(data, schema, step)

returns a list of validation errors

```js
const core = new require("json-schema-library").core.draft04(rootSchema),
const baseSchema = core.validate({ type: "number" }, "");
// returns false

// alternatively use core.validate({ type: "number" }, "")
```


### isValid(data, schema, step)

returns true if the given schema validates the data 

```js
const core = new require("json-schema-library").core.draft04(rootSchema),
const baseSchema = core.isValid({ type: "number" }, "");
// returns false
```


### step(key, schema, data, rootSchema = schema)

returns the child schema found at the given key

```js
const core = new require("json-schema-library").core.draft04(rootSchema),
const baseSchema = core.step(
    { type: "object", properties: { target: {type: "string"}} },
    { target: "value" }
    "target", 
); // returns {type: "string"}

// alternatively use core.step({ type: "object", properties: { target: {type: "string"}} }, { target: "value" }, "target")
```


### each(data, schema, callback)

calls the callback on each item (object, array and value), passing the current schema and its data

```js
const rootSchema = {
    type: "array",
    items: [
        { type: "number" },
        { type: "string" }
    ]
};
const core = new require("json-schema-library").core.draft04(rootSchema),
core.each(core.rootSchema, [5, "nine"], (schema, value, pointer) => {
    // 1. schema = { type: "array", items: [...] }, data = [5, "nine"], pointer = #
    // 2. schema = { type: "number" }, data = 5, pointer = #/0
    // 3. schema = { type: "string" }, data = "nine", pointer = #/1
});
```


