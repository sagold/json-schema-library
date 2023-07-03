import { JsonError, JsonSchema } from "../types";
import { Draft } from "../draft";
declare const formatValidators: Record<string, (draft: Draft, schema: JsonSchema, value: unknown, pointer: string) => undefined | JsonError | JsonError[]>;
export default formatValidators;
