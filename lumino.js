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
    constructor (spec, parent, subject) {
        this.spec = spec;
        this.parent = parent;
        this.listeners = new Set();
        subject.subscribe(this.update);
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
				listener();
			}
		}
	}
    destruct () {
        subject.unsubscribe(this.update);
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
        // TODO: we need to destruct the prev child if spec changed
        const template = this.parent.get(this.source);
        return template ? new Firefly(template) : UNDEFINED;
    }
    destruct () {
        this.value.farewell();
        Binding.prototype.destruct.call(this);
    }
}

// A bit of a hack, subscribes to itself for changes, so that if the target changes it can rebind itself
class InsertionBinding extends Binding {
    constructor (spec, parent) {
        super(spec, parent);
        this.sourceBinding = parent.properties[spec.source]; // TODO: is this safe?
        this.target = spec.target;
        this.id = OutboxItem.generateId();

        // manually add an eventlistener on update so I can re-bind the target
        this.addListener(this.onTargetChanged.bind(this));
    }
    evaluate () {
        return this.parent.get(this.target);
        // should I be creating a InboxItem Actor here?
    }
	// re-evaluate and re-bind target
	onTargetChanged () {
        console.log(`Re-binding target for InsertionBinding with id ${this.id}`); // for debugging
        this.oldTargetValue.removeItem(this.sourceBinding);
        this.target.addItem(this.sourceBinding);

		this.oldTargetValue = this.parent.get(this.target);
	}
}

// every insertion has an id because collectors can contain duplicates,
// so this is an easy way to tell duplicates apart
InsertionBinding.currentId = 0;
InsertionBinding.generateId = function () {
    return InsertionBinding.currentId++;
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
        this.bindings = new Set();
    }
    get (address) {
        return this.properties[address] ? this.properties[address].value : UNDEFINED;
    }
    farewell () { // destructor
        for (const binding of this.bindings.values()) {
            binding.destruct();
        }
    }
    setNext () {
        // throw error
    }
}

class InboxItem extends Actor {
    constructor (insertionBinding, inbox_next, inbox_value) {
        this.inbox_next = inbox_next;
        this.inbox_value = inbox_value;
        this.insertionBinding = insertionBinding;
    }
    initializeProperties () {
        this.properties[this.inbox_value] = this.insertionBinding;
        this.properties[this.inbox_next] = new NextItemBinding();
        // TODO: subscribe to updates
    }
    resolveReferences () {

    }
    setNext (inboxItem) {
        this.properties[this.inbox_next].set(inboxItem);
    }
}

// this is really just to add a pub-sub mechanism to the next item pointer for each inbox item
class OrderingBinding extends Binding {
    evaluate () {
        return this.nextItem;
    }
    set (nextItem) {
        this.nextItem = nextItem || UNDEFINED;
        this.update(); // notify subscribers
    }
}

// the main actor class
class Firefly extends Actor {
    constructor (template, insertionBinding) {
        super();
        this.template = template;
        this.inbox = new Set();
        this.initializeProperties(insertionBinding);
    }
    initializeProperties () {
        // create static nodes for each property
        // eg 'addr_231': { type: 'spawn', source: 'addr_255' } will create a SpawnNode at address addr_231
        for (const { address, binding } of Object.entries(this.template.properties)) {
            switch (binding.type) {
                case 'access': this.properties[address] = new AccessBinding(binding, this); break;
                case 'spawn': this.properties[address] = new SpawnBinding(binding, this); break;
                case 'inbox_next': this.inbox_next = address; break;
                case 'inbox_val': this.inbox_value = address; 
                    if (insertionBinding) {
                        this.properties[this.inbox_value] = insertionBinding;
                    }
                    break;
                default: throw Error(`unknown node type "${binding.type}"`);
            }
        }
        this.properties[this.inbox_next] = new OrderingBinding();
    }
    resolveReferences () {
        // resolve references to other addresses and create reactive bindings
        // eg 'addr_231': { type: 'spawn', source: 'addr_255' } will take the SpawnNode at address addr_231,
        // and bind it to the value at addr_255, spawning from that value
        
    }
    deliverOutbox () {
        for (const bindingSpec of this.template.outbox) {
            const binding = new InsertionBinding(bindingSpec, this);
            this.bindings.add(binding);
        }
    }
    setNext (inboxItem) {
        this.properties[this.inbox_next].set(inboxItem);
    }
    addItem (insertionBinding) {
        const item = new InboxItem(insertionBinding);
        this.inbox.add(item);
        this.inboxTail.setNext(item);
        this.inboxTail = item;
    }
    removeItem (insertionBinding) {
        const item = [...this.inbox].filter(it => it.insertionBinding == insertionBinding)[0];
        // no need to unsubscribe since the item is about to be destructed anyways
        if (this.inbox.remove(item)) {
            this.item.prevItem.setNext(item.nextItem);
        }
        item.farewell();
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
