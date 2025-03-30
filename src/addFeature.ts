import { Draft, Feature } from "./types";

/**
 * Create a new draft adding or replacing a feature based on keyword
 */
export function addFeature(draft: Draft, feature: Feature): Draft {
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
