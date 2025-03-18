/* eslint max-len: 0 */
import draft2019Meta from "../../../remotes/draft2019-09.json";
import draft2019MetaApplicator from "../../../remotes/draft2019-09_meta_applicator.json";
import draft2019MetaContent from "../../../remotes/draft2019-09_meta_content.json";
import draft2019MetaCore from "../../../remotes/draft2019-09_meta_core.json";
import draft2019MetaFormat from "../../../remotes/draft2019-09_meta_format.json";
import draft2019MetaMetaData from "../../../remotes/draft2019-09_meta_meta-data.json";
import draft2019MetaValidation from "../../../remotes/draft2019-09_meta_validation.json";
import runAllTestCases from "../utils/runTestCases";

runAllTestCases({
    // only: {
    //     name: "unevaluatedProperties",
    //     description: "unevaluatedProperties with nested unevaluatedProperties"
    // },
    // logSchema: false,
    skipTestCase: (t) =>
        ![
            "vocabulary", // must
            // optionals
            "cross-draft", // must
            "ecmascript-regex", // should
            "float-overflow",
            "format-idn-hostname",
            "format-iri",
            "format-iri-reference",
            "non-bmp-regex", // should
            "refOfUnknownKeyword" // reference to undefined schema definitions... we support configurations for this
        ].includes(t.name),
    /*
        ✖ vocabulary - skipped evaluation of meta-schema

        ✓ not - expect for uncle-schema support
        ✓ unevaluatedProperties
        ✓ unevaluatedItems
        ✓ additionalItems
        ✓ additionalProperties
        ✓ allOf
        ✓ anchor
        ✓ anyOf
        ✓ boolean_schema
        ✓ const
        ✓ contains
        ✓ content
        ✓ default
        ✓ defs
        ✓ dependentRequired
        ✓ enum
        ✓ exclusiveMaximum
        ✓ exclusiveMinimum
        ✓ format
        ✓ if-then-else
        ✓ infinite-loop-detection
        ✓ items
        ✓ maxContains
        ✓ maximum
        ✓ maxItems
        ✓ maxLength
        ✓ maxProperties
        ✓ minContains
        ✓ minimum
        ✓ minItems
        ✓ minLength
        ✓ minProperties
        ✓ multipleOf
        ✓ oneOf
        ✓ pattern
        ✓ patternProperties
        ✓ properties
        ✓ propertyNames
        ✓ recursiveRef
        ✓ ref
        ✓ refRemote
        ✓ required
        ✓ type
        ✓ uniqueItems
        ✓ unknownKeyword
    */
    metaSchema: draft2019Meta,
    metaSchemaList: [
        draft2019MetaApplicator,
        draft2019MetaCore,
        draft2019MetaContent,
        draft2019MetaFormat,
        draft2019MetaMetaData,
        draft2019MetaValidation
    ]
});
