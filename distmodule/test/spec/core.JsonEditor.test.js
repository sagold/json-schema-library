import JsonEditor from "../../lib/cores/JsonEditor";
import runTest from "./testDraft04";
runTest(JsonEditor, [
    // ignore theese tests
    "ref overrides any sibling keywords",
    "both oneOf valid (complex)",
    "a float is not an integer even without fractional part" // will always fail within javascript
]);
