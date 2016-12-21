const getTypeOf = require("./getTypeOf");
const typeValidation = require("./validation/type");


class Validator {

    constructor(dependencies, options) {
        this.step = dependencies.step;
    }

    validate(schema, data) {
        return typeValidation.validate(data, schema, this.step);
    }
}
