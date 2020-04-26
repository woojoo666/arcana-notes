/**
 * This is an implementation of the core axioms on which Firefly syntax is built on top of.
 * 
 * Two base classes:
 *   * Actor: defines the core methods of each actor
 *   * Binding: defines the pub-sub framework
 */

class Template {
    constructor (nodes) {

    }
}

class Undefined_Class extends Actor {
    subscribe () {}
    unsubscribe() {}
    evaluate() {}
}

const UNDEFINED = new Undefined_Class();

class Binding {
    constructor (spec, parent) {
        this.spec = spec;
        this.parent = parent;
        this.listeners = new Set();
    }
    resolveReferences () {
		throw Error(`Unimplemented ${this.constructor.name}.resolveReferences() function`);
    }
	subscribe (listener) {
		this.listeners.add(listener);
	}
	unsubscribe (listener) {
		this.listeners.remove(listener);
	}
	// sets the value. Must return a Firefly or undefined
	evaluate () {
		throw Error(`Unimplemented ${this.constructor.name}.evaluate() function`);
	}
	update () {
		console.log(`updating ${this.constructor.name} with id ${this.id}`); // for debugging
		const oldValue = this.value;
		this.value = this.evaluate();
		if (this.value != oldValue) {	
			for (const listener of this.listeners) {
				listener.update();
			}
		}
	}
    destruct () {

    }
}

class AccessBinding extends Binding {
    constructor (spec, parent) {
        super(spec, parent);
        this.sourceAddr = spec.source;
        this.accessAddr = spec.address;
    }
    evaluate () {
        const prevSourceActor = this.sourceActor;
        this.sourceActor = this.parent.get(this.sourceAddr);
        if (this.sourceActor != prevSourceActor) {
            prevSourceActor
        }
        return sourceActor.get(this.accessAddr);
    }
}

class SpawnBinding extends Binding {
    constructor (spec, parent) {
        super(spec, parent);
        this.source = spec.source;
    }
    evaluate () {
        // TODO: do we need to check if the spec changed? or is that already handled during Binding.update()?
        const template = this.parent.get(this.source);
        return template ? new Firefly(template) : UNDEFINED;
    }
}

class OutboxItem extends Binding {
    constructor (spec, parent) {
        super(spec, parent);
        this.source = spec.source;
        this.target = spec.target;
        this.id = OutboxItem.generateId();
    }
    evaluate () {
        return this.parent[this.source] || UNDEFINED;
    }
}

// every outbox item has an id because collectors can contain duplicates,
// so this is an easy way to tell duplicates apart
OutboxItem.currentId = 0;
OutboxItem.generateId = function () {
    OutboxItem.currentId++;
    return OutboxItem.currentId;
}

function createTemplate(nodes) {
    return spawnTemplate() {
        // for every nodes
        // create reactive listeners and such

    }
}

class Actor {
    constructor () {
        this.properties = {};
    }
    get (address) {
        return this.properties[address] ? this.properties[address].value : UNDEFINED;
    }
    despawn () {

    }
}

class InboxItem extends Actor {
    constructor (actor, inbox_next, inbox_value) {
        this.inbox_next = inbox_next;
        this.inbox_value = inbox_value;
        this.properties = {
            [inbox_value]: actor,
        };
    }
    setNext (inboxItem) {
        this.properties[this.inbox_next] = inboxItem;
    }
}

// the main actor class
class Firefly extends Actor {
    constructor (template) {
        super();
        this.template = template;
        this.inbox = new Set();
        this.initializeProperties();
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
    }
    resolveReferences () {
        // resolve references to other addresses and create reactive bindings
        // eg 'addr_231': { type: 'spawn', source: 'addr_255' } will take the SpawnNode at address addr_231,
        // and bind it to the value at addr_255, spawning from that value

    }
    setNext (inboxItem) {
        this.properties[this.inbox_next] = inboxItem;
    }
    processInbox () {
        const head = this;
        const currentItem = head;
        for (const actor of this.inbox) {
            const inboxItem = new InboxItem(actor, this.inbox_next, this.inbox_value);
            currentItem.setNext(inboxItem);
            currentItem = inboxItem;
        }
    }
    addItem (item) {
        this.inbox.add(item);
        item.subscribe({ update: () => this.processInbox() });
        this.processInbox();
    }
    removeItem (item) {
        // no need to unsubscribe since the item is about to be destructed anyways
        this.inbox.remove(item);
        this.processInbox();
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
