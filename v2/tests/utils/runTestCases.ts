import { expect } from "chai";
import { DraftVersion, FeatureTest, getDraftTests, Setup } from "./getDraftTests";
import { addRemotes } from "./addRemotes";
import { compileSchema } from "../../compileSchema";
import { isObject } from "../../../lib/utils/isObject";

let measurements = {
    start: 0,
    compileDuration: 0,
    validationDuration: 0,
    end: 0
};

function runTestCase(setup: Setup, tc: FeatureTest) {
    describe(`${tc.name}${tc.optional ? " (optional)" : ""}`, () => {
        tc.testCases.forEach((testCase) => {
            const $schema = setup.metaSchema.$id ?? setup.metaSchema.id;

            // get schema and add $schema to identify draft version
            const schema = isObject(testCase.schema) ? { $schema, ...testCase.schema } : testCase.schema;
            // register tests
            describe(testCase.description, () => {
                if (setup.only && setup.only.description && setup.only.description !== testCase.description) {
                    return;
                }
                testCase.tests.forEach((testData) => {
                    it(testData.description, () => {
                        if (setup.logSchema === true || (setup.logSchema == null && setup.only)) {
                            console.log(
                                testData.description,
                                JSON.stringify(schema, null, 2),
                                JSON.stringify(testData.data, null, 2)
                            );
                        }
                        const startCompileTime = Date.now();
                        const node = compileSchema(schema);
                        addRemotes(node, [setup.metaSchema, ...(setup.metaSchemaList ?? [])], $schema);
                        measurements.compileDuration += Date.now() - startCompileTime;
                        const startTime = Date.now();
                        const errors = node.validate(testData.data);
                        expect(errors.length === 0).to.eq(testData.valid);
                        measurements.validationDuration += Date.now() - startTime;
                    });
                });
            });
        });
    });
}

export default function runAllTestCases(setup: Setup) {
    measurements = {
        start: Date.now(),
        validationDuration: 0,
        compileDuration: 0,
        end: 0
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
            .forEach((tc) => runTestCase(setup, tc));

        after(() => {
            measurements.end = Date.now();
            console.log(
                "\n",
                "time overall:",
                measurements.end - measurements.start,
                "ms",
                "time compile (with remotes):",
                measurements.compileDuration,
                "ms",
                "time validations:",
                measurements.validationDuration,
                "ms"
            );
        });
    });
}
