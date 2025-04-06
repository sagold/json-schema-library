import draft2020Meta from "../../../remotes/draft2020-12.json";
import draft2020MetaApplicator from "../../../remotes/draft2020-12_meta_applicator.json";
import draft2020MetaContent from "../../../remotes/draft2020-12_meta_content.json";
import draft2020MetaCore from "../../../remotes/draft2020-12_meta_core.json";
import draft2020MetaFormatAnnotation from "../../../remotes/draft2020-12_meta_format_annotation.json";
import draft2020MetaFormatAssertion from "../../../remotes/draft2020-12_meta_format_assertion.json";
import draft2020MetaMetaData from "../../../remotes/draft2020-12_meta_meta_data.json";
import draft2020MetaUnevaluated from "../../../remotes/draft2020-12_meta_unevaluated.json";
import draft2020MetaValidation from "../../../remotes/draft2020-12_meta_validation.json";
import runAllTestCases from "../utils/runTestCases";

/**
 * @draft-2020-12 https://json-schema.org/draft/2020-12/release-notes
 *
 * - The items and additionalItems keywords have been replaced with prefixItems and items
 * - Although the meaning of items has changed, the syntax for defining arrays remains the same.
 *  Only the syntax for defining tuples has changed. The idea is that an array has items (items)
 *  and optionally has some positionally defined items that come before the normal items (prefixItems).
 * - The $recursiveRef and $recursiveAnchor keywords were replaced by the more powerful $dynamicRef and
 *  $dynamicAnchor keywords
 * - This draft specifies that any item in an array that passes validation of the contains schema is
 *  considered "evaluated".
 * - Regular expressions are now expected (but not strictly required) to support unicode characters.
 * - This draft drops support for the schema media type parameter
 * - If you reference an external schema, that schema can declare its own $schema and that may be different
 *  than the $schema of the referencing schema. Implementations need to be prepared to switch processing
 *  modes or throw an error if they don't support the $schema of the referenced schema
 * - Implementations that collect annotations should now include annotations for unknown keywords in the
 *  "verbose" output format.
 * - The format vocabulary was broken into two separate vocabularies. The "format-annotation" vocabulary
 *  treats the format keyword as an annotation and the "format-assertion" vocabulary treats the format
 *  keyword as an assertion. The "format-annotation" vocabulary is used in the default meta-schema and
 *  is required.
 *
 */
runAllTestCases({
    // only: {
    //     name: "unevaluatedItems"
    //     // description: "unevaluatedItems can see annotations from if without then and else"
    // },
    // logSchema: false,
    skipTestCase: (t) =>
        ![
            // "unevaluatedItems",
            "format", // vocabulary: annotation vs assertions
            // optional:
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
        draft2020MetaUnevaluated,
        draft2020MetaValidation
    ],
    skipTests: [
        // "A $dynamicRef without a matching $dynamicAnchor in the same schema resource behaves like a normal $ref to $anchor",
        // "A $dynamicRef resolves to the first $dynamicAnchor still in scope that is encountered when the schema is evaluated"
    ]
});
