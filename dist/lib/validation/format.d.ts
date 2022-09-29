import { JSONError, JSONSchema } from "../types";
import { Draft } from "../draft";
declare const formatValidators: Record<string, (draft: Draft, schema: JSONSchema, value: unknown, pointer: string) => undefined | JSONError | JSONError[]>;
export default formatValidators;
