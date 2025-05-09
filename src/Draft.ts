import type { JsonSchemaValidator, Keyword } from "./Keyword";
import { copyDraft } from "./utils/copyDraft";
import { createSchema } from "./methods/createSchema";
import { toDataNodes } from "./methods/toDataNodes";
import { ErrorConfig } from "./types";
import { getChildSelection } from "./methods/getChildSelection";
import { getData } from "./methods/getData";

export type DraftVersion = "draft-04" | "draft-06" | "draft-07" | "draft-2019-09" | "draft-2020-12" | "latest";

export interface Draft {
    /** test-string if draft can be used with $schema-url */
    $schemaRegEx: string;
    /** draft-version of this draft, e.g. draft-2020-12 */
    version: DraftVersion;
    /** supported keywords and implementation */
    keywords: Keyword[];
    /** draft-dependent methods */
    methods: {
        createSchema: typeof createSchema;
        getChildSelection: typeof getChildSelection;
        getData: typeof getData;
        toDataNodes: typeof toDataNodes;
    };
    /** meta-schema url associated with this draft */
    $schema?: string;
    /** draft errors (this can still be global) */
    errors: ErrorConfig;
    formats: Record<string, JsonSchemaValidator>;
}

type PartialDraft = Partial<Omit<Draft, "errors" | "formats">> & {
    errors?: Partial<Draft["errors"]>;
    formats?: Partial<Draft["formats"]>;
};

export function extendDraft(draft: Draft, extension: PartialDraft) {
    const { keywords } = addKeywords(draft, ...(extension.keywords ?? []));
    const errors = { ...draft.errors, ...(extension.errors ?? {}) };
    const formats = { ...draft.formats, ...(extension.formats ?? {}) };
    return sanitizeKeywords({
        ...draft,
        ...extension,
        formats,
        keywords,
        errors
    });
}

export function addKeywords(draft: Draft, ...keywords: Keyword[]): Draft {
    const customizedDraft = copyDraft(draft);
    keywords.forEach((keyword) => addKeyword(customizedDraft, keyword));
    return customizedDraft;
}

/**
 * Create a new draft adding or replacing a keyword based on keyword-property
 */
function addKeyword(draft: Draft, keyword: Keyword) {
    const index = draft.keywords.findIndex((f) => f.keyword === keyword.keyword);
    if (index === -1) {
        draft.keywords.push(keyword);
    } else {
        draft.keywords[index] = keyword;
    }
}

export function sanitizeKeywords(draft: Draft) {
    draft.keywords.forEach((keyword) => {
        const logKeyword = () => keyword.keyword;
        if (keyword.validate) {
            keyword.validate.toJSON = logKeyword;
            keyword.validate.order = keyword.order ?? 0;
        }
        if (keyword.reduce) {
            keyword.reduce.toJSON = logKeyword;
            keyword.reduce.order = keyword.order ?? 0;
        }
        if (keyword.resolve) {
            keyword.resolve.toJSON = logKeyword;
            keyword.resolve.order = keyword.order ?? 0;
        }
    });
    draft.keywords.sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
    return draft;
}
