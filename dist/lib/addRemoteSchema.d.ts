import { Draft } from "./draft";
import { JsonSchema } from "./types";
/**
 * register a json-schema to be referenced from another json-schema
 * @param url    base-url of json-schema (aka id)
 * @param schema
 */
export default function addRemoteSchema(draft: Draft, url: string, schema: JsonSchema): void;
