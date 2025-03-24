import draft04Meta from "../../../remotes/draft04.json";
import runAllTestCases from "../utils/runTestCases";
runAllTestCases({
    // only: {
    //     name: "definitions",
    //     description: "validate definition against metaschema"
    // },
    logSchema: false,
    skipTestCase: (t) => !["ecmascript-regex", "non-bmp-regex", "float-overflow", "zeroTerminatedFloats"].includes(t.name),
    metaSchema: draft04Meta
});
