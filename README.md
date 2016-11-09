# json-schema-library

`npm i json-schema-library`

> This package offers tools and utilities to work with json-schema, create and validate data. Unfortunately, most
> packages, editors or validators do not care to expose basic json-schema functionality. This repository
> lessens the pain building tools around json-schema. The tools currently support only a basic json-schema, but
> will hopefully expand over time.

Instead of small memory footprint or high performance, this package focuses on exposing utilities for browser and node
environments. This package is tested on node v6.9.1.


## Overview

refer to the [unit-tests](./test/unit/) for up to date examples of each function.

### getSchema(schema, pointer, data)

return the json 'schema' matching 'data' at 'pointer'. Should be modified to use a step/next-function, which is already
within the logic (advance VS retrieve from root -> support both)

```js
const targetSchema = getSchema(rootSchema, '#/path/to/target', rootData);
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
    {type: 'object', properties: { target: {'string'}}}
); // returns { target: "" }
```


### guessOneOfSchema(schema, data, rootSchema = schema)

returns the best matching schema.oneOf schema matching the given data. The method allows additional or missing values.

```js
const baseData = guessOneOfSchema(
    {type: 'object', oneOf: [
        {type: "object", properties: { target: "string", other: "boolean"}},
        {type: "object", properties: { target: "number", other: "boolean"}}
    ]},
    { target: 14 }
); // returns {type: "object", properties: { target: "number", other: "boolean"}}
```


### createSchemaOf(data)

returns a json schema which is valid against data.

```js
const baseSchema = getTemplate(
    { target: "" }
); // {type: "object", properties: { target: "string"}},
```


### isValid(data, schema)

returns the schema if it validates the data, else returns false if the data is invalid

```js
const baseSchema = isValid("", { type: "number" }); // returns false
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



