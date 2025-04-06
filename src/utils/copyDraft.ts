import { Draft } from "../types";

export function copyDraft(draft: Draft) {
    return {
        ...draft,
        keywords: [...draft.keywords.map((f) => ({ ...f }))]
    };
}
