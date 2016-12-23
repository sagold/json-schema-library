# json-schema-library


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

refer to the [unit-tests](./test/unit/) for up to date examples of each function.


### getSchema(schema, pointer, data)

return the json 'schema' matching 'data' at 'pointer'. Should be modified to use a step/next-function, which is already
within the logic (advance VS retrieve from root -> support both)

```js
const targetSchema = getSchema(rootSchema, '#/path/to/target', rootData);
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
const schemaService = new SchemaService(rootSchema);
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
const baseSchema = validate("", { type: "number" });
// returns false
```


### isValid(data, schema, step)

returns true if the given schema validates the data 

```js
const baseSchema = isValid("", { type: "number" });
// returns false
```


### step(key, schema, data, rootSchema = schema)

returns the child schema found at the given key

```js
const baseSchema = step(
    "target", 
    { type: "object", properties: { target: {type: "string"}} },
    { target: "value" }
); // returns {type: "string"}
```


### each(data, schema, callback)

calls the callback on each item (object, array and value), passing the current schema and its data

```js
const schema = {
    type: "array",
    items: [
        { type: "number" },
        { type: "string" }
    ]
};

each([5, "nine"], schema, (schema, value, pointer) => {
    // 1. schema = { type: "array", items: [...] }, data = [5, "nine"], pointer = #
    // 2. schema = { type: "number" }, data = 5, pointer = #/0
    // 3. schema = { type: "string" }, data = "nine", pointer = #/1
});
```


