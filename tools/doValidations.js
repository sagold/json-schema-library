const jsl = require("../lib");
const Core = jsl.cores.JsonEditor;

const schema = require("../test/integration/support/default-schema.json");
const data = require("../test/integration/support/default-data.json");

for (let i = 0; i < 1000; i += 1) {
    const validator = new Core(schema);
    validator.validate(schema, data);
}

