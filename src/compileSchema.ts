import { copy } from "fast-copy";
import { getRef } from "./keywords/$ref";
import { draft04 } from "./draft04";
import { draft06 } from "./draft06";
import { draft07 } from "./draft07";
import { draft2019 } from "./draft2019";
import { draft2020 } from "./draft2020";
import { pick } from "./utils/pick";
import {
    JsonSchema,
    BooleanSchema,
    Draft,
    isJsonSchema,
    JsonAnnotation,
    JsonError,
    isJsonError,
    isJsonAnnotation,
    isBooleanSchema
} from "./types";
import { TemplateOptions } from "./methods/getData";
import { SchemaNode, SchemaNodeMethods, addKeywords, isSchemaNode } from "./SchemaNode";
import settings from "./settings";
import sanitizeErrors from "./utils/sanitizeErrors";

const { REGEX_FLAGS } = settings;

export type CompileOptions = {
    /**
     * List of drafts to support.
     *
     * Drafts are selected by testing the passed `schema.$schema` for a matching id, which
     * is tested by each draft's `Draft.$schemaRegEx`. In case no draft matches `schema.$schema`
     * the last draft in the list will be used.
     *
     * @default [draft04, draft06, draft07, draft2019, draft2020]
     *
     * @example
     * import { draft04, draft07, draft2020 } from "json-schema-library"
     * compileSchema({ $schema: "draft-04" }, { drafts: [draft04, draft07, draft2020] })
     */
    drafts?: Draft[];
    /**
     * Fallback _draft_ version in case no _draft_ is specified by `schema.$schema`.
     *
     * Drafts are selected by given `schema.$schema` or the last draft from `drafts` as a fallback.
     * Specifying `draft` will workthe same as a specifying `schema.$schema` in case no $schema is
     * defined. When no match can be found, the last _draft_ from `drafts` will be used.
     *
     * @example
     * // uses draft-04
     * compileSchema({ $schema: "draft-04" }, { drafts: [draft04, draft07, draft2020] })
     *
     * // uses draft-2020-12
     * compileSchema({}, { drafts: [draft04, draft07, draft2020] })
     *
     * // uses draft-07
     * compileSchema({}, { draft: "draft-07", drafts: [draft04, draft07, draft2020] })

     * // uses draft-04
     * compileSchema({ $schema: "draft-04" }, { draft: "draft-07", drafts: [draft04, draft07, draft2020] })
     *
     * // uses draft-2020
     * compileSchema({ $schema: "draft-04" }, { draft: "draft-07", drafts: [draft2020] })
     */
    draft?: string;
    /**
     * Set node and its remote schemata as remote schemata for this node and schema to resolve $ref
     */
    remote?: SchemaNode;
    /**
     * Enables `format`-keyword assertions when this is set tor `true` or sets assertion as defined by
     * the given meta-schema. Set to `false` to deactivate format validation.
     *
     * @default true
     */
    formatAssertion?: boolean | "meta-schema" | undefined;
    /** Set default options for all `node.getData` requests */
    getDataDefaultOptions?: TemplateOptions;
    /** Set to true to throw an Error on errors in input schema. Defaults to false */
    throwOnInvalidSchema?: boolean;
    /** Set to true to throw an Error when encountering an unresolvable ref  */
    throwOnInvalidRef?: boolean;
};

const defaultDrafts: Draft[] = [draft04, draft06, draft07, draft2019, draft2020];

function getDraft(drafts: Draft[], $schema: string) {
    return drafts.find((d) => new RegExp(d.$schemaRegEx, REGEX_FLAGS).test($schema)) ?? drafts[drafts.length - 1];
}

/**
 * With compileSchema we replace the schema and all sub-schemas with a schemaNode,
 * wrapping each schema with utilities and as much preevaluation as possible. Each
 * node will be reused for each task, but will create a compiledNode for bound data.
 */
export function compileSchema(schema: JsonSchema | BooleanSchema, options: CompileOptions = {}) {
    let formatAssertion = options.formatAssertion ?? true;
    const drafts = options.drafts ?? defaultDrafts;
    const draft = getDraft(drafts, isJsonSchema(schema) ? (options.draft ?? schema.$schema) : undefined);
    const node: SchemaNode & { schemaErrors?: JsonError[]; schemaAnnotations: JsonAnnotation[] } = {
        evaluationPath: "#",
        lastIdPointer: "#",
        schemaLocation: "#",
        dynamicId: "",
        reducers: [],
        resolvers: [],
        validators: [],
        schema: schema as JsonSchema,
        // @ts-expect-error self-reference added later
        context: {
            remotes: {},
            dynamicAnchors: {},
            ...(options.remote?.context ?? {}),
            anchors: {},
            refs: {},
            ...copy(pick(draft, "methods", "keywords", "version", "formats", "errors")),
            draft: options.draft,
            getDataDefaultOptions: options.getDataDefaultOptions,
            throwOnInvalidRef: options.throwOnInvalidRef ?? false,
            drafts
        },
        ...SchemaNodeMethods
    };

    node.context.rootNode = node;
    node.context.remotes[(isJsonSchema(schema) ? schema.$id : undefined) ?? "#"] = node;

    if (options.remote) {
        const metaSchema = getRef(node, node.schema.$schema);
        if (isSchemaNode(metaSchema) && metaSchema.schema.$vocabulary) {
            const vocabs = Object.keys(metaSchema.schema.$vocabulary);
            // const withAnnotations = vocabs.find((vocab) => vocab.includes("vocab/format-annotation"));
            const formatAssertionString = vocabs.find((vocab) => vocab.includes("vocab/format-assertion"));
            if (formatAssertionString && formatAssertion === "meta-schema") {
                formatAssertion = metaSchema.schema.$vocabulary[formatAssertionString] === true;
            }
            const validKeywords = Object.keys(metaSchema.getData({}, { addOptionalProps: true }) as object);
            if (validKeywords.length > 0) {
                node.context.keywords = node.context.keywords.filter((f) => validKeywords.includes(f.keyword));
            }
        }
    }

    if (formatAssertion === false) {
        node.context.keywords = node.context.keywords.filter((f) => f.keyword !== "format");
    }

    if (!isJsonSchema(schema) && !isBooleanSchema(schema)) {
        node.schemaErrors = [
            node.createError("schema-error", {
                pointer: "#",
                schema,
                value: undefined,
                message: `JSON schema must be object or boolean - reveived: '${schema}'`
            })
        ];
        return node;
    }

    // parse and validate schema
    let schemaValidation = addKeywords(node).filter((err) => err != null);
    schemaValidation = sanitizeErrors(schemaValidation);
    const schemaErrors: JsonError[] = [];
    const schemaAnnotations: JsonAnnotation[] = [];
    schemaValidation.forEach((error) => {
        if (isJsonError(error)) {
            schemaErrors.push(error);
        } else if (isJsonAnnotation(error)) {
            schemaAnnotations.push(error);
        }
    });

    if (options.throwOnInvalidSchema && schemaErrors.length > 0) {
        const error = new Error("Invalid schema passed to compileSchema");
        // @ts-expect-error unknown error-property
        error.data = schemaErrors;
        throw error;
    }

    node.schemaErrors = schemaErrors;
    node.schemaAnnotations = schemaAnnotations;

    return node;
}
