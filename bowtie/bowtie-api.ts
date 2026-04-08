import readline from "readline/promises";
import { JsonSchema } from "src/types";

export type Dialect =
    | "https://json-schema.org/draft/2020-12/schema"
    | "https://json-schema.org/draft/2019-09/schema"
    | "http://json-schema.org/draft-07/schema#"
    | "http://json-schema.org/draft-06/schema#"
    | "http://json-schema.org/draft-04/schema#"
    | "http://json-schema.org/draft-03/schema#";

type StartCmd = {
    cmd: "start";
    version: number;
};

type StartCmdResponse = {
    version: number;
    implementation: {
        /** library language */
        language: "typescript" | "typescript";
        /** library name */
        name: string;
        /** library version */
        version: string;
        homepage: string;
        issues: string;
        source: string;
        dialects: Dialect[];
        /** operating system platform */
        os: string;
        /** operating system version */
        os_version: string;
        /** Node.js version */
        language_version: string;
    };
};

type DialectCommand = {
    cmd: "dialect";
    dialect: Dialect;
};

type DialectCmdResponse = { ok: true };

type RunCmd = {
    cmd: "run";
    seq: number;
    // dialect: Dialect;
    case: {
        schema: JsonSchema;
        tests: {
            description: string;
            instance: unknown;
        }[];
        registry: Record<string, JsonSchema>;
    };
};

export type RunCmdResponse = {
    seq: number;
    results: ({ valid: boolean } | ErrorResponse)[];
};

export type ErrorResponse = {
    errored: true;
    context: {
        traceback?: string | undefined;
        message: string | undefined;
    };
};

type StopCommand = {
    cmd: "stop";
};

export type Command = StartCmd | RunCmd | DialectCommand | StopCommand;
export type CommandResponse = RunCmdResponse | StartCmdResponse | DialectCmdResponse | ErrorResponse | undefined;

export type CommandMap = {
    /** Start nxet test run, informing bowtie of suppored draft versions and general metadata */
    start: (args: StartCmd) => Promise<StartCmdResponse>;
    /** Set JSON Schema draft-version of following tests */
    dialect: (args: DialectCommand) => Promise<DialectCmdResponse>;
    /** Run test cases for a specfic schema */
    run: (args: RunCmd) => Promise<RunCmdResponse>;
    /** Finalize test run and exit container */
    stop: (args: StopCommand, stdio?: readline.Interface) => Promise<void>;
};

export const createBowtieError = (message: string, stack?: string): ErrorResponse => ({
    errored: true,
    context: {
        message: message,
        traceback: stack
    }
});

export function sendToBowtie(data?: Record<string, unknown>) {
    console.log(JSON.stringify(data ?? createBowtieError("missing response")));
}
