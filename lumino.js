/**
 * This is an implementation of the core axioms on which Firefly syntax is built on top of.
 * 
 * Two base classes:
 *   * Actor: defines the core methods of each actor
 *   * Binding: defines the pub-sub framework
 */

class Undefined_Class extends Actor {
    isUndefined = true
    constructor() {}
    initializeProperties() {}
    resolveReferences() {}
    addItem() {}
    removeItem() {}
    setNext() {}
    farewell() {}
}

const UNDEFINED = new Undefined_Class();

class Binding {
    constructor (spec, parent, subjectAddr) {
        this.spec = spec;
        this.parent = parent;
        this.listeners = new Set();
        this.subjectAddr = subjectAddr;

        parent.bindings.add(this);
    }
    resolveReferences () {
        if (!this.subjectAddr)
            return;

        this.subject = parent.properties[this.subjectAddr];
        this.subject.subscribe(this.update);
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
				listener(oldValue, newValue);
			}
		}
	}
    destruct () {
        if (this.subject) {
            this.subject.unsubscribe(this.update);
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

        this.target = spec.target;
        this.id = InsertionBinding.generateId();
    }
    resolveReferences() {
        super.resolveReferences();
        this.sourceValue = parent.properties[spec.source];
        // note: we never addItem() to the initial target since the initial target is guaranteed to be UNDEFINED
    }
    onChange (oldTarget, newTarget) {
        oldTarget.removeItem(this.sourceValue);
        newTarget.addItem(this.sourceValue);

        this.subject = newTarget;
    }
    destruct () {
        const target = this.subject;
        target.removeItem(sourceBinding);
        super.destruct();
    }
}

// every insertion has an id because collectors can contain duplicates,
// so this is an easy way to tell duplicates apart
InsertionBinding.currentId = 0;
InsertionBinding.generateId = function () {
    return InsertionBinding.currentId++;
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

// Bindings will reference other bindings in the network, so we create the network in two stages:
// 1. initialize properties, aka create nodes
// 2. resolve references, aka bind nodes to each other

// Initially, all values are UNDEFINED, and no bindings are triggered.
// The network will come alive when the actor starts receiving values via insertions (see Firefly class).
class Actor {
    constructor () {
        this.properties = {};
        this.bindings = new Set();
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

class InboxItem extends Actor {
    constructor (value, inbox_next, inbox_value) {
        this.value = value;
        this.inbox_next = inbox_next;
        this.inbox_value = inbox_value;
    }
    initializeProperties () {
        this.properties = {
            [this.inbox_value]: this.value,
            [this.inbox_next]: new OrderingBinding(this),
        };
    }
    setNext (inboxItem) {
        this.properties[this.inbox_next].setNext(inboxItem);
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

        this.initializeProperties();
        this.resolveReferences();
    }
    initializeProperties () {
        // create static nodes for each property
        // eg 'addr_231': { type: 'spawn', source: 'addr_255' } will create a SpawnNode at address addr_231
        for (const { address, binding } of Object.entries(this.template.properties)) {
            switch (binding.type) {
                case 'access': this.properties[address] = new AccessBinding(binding, this); break;
                case 'spawn': this.properties[address] = new SpawnBinding(binding, this); break;
                case 'inbox_next': this.inbox_next = address; break;
                case 'inbox_val': this.inbox_value = address; break;
                default: throw Error(`unknown node type "${binding.type}"`);
            }
        }
        this.properties[this.inbox_next] = new OrderingBinding(this);
    }
    deliverOutbox () {
        for (const bindingSpec of this.template.outbox) {
            new InsertionBinding(bindingSpec, this);
        }
    }
    setNext (inboxItem) {
        this.properties[this.inbox_next].setNext(inboxItem);
    }
    getTail () {
        return this.inboxDummyItem.prev;
    }
    addItem (value) {
        const newTail = new InboxItem(value, this.inbox_next, this.inbox_value);
        const prevTail = this.getTail();

        this.inbox.set(value, newTail); // add item to inbox
        prevTail.setNext(newTail);      // setNext() is used to set the item's inbox_next property
        prevTail.next = newTail;        // .next and .prev are for linked-list housekeeping
        newTail.prev = prevTail;
    }
    removeItem (value) {
        const item = this.inbox.get(value);
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

const template = {
    properties: {
        'addr_255': { type: 'access', source: 'addr_101', address: 'addr_751' }, // equivalent to `this[addr_255] = this[addr_101].[addr_751]`
        'addr_231': { type: 'spawn', source: 'addr_255' },                       // equivalent to `this[addr_231] = spawn(this[addr_255])
        'addr_131': { type: 'inbox_next'},  // the address for retrieving the next node in the inbox iterator
        'addr_132': { type: 'inbox_value'}, // the address for retrieving the value at the current node in the inbox iterator
    },
    outbox: [
        { source: 'addr_509', target: 'addr_999' },                          // equivalent to `this[addr_999] <: this[addr_509]`
    ],
}
