export default <T>(value: T): T => JSON.parse(JSON.stringify(value));
