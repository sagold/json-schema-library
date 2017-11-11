const Draft04 = require("../../lib/cores/Draft04");
require("./testDraft04")(Draft04, [
    // ignore theese tests
    "changed scope ref invalid", // not going to be supported (combination of id, folder (folder!!!), refs)
    "a float is not an integer even without fractional part", // will always fail within javascript
    // "ref valid, maxItems ignored",
    // TestCases: not required but complex logic
    "base URI change",
    "base URI change - change folder in subschema",
    "root ref in remote ref",
    "Recursive references between schemas",
    "base URI change - change folder" // weird stuff, totally inpractical
]);
