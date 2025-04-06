import { strict as assert } from "assert";
import { DraftVersion, FeatureTest, getDraftTests, Setup } from "./getDraftTests";
import { addRemotes } from "./addRemotes";
import { compileSchema } from "../../compileSchema";
import { isObject } from "../../utils/isObject";
import { SchemaNode } from "../../types";

let measurements = {
    start: 0,
    validationDuration: 0,
    testCount: 0,
    end: 0,
    max: {
        duration: 0,
        title: "",
        schema: {}
    }
};

function runTestCase(setup: Setup, tc: FeatureTest, remotes: SchemaNode) {
    describe(`${tc.name}${tc.optional ? " (optional)" : ""}`, () => {
        tc.testCases.forEach((testCase) => {
            const $schema = setup.metaSchema.$id ?? setup.metaSchema.id;
            // get schema and add $schema to identify draft version
            const schema = isObject(testCase.schema) ? { $schema, ...testCase.schema } : testCase.schema;
            const node = compileSchema(schema, { remote: remotes, formatAssertion: tc.optional });

            // register tests
            describe(testCase.description, () => {
                if (setup.only && setup.only.description && setup.only.description !== testCase.description) {
                    return;
                }
                testCase.tests.forEach((testData) => {
                    if (setup.skipTests && setup.skipTests.includes(testCase.description)) {
                        it.skip(testData.description, () => {});
                        return;
                    }
                    it(testData.description, () => {
                        if (setup.logSchema === true || (setup.logSchema == null && setup.only)) {
                            console.log(
                                testData.description,
                                JSON.stringify(schema, null, 2),
                                JSON.stringify(testData.data, null, 2)
                            );
                        }
                        const startTime = Date.now();
                        const errors = node.validate(testData.data);
                        const duration = Date.now() - startTime;
                        measurements.validationDuration += duration;
                        assert.equal(errors.length === 0, testData.valid);
                        measurements.testCount++;
                        if (measurements.max.duration < duration) {
                            measurements.max.duration = duration;
                            measurements.max.title = testData.description;
                            measurements.max.schema = schema;
                        }
                    });
                });
            });
        });
    });
}

export default function runAllTestCases(setup: Setup) {
    const remotes = compileSchema({});
    const $schema = setup.metaSchema.$id ?? setup.metaSchema.id;
    addRemotes(remotes, [setup.metaSchema, ...(setup.metaSchemaList ?? [])], $schema);

    measurements = {
        start: Date.now(),
        validationDuration: 0,
        testCount: 0,
        end: 0,
        max: {
            duration: 0,
            title: "",
            schema: {}
        }
    };

    // retrieve draft name from metaschema id
    const draftName = (setup.metaSchema.$id ?? setup.metaSchema.id)
        .match(/draft[-/][^/]*/)
        .pop()
        .replace(/\//, "-");
    // parse draft name to draft version
    const draftId = draftName.match(/draft-0?([0-9]*-?[0-9]*)/).pop() as DraftVersion;

    describe(draftName, () => {
        getDraftTests(draftId)
            .filter((tc) => {
                if (setup.only?.name) {
                    return setup.only?.name === tc.name;
                }
                const runTestCase = setup.skipTestCase(tc);
                if (!runTestCase) {
                    describe(`${tc.name}${tc.optional ? " (optional)" : ""}`, () => {
                        tc.testCases.forEach((test) => it.skip(test.description, () => {}));
                    });
                }
                return runTestCase;
            })
            .forEach((tc) => runTestCase(setup, tc, remotes));

        after(() => {
            measurements.end = Date.now();
            process.env.DISABLE_LOG !== "true" &&
                console.log(
                    "\n",
                    "time overall:",
                    measurements.end - measurements.start,
                    "ms",
                    "time validations:",
                    measurements.validationDuration,
                    "ms",
                    "average validation time:",
                    measurements.validationDuration / measurements.testCount
                );
            // console.log("max time:", measurements.max);
        });
    });
}
