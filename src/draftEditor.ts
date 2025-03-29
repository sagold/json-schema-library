import { draft2019 } from "./draft2019";
import { oneOfFuzzyFeature } from "./features/oneOf";
import { Draft, Feature } from "./types";

function addFeature(draft: Draft, feature: Feature): Draft {
    const features = [...draft.features];
    const index = features.findIndex((f) => f.keyword === feature.keyword);
    if (index === -1) {
        features.push(feature);
    } else {
        features[index] = feature;
    }
    return {
        ...draft,
        features
    };
}

function pimpFeatures(draft: Draft) {
    draft.features.forEach((feature) => {
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
    });
    return draft;
}

/**
 * @draft-editor https://json-schema.org/draft/2019-09/release-notes
 *
 * Uses Draft 2019-09 and changes resolveOneOf to be fuzzy
 */
export const draftEditor: Draft = { ...pimpFeatures(addFeature(draft2019, oneOfFuzzyFeature)), $schemaRegEx: "." };
