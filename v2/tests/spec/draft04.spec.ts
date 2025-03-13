import draft04Meta from "../../../remotes/draft04.json";
import { Setup } from "../../../test/getDraftTests";
import runAllTestCases from "../utils/runTestCases";

const setup: Setup = {
    // only: {
    //     name: "definitions",
    //     description: "validate definition against metaschema"
    // },
    logSchema: false,
    skipTestCase: (t) =>
        !["ecmascript-regex", "non-bmp-regex", "float-overflow", "zeroTerminatedFloats"].includes(t.name),
    metaSchema: draft04Meta
};

runAllTestCases(setup);
