import { Draft } from "../types.js";

export function copyDraft(draft: Draft) {
    return {
        ...draft,
        keywords: [...draft.keywords.map((f: any) => ({ ...f }))]
    };
}
