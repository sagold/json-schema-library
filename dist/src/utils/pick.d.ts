export declare function pick<T extends {
    [P in keyof T]: unknown;
}, K extends keyof T>(value: T, ...properties: K[]): Pick<T, K>;
