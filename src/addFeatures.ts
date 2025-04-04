import { copyDraft } from "./utils/copyDraft";
import { Draft, Feature } from "./types";

export function addFeatures(draft: Draft, ...features: Feature[]): Draft {
    const customizedDraft = copyDraft(draft);
    features.forEach((feature) => addFeature(customizedDraft, feature));
    return customizedDraft;
}

/**
 * Create a new draft adding or replacing a feature based on keyword
 */
function addFeature(draft: Draft, feature: Feature) {
    const index = draft.features.findIndex((f) => f.keyword === feature.keyword);
    if (index === -1) {
        draft.features.push(feature);
    } else {
        draft.features[index] = feature;
    }
}
