/**
 * This is an implementation of the core axioms on which Firefly syntax is built on top of.
 * 
 * Two base classes:
 *   * Actor: defines the core methods of each actor
 *   * Node: stores values, makes up the pub-sub framework
 */

// for debugging. All actors and nodes given a unique id.
let idCounter = 0;
let generateId = () => idCounter++;

class Node {
    constructor (spec, parent, subjectAddr) {
        this.spec = spec;
        this.parent = parent;
        this.listeners = new Set();
        this.subjectAddr = subjectAddr;
        this.id = generateId();

        parent.nodes.add(this); // register node to parent, so when the parent destructs, the node will destruct as well
    }
    resolveReferences () {
        if (!this.subjectAddr)
            return;

        this.subject = this.parent.getNode(this.subjectAddr);
        this.subject.subscribe(this);
    }
	subscribe (listener) {
		this.listeners.add(listener);
	}
	unsubscribe (listener) {
		this.listeners.remove(listener);
    }
    // optionally returns a value, and will notify listeners if that value changes
	onChange (oldSubjectValue, newSubjectValue) {
		throw Error(`Unimplemented ${this.constructor.name}.onChange() function`);
    }
	update (oldSubjectValue, newSubjectValue) {
        console.log(`updating ${this.constructor.name} with id ${this.id}`); // for debugging
        const newValue = this.onChange(oldSubjectValue, newSubjectValue);
		if (this.value != newValue) {
            const oldValue = this.value;
            this.value = newValue;
			for (const listener of this.listeners) {
				listener.update(oldValue, newValue);
			}
		}
	}
    destruct () {
        if (this.subject) {
            this.subject.unsubscribe(this);
        }
    }
}

class AccessNode extends Node {
    constructor (spec, parent) {
        super(spec, parent, spec.source);
        this.sourceAddr = spec.source;
        this.accessAddr = spec.address;
        this.value = UNDEFINED;
    }
	onChange (oldSource, newSource) {
        return newSource.getValue(this.accessAddr);
    }
}

class SpawnNode extends Node {
    constructor (spec, parent) {
        super(spec, parent, spec.source);
        this.sourceAddr = spec.source;
        this.value = UNDEFINED;
    }
	onChange (oldSource, newSource) {
        this.value.farewell(); // destruct the prev child if spec changed
        return newSource ? new Firefly(newSource) : UNDEFINED;
    }
    destruct () {
        this.value.farewell();
        super.destruct();
    }
}

// note: this works a bit differently from most nodes
// nobody listens to it, has no "value", all it does is bind to the target, and rebind to the target if target changes
class InsertionNode extends Node {
    constructor (spec, parent) {
        super(spec, parent, spec.target);

        this.sourceAddr = spec.source;
        this.targetAddr = spec.target;
    }
    resolveReferences() {
        super.resolveReferences();
        this.sourceNode = this.parent.getNode(this.sourceAddr);
        // note: we never addItem() to the initial target since the initial target is guaranteed to be UNDEFINED
    }
    onChange (oldTarget, newTarget) {
        oldTarget.removeItem(this.sourceNode);
        newTarget.addItem(this.sourceNode);

        this.subject = newTarget;
    }
    destruct () {
        const target = this.subject;
        target.removeItem(this.sourceNode);
        super.destruct();
    }
}

// this is really just to add a pub-sub mechanism to the next item pointer for each inbox item
// Unlike other nodes, OrderingNode doesn't subscribe to a subject since values are manually set.
class OrderingNode extends Node {
    constructor (parent) {
        super(null, parent, null); // Parent is passed in so that the OrderingNode gets destructed when InboxItem gets destroyed
        this.value = UNDEFINED;
    }
    onChange (oldNextItem, newNextItem) {
        return newNextItem;
    }
    setNext (newValue = UNDEFINED) {
        this.update(this.value, newValue); // manually set value and notify subscribers
    }
}

// Null bindings are when a node in the lumino network tries to reference a node that was never defined in the spec.
// This should rarely happen, since a null binding will always return UNDEFINED, so it's not very useful.
const NULL_BINDING = new Node(null, {nodes: new Set()}, null);


// We create the network in two stages:
//   1. initialize properties, aka create nodes
//   2. resolve references, aka bind nodes to each other
// Initially, all values are UNDEFINED, and no bindings are triggered.
// The network will come alive when the actor starts receiving values via insertions (see Firefly class).
class Actor {
    constructor () {
        this.properties = {};
        this.nodes = new Set();
        this.id = generateId();
    }
    getNode (address) {
        const node = this.properties[address];
        if (!node) {
            console.warn(`Warning: null node access in Actor ${this.id}`);
            return NULL_BINDING;
        }
        return node;
    }
    getValue (address) {
        return this.properties[address] ? this.properties[address].value : UNDEFINED;
    }
    // create static nodes for each property
    // eg 'addr_231': { type: 'spawn', source: 'addr_255' } will create a SpawnNode at address addr_231
    initializeProperties () {
		throw Error(`Unimplemented ${this.constructor.name}.initializeProperties() function`);
    }
    // resolve references to other addresses and create reactive bindings
    // eg 'addr_231': { type: 'spawn', source: 'addr_255' } will take the SpawnNode at address addr_231,
    // and bind it to the value at addr_255, spawning from that value
    resolveReferences () {
        for (const node of this.nodes.values()) {
            node.resolveReferences();
        }
    }
    farewell () { // destructor
        for (const node of this.nodes.values()) {
            node.destruct();
        }
    }
}

class UndefinedActor extends Actor {
    isUndefined = true
    initializeProperties() {}
    resolveReferences() {}
    addItem() {}
    removeItem() {}
    setNext() {}
    farewell() {}
}

const UNDEFINED = new UndefinedActor();

class InboxItem extends Actor {
    constructor (valueNode, inbox_next, inbox_value) {
        super();
        this.valueNode = valueNode;
        this.inbox_next = inbox_next;
        this.inbox_value = inbox_value;

        this.initializeProperties();
        this.resolveReferences(); // doesn't do anything for now
    }
    initializeProperties () {
        this.properties = {
            [this.inbox_value]: this.valueNode,
            [this.inbox_next]: new OrderingNode(this),
        };
    }
    setNext (inboxItem) {
        this.getNode(this.inbox_next).setNext(inboxItem);
    }
}

// the main actor class
// TODO: separate linked-list into a separate class?
class Firefly extends Actor {
    constructor (template) {
        super();
        this.template = template;
        this.inbox = new Map(); // a map of <node, inboxitem>. Note: every incoming node has to be wrapped in an InboxItem

        // initialize circular linked list
        const inboxDummyItem = this;  // use self as a dummy first item
        inboxDummyItem.next = inboxDummyItem;
        inboxDummyItem.prev = inboxDummyItem;

        this.dummyHead = inboxDummyItem;

        this.initializeProperties();
        this.resolveReferences();
    }
    initializeProperties () {
        // create static nodes for each property
        // eg 'addr_231': { type: 'spawn', source: 'addr_255' } will create a SpawnNode at address addr_231
        for (const [address, node] of Object.entries(this.template.properties)) {
            switch (node.type) {
                case 'access': this.properties[address] = new AccessNode(node, this); break;
                case 'spawn': this.properties[address] = new SpawnNode(node, this); break;
                case 'inbox_next': this.inbox_next = address; break;
                case 'inbox_value': this.inbox_value = address; break;
                default: throw Error(`unknown node type "${node.type}"`);
            }
        }
        this.properties[this.inbox_next] = new OrderingNode(this);
        
        for (const nodeSpec of this.template.outbox) {
            new InsertionNode(nodeSpec, this);
        }
    }
    setNext (inboxItem) {
        this.getNode(this.inbox_next).setNext(inboxItem);
    }
    getTail () {
        return this.dummyHead.prev;
    }
    addItem (valueNode) {
        const newTail = new InboxItem(valueNode, this.inbox_next, this.inbox_value);
        const prevTail = this.getTail();

        this.inbox.set(valueNode, newTail); // add item to inbox
        prevTail.setNext(newTail);      // setNext() is used to set the item's inbox_next property
        prevTail.next = newTail;        // .next and .prev are for linked-list housekeeping
        newTail.prev = prevTail;
    }
    removeItem (valueNode) {
        const item = this.inbox.getValue(valueNode);
        if (this.inbox.delete(item)) {
            item.prev.setNext(item.next);
            item.prev.next = item.next;
            item.next.prev = item.prev;
            item.farewell();
        }
    }
    farewell () {
        for (const item of this.inbox.values()) {
            item.farewell();
        }
        super.farewell();
    }
}

// example
const template = {
    properties: {
        'addr_255': { type: 'access', source: 'addr_101', address: 'addr_751' }, // equivalent to `this[addr_255] = this[addr_101].[addr_751]`
        'addr_231': { type: 'spawn', source: 'addr_255' },                       // equivalent to `this[addr_231] = spawn(this[addr_255])
        'addr_131': { type: 'inbox_next' },  // the address for retrieving the next node in the inbox iterator
        'addr_132': { type: 'inbox_value' }, // the address for retrieving the value at the current node in the inbox iterator
    },
    outbox: [
        { source: 'addr_509', target: 'addr_999' },                          // equivalent to `this[addr_999] <: this[addr_509]`
    ],
}

export {
    UNDEFINED,
    Firefly,
};
