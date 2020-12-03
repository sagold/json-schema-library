import Draft04 from "../../lib/cores/Draft04";
import runTest from "./testDraft04";
runTest(Draft04, [
    // ignore theese tests
    "a float is not an integer even without fractional part" // will always fail within javascript
]);
