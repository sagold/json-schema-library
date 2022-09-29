const jsl = require("../dist/jsonSchemaLibrary");
const Core = jsl.Draft07;

const schema = require("../test/integration/support/default-schema.json");
const data = require("../test/integration/support/default-data.json");

for (let i = 0; i < 1000; i += 1) {
    const validator = new Core(schema);
    const errors = validator.validate(schema, data);
}
