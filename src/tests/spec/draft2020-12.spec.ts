import draft2020Meta from "../../../remotes/draft2020-12.json";
import draft2020MetaApplicator from "../../../remotes/draft2020-12_meta_applicator.json";
import draft2020MetaContent from "../../../remotes/draft2020-12_meta_content.json";
import draft2020MetaCore from "../../../remotes/draft2020-12_meta_core.json";
import draft2020MetaFormatAnnotation from "../../../remotes/draft2020-12_meta_format_annotation.json";
import draft2020MetaFormatAssertion from "../../../remotes/draft2020-12_meta_format_assertion.json";
import draft2020MetaMetaData from "../../../remotes/draft2020-12_meta_meta_data.json";
import draft2020MetaValidation from "../../../remotes/draft2020-12_meta_validation.json";
import runAllTestCases from "../utils/runTestCases";

runAllTestCases({
    // only: {
    //     name: "unevaluatedProperties",
    //     description: "unevaluatedProperties with nested unevaluatedProperties"
    // },
    // logSchema: false,
    skipTestCase: (t) =>
        ![
            "uniqueItems",
            "ref",
            "unevaluatedItems",
            "unevaluatedProperties",
            "prefixItems",
            "items",
            "format",
            "defs",
            // optional:
            "dynamicRef",
            "format-email",
            "format-ecmascript-regex",
            // 2019:
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
    metaSchema: draft2020Meta,
    metaSchemaList: [
        draft2020MetaApplicator,
        draft2020MetaCore,
        draft2020MetaContent,
        draft2020MetaFormatAnnotation,
        draft2020MetaFormatAssertion,
        draft2020MetaMetaData,
        draft2020MetaValidation
    ]
});
