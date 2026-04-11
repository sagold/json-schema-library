import { N as JsonSchemaValidatorParams, R as ValidationReturnType, S as Draft } from "./types-CqkCJmt8.mjs";

//#region src/formats/additionalFormats.d.ts
declare function addFormats(drafts: Draft[]): void;
declare const formats: Record<string, (options: JsonSchemaValidatorParams) => ValidationReturnType>;
//#endregion
export { addFormats, formats };
//# sourceMappingURL=formats.d.mts.map