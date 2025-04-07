import { getTemplate } from "./methods/getTemplate";
import { ErrorConfig } from "./types";
import type { Keyword } from "./Keyword";
import { createSchema } from "./methods/createSchema";
import { each } from "./methods/each";
import { getChildSchemaSelection } from "./methods/getChildSchemaSelection";
import { formats } from "./formats/formats";
export type DraftVersion = "draft-04" | "draft-06" | "draft-07" | "draft-2019-09" | "draft-2020-12" | "latest";
export type Draft = {
    /** test-string if draft can be used with $schema-url */
    $schemaRegEx: string;
    /** draft-version of this draft, e.g. draft-2020-12 */
    version: DraftVersion;
    /** supported keywords and implementation */
    keywords: Keyword[];
    /** draft-dependent methods */
    methods: {
        createSchema: typeof createSchema;
        getChildSchemaSelection: typeof getChildSchemaSelection;
        getTemplate: typeof getTemplate;
        each: typeof each;
    };
    /** meta-schema url associated with this draft */
    $schema?: string;
    /** draft errors (this can still be global) */
    errors: ErrorConfig;
    formats: typeof formats;
};
