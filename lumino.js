/**
 * This is an implementation of the core axioms on which Firefly syntax is built on top of.
 */

class Template {
    constructor (nodes) {

    }
}

class Node {

}

class AccessNode {

}

class SpawnNode {

}

class InsertNode {
    constructor() {

    }
}

function createTemplate(nodes) {
    return spawnTemplate() {
        // for every nodes
        // create reactive listeners and such

    }
}

class Firefly {
    constructor(template) {
        this.properties = {};
    }
    initializeProperties() {
        // create static nodes for each property
        // eg 'addr_231': { type: 'spawn', source: 'addr_255' } will create a SpawnNode at address addr_231
    }
    resolveReferences() {
        // resolve references to other addresses and create reactive bindings
        // eg 'addr_231': { type: 'spawn', source: 'addr_255' } will take the SpawnNode at address addr_231,
        // and bind it to the value at addr_255, spawning from that value
    }
}

const template = {
    'addr_255': { type: 'access', source: 'addr_101', address: 'addr_751' }, // equivalent to `this[addr_255] = this[addr_101].[addr_751]`
    'addr_231': { type: 'spawn', source: 'addr_255' },                       // equivalent to `this[addr_231] = spawn(this[addr_255])
    insertions: [
        { source: 'addr_509', target: 'addr_999' },                          // equivalent to `this[addr_999] <: this[addr_509]`
    ],
    'addr_131': { type: 'insertions_next'},  // the address for retrieving the next node in the insertions iterator
    'addr_132': { type: 'insertions_value'}, // the address for retrieving the value at the current node in the insertions iterator
}
