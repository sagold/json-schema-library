import type { Keyword } from "./Keyword";
import { createSchema } from "./methods/createSchema";
import { toDataNodes } from "./methods/toDataNodes";
import { ErrorConfig } from "./types";
import { formats } from "./formats/formats";
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
    formats: typeof formats;
}
type PartialDraft = Partial<Omit<Draft, "errors" | "formats">> & {
    errors?: Partial<Draft["errors"]>;
    formats?: Partial<Draft["formats"]>;
};
export declare function extendDraft(draft: Draft, extension: PartialDraft): Draft;
export declare function addKeywords(draft: Draft, ...keywords: Keyword[]): Draft;
export declare function sanitizeKeywords(draft: Draft): Draft;
export {};
