export declare function pick<T extends Record<string, unknown>, K extends keyof T>(value: T, ...properties: K[]): Pick<T, K>;
