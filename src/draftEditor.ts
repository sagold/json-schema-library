import { draft2019 } from "./draft2019";
import { oneOfFuzzyFeature } from "./features/oneOf";
import { Draft } from "./types";

/**
 * @draft-2019 https://json-schema.org/draft/2019-09/release-notes
 *
 * new
 * - $anchor
 * - $recursiveAnchor and $recursiveRef
 * - $vocabulary
 *
 * changed
 * - $defs (renamed from definitions)
 * - $id
 * - $ref
 * - dependencies has been split into dependentSchemas and dependentRequired
 */
export const draftEditor: Draft = {
    version: "draft-2019-09",
    $schema: "https://json-schema.org/draft/2019-09/schema",
    features: draft2019.features
        .map((feature) => {
            if (feature.keyword === "oneOf") {
                return oneOfFuzzyFeature;
            }
            return feature;
        })
        .map((feature) => {
            const logKeyword = () => feature.keyword;
            if (feature.validate) {
                feature.validate.toJSON = logKeyword;
            }
            if (feature.reduce) {
                feature.reduce.toJSON = logKeyword;
            }
            if (feature.resolve) {
                feature.resolve.toJSON = logKeyword;
            }
            return feature;
        })
};
