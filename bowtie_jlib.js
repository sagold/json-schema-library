/**
 * test file for bowtie integration
 *
 * - Tutorial: https://docs.bowtie.report/en/stable/implementers/
 *
 * Build Dockerfile:
 *
 * ```
 * docker build -t localhost/jlib .
 * ````
 *
 * Test setup:
 *
 * ```
bowtie run -i localhost/jlib -V <<EOF
{"description": "test case 1", "schema": {}, "tests": [{"description": "a test", "instance": {}}] }
{"description": "test case 2", "schema": {"const": 37}, "tests": [{"description": "not 37", "instance": {}}, {"description": "is 37", "instance": 37}] }
EOF
 *
 * Test draft
 *
 * ```
 * bowtie suite -i localhost/jlib draft7 | bowtie summary --show failures
 * ```
 *
 */
const readline = require("readline/promises");
const process = require("process");
const os = require("os");
const packageJson = require("./package.json");
const jlib = require("./dist/jsonSchemaLibrary.js");

const compileSchema = jlib.compileSchema;

const stdio = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

// const schemaIds: { [id: string]: SchemaDraft } = {
//     "https://json-schema.org/draft/2020-12/schema": SchemaDraft.v2020_12,
//     "https://json-schema.org/draft/2019-09/schema": SchemaDraft.v2019_09,
//     "http://json-schema.org/draft-07/schema#": SchemaDraft.v7,
//     "http://json-schema.org/draft-06/schema#": SchemaDraft.v6,
//     "http://json-schema.org/draft-04/schema#": SchemaDraft.v4
// };

function send(data) {
    console.log(JSON.stringify(data));
}

let started = false;
// let dialect;

const cmds = {
    start: async (args) => {
        console.assert(args.version === 1, { args });
        started = true;
        return {
            version: 1,
            implementation: {
                language: "javascript",
                name: "json-schema-library",
                version: packageJson.version,
                homepage: "https://github.com/sagold/json-schema-library",
                issues: "https://github.com/sagold/json-schema-library/issues",
                source: "https://github.com/sagold/json-schema-library",

                dialects: [
                    "https://json-schema.org/draft/2020-12/schema",
                    "https://json-schema.org/draft/2019-09/schema",
                    "http://json-schema.org/draft-07/schema#",
                    "http://json-schema.org/draft-06/schema#",
                    "http://json-schema.org/draft-04/schema#"
                ],
                os: os.platform(),
                os_version: os.release(),
                language_version: process.version
            }
        };
    },

    dialect: async (args) => {
        console.assert(started, "Not started!");
        // dialect = schemaIds[args.dialect];
        return { ok: true };
    },

    run: async (args) => {
        console.assert(started, "Not started!");

        // for (const id in testCase.registry) {
        //         ajv.addSchema(testCase.registry[id], id);
        // }

        const testCase = args.case;
        //  as {
        //     registry: Recors<sring, string>;
        //     schema: Record<string, any>;
        //     tests: {
        //         /** testdata */
        //         instance: unknown;
        //     }[];
        // };

        const node = compileSchema(testCase.schema);
        const results = testCase.tests.map((test) => {
            try {
                const errors = node.validate(test.instance);
                return { valid: errors.length === 0 };
            } catch (error) {
                return {
                    errored: true,
                    context: {
                        traceback: error.stack,
                        message: error.message
                    }
                };
            }
        });

        return { seq: args.seq, results: results };
    },

    stop: async (_) => {
        console.assert(started, "Not started!");
        process.exit(0);
    }
};

async function main() {
    for await (const line of stdio) {
        const request = JSON.parse(line);
        const response = await cmds[request.cmd](request);
        send(response);
    }
}

main();
