export function copyDraft(draft) {
    return {
        ...draft,
        keywords: [...draft.keywords.map((f) => ({ ...f }))]
    };
}
