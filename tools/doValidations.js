const jsl = require("../dist/jsonSchemaLibrary");
const compileSchema = jsl.compileSchema;

const schema = require("./default-schema.json");
const data = require("./default-data.json");

let valid;
for (let i = 0; i < 1000; i += 1) {
    const node = compileSchema(schema);
    valid = node.validate(data).valid;
}
