/**
 * This is an implementation of the core axioms on which Firefly syntax is built on top of.
 * 
 * Two base classes:
 *   * Actor: defines the core methods of each actor
 *   * Binding: defines the pub-sub framework
 */

// for debugging. All actors and bindings given a unique id.
let idCounter = 0;
let generateId = () => idCounter++;

class Binding {
    constructor (spec, parent, subjectAddr) {
        this.spec = spec;
        this.parent = parent;
        this.listeners = new Set();
        this.subjectAddr = subjectAddr;
        this.id = generateId();

        parent.bindings.add(this); // register binding to parent, so when the parent destructs, the binding will destruct as well
    }
    resolveReferences () {
        if (!this.subjectAddr)
            return;

        this.subject = this.parent.getBinding(this.subjectAddr);
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

class AccessBinding extends Binding {
    constructor (spec, parent) {
        super(spec, parent, spec.source);
        this.sourceAddr = spec.source;
        this.accessAddr = spec.address;
        this.value = UNDEFINED;
    }
	onChange (oldSource, newSource) {
        return newSource.get(this.accessAddr);
    }
}

class SpawnBinding extends Binding {
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

// note: this works a bit differently from most bindings
// nobody listens to it, has no "value", all it does is bind to the target, and rebind to the target if target changes
class InsertionBinding extends Binding {
    constructor (spec, parent) {
        super(spec, parent, spec.target);

        this.sourceAddr = spec.source;
        this.targetAddr = spec.target;
    }
    resolveReferences() {
        super.resolveReferences();
        this.sourceValue = this.parent.getBinding(this.sourceAddr);
        // note: we never addItem() to the initial target since the initial target is guaranteed to be UNDEFINED
    }
    onChange (oldTarget, newTarget) {
        oldTarget.removeItem(this.sourceValue);
        newTarget.addItem(this.sourceValue);

        this.subject = newTarget;
    }
    destruct () {
        const target = this.subject;
        target.removeItem(this.sourceValue);
        super.destruct();
    }
}

// this is really just to add a pub-sub mechanism to the next item pointer for each inbox item
// Unlike other bindings, OrderingBinding doesn't subscribe to a subject since values are manually set.
class OrderingBinding extends Binding {
    constructor (parent) {
        super(null, parent, null); // Parent is passed in so that the OrderingBinding gets destructed when InboxItem gets destroyed
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
const NULL_BINDING = new Binding(null, {bindings: new Set()}, null);


// Bindings will reference other bindings in the network, so we create the network in two stages:
//   1. initialize properties, aka create nodes
//   2. resolve references, aka bind nodes to each other
// Initially, all values are UNDEFINED, and no bindings are triggered.
// The network will come alive when the actor starts receiving values via insertions (see Firefly class).
class Actor {
    constructor () {
        this.properties = {};
        this.bindings = new Set();
        this.id = generateId();
    }
    getBinding (address) {
        const binding = this.properties[address];
        if (!binding) {
            console.warn(`Warning: null binding access in Actor ${this.id}`);
            return NULL_BINDING;
        }
        return binding;
    }
    get (address) {
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
        for (const binding of this.bindings.values()) {
            binding.resolveReferences();
        }
    }
    farewell () { // destructor
        for (const binding of this.bindings.values()) {
            binding.destruct();
        }
    }
}

class Undefined_Class extends Actor {
    isUndefined = true
    initializeProperties() {}
    resolveReferences() {}
    addItem() {}
    removeItem() {}
    setNext() {}
    farewell() {}
}

const UNDEFINED = new Undefined_Class();

class InboxItem extends Actor {
    constructor (valueBinding, inbox_next, inbox_value) {
        super();
        this.valueBinding = valueBinding;
        this.inbox_next = inbox_next;
        this.inbox_value = inbox_value;

        this.initializeProperties();
        this.resolveReferences(); // doesn't do anything for now
    }
    initializeProperties () {
        this.properties = {
            [this.inbox_value]: this.valueBinding,
            [this.inbox_next]: new OrderingBinding(this),
        };
    }
    setNext (inboxItem) {
        this.getBinding(this.inbox_next).setNext(inboxItem);
    }
}

// the main actor class
class Firefly extends Actor {
    constructor (template) {
        super();
        this.template = template;
        this.inbox = new Map(); // a map of <value, inboxitem>. Note: every incoming value has to be wrapped in an InboxItem

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
        for (const [address, binding] of Object.entries(this.template.properties)) {
            switch (binding.type) {
                case 'access': this.properties[address] = new AccessBinding(binding, this); break;
                case 'spawn': this.properties[address] = new SpawnBinding(binding, this); break;
                case 'inbox_next': this.inbox_next = address; break;
                case 'inbox_value': this.inbox_value = address; break;
                default: throw Error(`unknown node type "${binding.type}"`);
            }
        }
        this.properties[this.inbox_next] = new OrderingBinding(this);
        
        for (const bindingSpec of this.template.outbox) {
            new InsertionBinding(bindingSpec, this);
        }
    }
    setNext (inboxItem) {
        this.getBinding(this.inbox_next).setNext(inboxItem);
    }
    getTail () {
        return this.dummyHead.prev;
    }
    addItem (valueBinding) {
        const newTail = new InboxItem(valueBinding, this.inbox_next, this.inbox_value);
        const prevTail = this.getTail();

        this.inbox.set(valueBinding, newTail); // add item to inbox
        prevTail.setNext(newTail);      // setNext() is used to set the item's inbox_next property
        prevTail.next = newTail;        // .next and .prev are for linked-list housekeeping
        newTail.prev = prevTail;
    }
    removeItem (valueBinding) {
        const item = this.inbox.get(valueBinding);
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
