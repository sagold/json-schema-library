let isFile: (value: unknown) => value is File;
// @ts-expect-error forced types
isFile = () => false;

try {
    if (typeof File === "function") {
        isFile = (value: unknown) => value instanceof File;
    }
} catch (e) {} // eslint-disable-line

export { isFile };
