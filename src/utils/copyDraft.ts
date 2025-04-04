import { Draft } from "../types";

export function copyDraft(draft: Draft) {
    return {
        ...draft,
        features: [...draft.features.map((f) => ({ ...f }))]
    };
}
