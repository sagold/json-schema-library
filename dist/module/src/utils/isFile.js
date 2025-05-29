let isFile;
// @ts-expect-error forced types
isFile = () => false;
try {
    if (typeof File === "function") {
        isFile = (value) => value instanceof File;
    }
}
catch (e) { } // eslint-disable-line
export { isFile };
