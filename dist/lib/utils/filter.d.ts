import { JsonError } from "../types";
export declare function isPromise(obj: unknown): obj is Promise<unknown>;
export declare function errorOrPromise(error: unknown): error is JsonError | Promise<unknown>;
export declare function errorsOnly(error: unknown): error is JsonError;
