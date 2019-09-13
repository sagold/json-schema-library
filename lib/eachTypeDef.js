const gp = require("gson-pointer");
const getTypeDefs = require("./schema/getTypeDefs");
const isObject = value => Object.prototype.toString.call(value) === "[object Object]";


function nextTypeDefs(schema, pointer) {
    if (this.callback(schema, pointer) === true) {
        return; // stop iteration
    }

    const defs = getTypeDefs(schema);
    defs.forEach(next => this.nextTypeDefs(next.def, gp.join(pointer, next.pointer, false)));
}


function eachDefinition(walk, schema, pointer) {
    Object.keys(schema.definitions)
        .forEach(defId => {
            if (!isObject(schema.definitions[defId])) {
                console.log(`Invalid schema in ${pointer}/definitions/${defId}`);
                return;
            }
            walk.nextTypeDefs(schema.definitions[defId], gp.join(pointer, "definitions", defId, false));
        });
}


module.exports = function eachTypeDef(schema, callback, pointer = "#") {
    const walk = { callback, nextTypeDefs };
    walk.nextTypeDefs(schema, pointer);

    if (schema.definitions == null) {
        return;
    }

    walk.callback = (defschema, pointer) => {
        callback(defschema, pointer);
        if (defschema.definitions != null) {
            eachDefinition(walk, defschema, pointer);
        }
    };

    eachDefinition(walk, schema, pointer);
};
