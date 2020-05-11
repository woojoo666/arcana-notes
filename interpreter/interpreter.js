// This contains all the "glue" connecting the preprocessor, lexer, parser, and interpreter

import { PreProcessor, Block } from './preprocessor.js';
import { parse } from './parser.js';
import { VERBOSE } from './utils.js';

/*
I want the structure of the reactive graph to look like:

Node {
	blockString
	getAbsoluteOffset: fn(nestedBlock, nestedOffset => absoluteOffset)
	parseTree:  output from parser
	value: output from interpreter
	nestedObjects: [
		{
			offset: offset of the first character
			length: length of the original block
			object: {...}   // recursive
		}
	]
}

Every node represents a single object. Note that conveniently enough,
	every code block (delimited by braces or indentation) corresponds to an object.
Actually, incorrect, there is no one-to-one mapping between syntax blocks and live objects.
	For example, if I declare 3 blocks inside foo, and then clone foo, "foo: (()()()), bar: foo()"
	then I have 5 syntax blocks but 8 objects.
Notice that it is recursive, so every object node contains child object nodes,
	which keep track of their offset and original block length,
	so when any piece of code changes, you can traverse the node tree to figure
	out exactly which node needs to be re-parsed.
*/

// see section "interpreter mechanism and implementation brainstorm" to see how all this works

// TODO: I think a cleaner way to implement the interpreter, is to have the grammar post-processors
//       create Nodes directly, and then in the interpreter, just call rootNode.clone().

class Scope {
	constructor(parent, map) {
		this.parent = parent || new Map(); // parent can actually be a Scope or Map. If not provided, use empty map as parent.
		this.map = map || new Map(); // allow initialization from existing map
	}
	set(key, val) { this.map.set(key, val); return this; }
	get(key) { return this.map.has(key) ? this.map.get(key) : this.parent.get(key); }
	has(key) { return this.map.has(key) || this.parent.has(key); }
	extend() { return new Scope(this); }
	// TODO: should we support deleting properties? If we only delete properties from current scope, subsequent get() requests will just retrieve from parent scopes.
}

Scope.EMPTY = new Scope();
Scope.fromObject = obj => new Scope(null, new Map(Object.entries(obj)));

function NodeFactory (syntaxNode, parent) {
	switch (syntaxNode.type) {
		case 'block': return new ObjectNode(syntaxNode, parent);
		case 'binop': return new BinopNode(syntaxNode, parent);
		case 'unaryop': return new UnaryNode(syntaxNode, parent);
		case 'memberAccess': return new MemberAccessNode(syntaxNode, parent);
		case 'reference': return new ReferenceNode(syntaxNode, parent);
		case 'string': return new StringNode(syntaxNode, parent);
		case 'number': return new NumberNode(syntaxNode, parent);
		case 'boolean': return new BooleanNode(syntaxNode, parent);
		case 'undefined': return new UndefinedNode(syntaxNode, parent);
		case 'create': return NodeFactory(syntaxNode.block, parent); // 'create' nodes contain a 'block' node
		case 'clone': return new CloneNode(syntaxNode, parent);
		case 'insertion': return new InsertionNode(syntaxNode, parent);
		case 'collector': return new CollectorNode(syntaxNode, parent);
	}
	throw Error('No handler for syntaxNode of type ' + syntaxNode.type);
}

let idCounter = 0;

class Node {
	constructor (syntaxNode, parent) {
		this.id = idCounter++;
		this.listeners = [];
		this.syntaxNode = syntaxNode;
		// TODO: a special Undefined object for representing undefined values
		this.value = undefined; // initialize all nodes to undefined.

		if (parent) {
			this.addListener(parent);
		}

		if (new.target === Node) {
			throw Error('Do not instantiate the abstract Node class');
		}
	}
	addListener (listener) {
		if (this.listeners.indexOf(listener) < 0)
			this.listeners.push(listener);
	}
	removeListener (listener) {
		// removes all instances of listener
		const index = this.listeners.indexOf(listener)
		if (index > 0) {
			this.listeners.splice(index, 1);
		}
	}
	resolveReferences (scope) {
		throw Error(`Unimplemented ${this.constructor.name}.resolveReferences() function`);
	}
	// sets the value.
	// Value should always be an ObjectNode or CloneNode (TODO: make sure this is followed for all Nodes) 
	evaluate () {
		throw Error(`Unimplemented ${this.constructor.name}.evaluate() function`);
	}
	clone (parent) {
		throw Error(`Unimplemented ${this.constructor.name}.clone() function`);
	}
	update () {
		if (VERBOSE) console.log(`updating ${this.constructor.name} with id ${this.id}`); // for debugging

		const oldValue = this.value;
		this.value = this.evaluate();
		if (this.value != oldValue) {
			for (const listener of this.listeners) {
				listener.update();
			}
		}
	}
}

// represents an object, with properties and insertions
// Note that ObjectNodes never update, so they should listen to nobody, and have no listeners.
// This is why we pass "null" as the "parent" argument in calls to clone() and NodeFactory()
//
// TODO: support computed properties. This will mean that nodes will have to start listening to object nodes for changes to properties.
//       We will also have to check for property collisions, and use `overdefined` whenever there are two properties with the same key.
class ObjectNode extends Node {
	// TODO: since objects never update(), we don't need to pass in "parent" because there should be no listeners
	constructor (syntaxNode, parent) {
		super(syntaxNode, parent);
		this.children = [];   // TODO: should we keep references to children (aka nested blocks)?
		this.properties = new Map(); // static properties
		this.insertions = [];
		this.value = this;    // ObjectNode are the only nodes where we initialize value at beginning, so cloning doesn't break

		for (const statement of syntaxNode.statements) {
			switch (statement.type) {
				case 'property':
					const key = statement.keyType == 'number' ? JSON.parse(statement.key)
						: statement.keyType == 'boolean' ? JSON.parse(statement.key)
						: statement.key;
					this.properties.set(key, NodeFactory(statement.value, null));
					break;
				case 'insertion':
					this.insertions.push(NodeFactory(statement, null));
					break;
			}
		}
	}
	getNode (key) {
		return this.properties.get(key);
	}
	get (key) {
		return this.getNode(key) && this.getNode(key).value;
	}
	clone (parent) {
		let newNode = new ObjectNode({statements: []}, null); // use a dummy syntaxNode
		for (const [key, valueNode] of this.properties.entries()) {
			newNode.properties.set(key, valueNode.clone(null));
		}
		for (const insertion of this.insertions) {
			newNode.insertions.push(insertion.clone(null));
		}
		return newNode;
	}
	// the value of an object node is itself. Note that this means an object node never calls update(),
	// which is fine.
	evaluate() {
		return this;
	}
	// recursively called on neighbor nodes, finds and resolves ReferenceNode nodes
	resolveReferences (scope) {
		// store scope so it can be re-used during cloning (see CloneNode.evaluate())
		this.scope = scope.extend(); // leverage javascript inheritance & prototype tree for scopes

		for (const [key, valueNode] of this.properties.entries()) {
			this.scope.set(key, valueNode);
		}

		for (const valueNode of this.properties.values()) {
			valueNode.resolveReferences(this.scope);
		}

		for (const insertion of this.insertions) {
			insertion.resolveReferences(this.scope);
		}
	}
	destruct() {
		// TODO: remove listeners from children? or are all children getting garbage-collected anyways?
		for (const insertion of this.insertions) {
			insertion.destruct();
		}
	}
}

// Right now when we resolve references, ReferenceNodes basically become like proxies,
// forwarding values and updates. It's possible that during reference resolution, we just
// get rid of these intermediate reference nodes, but I can't find a clean way to do so.
class ReferenceNode extends Node {
	constructor (syntaxNode, parent) {
		super(syntaxNode, parent);
		this.targetName = syntaxNode.name;
	}
	// Note that a cloned reference node will point to the original target.
	// The function resolveReferences() will rebind the target if necessary.
	clone (parent, scope) {
		let newNode = new ReferenceNode({name: this.targetName}, parent); // use a dummy syntaxNode
		newNode.target = this.target; // preserve the original target
		// TODO: feels ugly to manually add listeners here, esp. if the target is inside the source.
		//       For example, if we have `source: (x: 10, y: x)`, then during cloning,
		//       the cloned reference clone.y will point to source.x. Only during reference resolution,
		//       will the reference be updated to point to clone.x. Can we guarantee that this always happens?
		if (this.target && !(this.target instanceof ObjectNode)) {
			this.target.addListener(newNode);
		}
		return newNode;
	}
	// Reference resolution happens at the end of a cloning operation.
	// So we also use it to trigger evaluation, because the Reference nodes
	// are at the "leaves" of the clone, so the evaluation will ripple all the
	// way to the root.
	// Note that resolveReferences() is also used to override references in a clone operation.
	resolveReferences (scope) {
		if (scope.get(this.targetName)) {
			if (this.target) {
				this.target.removeListener(this); // unbind from old target
			}
			this.target = scope.get(this.targetName);
			if (this.target && !(this.target instanceof ObjectNode)) {
				// we only need to add a listener if the target is not an ObjectNode
				this.target.addListener(this);
			} else {
				if (VERBOSE) console.log(`ReferenceNode with undefined target ${this.targetName}, possibly an implicit input?`);
			}
		}
		this.update();
	}
	evaluate () {
		return this.target && this.target.value;
	}
}

// TODO: can we represent Node as simply a CloneNode without a source?
// Note: don't confuse CloneNode and clone(), they are completely separate things.
// CloneNodes represent the clone operation in the language. clone() is a function
// used in the interpreter to create a copy of a Node.
class CloneNode extends Node {
	constructor(syntaxNode, parent) {
		super(syntaxNode, parent);
		if (!syntaxNode) return; // a hack for cloning
		this.source = NodeFactory(syntaxNode.source, this);
		this.arguments = NodeFactory(syntaxNode.block, this);

		// when value changes, destruct previous value
		this.onChangeListener = {
			update: () => {
				if (this.prevValue) {
					this.prevValue.destruct();
				}
				this.prevValue = this.value;
			}
		}
		this.addListener(this.onChangeListener);
	}
	clone (parent) {
		const newNode = new CloneNode(undefined, parent);
		newNode.source = this.source.clone(newNode);
		newNode.arguments = this.arguments.clone(newNode);
		return newNode;
	}
	resolveReferences (scope) {
		// Note: arguments block is treated as a template, should be left un-resolved and should not perform any insertions.
		//       The arguments block is used during evaluate() to create the child object, and we resolve references on the child.
		this.parentScope = scope; // store the current scope so it can be used during reference resolution in evaluate().
		this.source.resolveReferences(scope); // this will most likely trigger an update and evaluate(), so make sure this.parentScope is already set before calling this
	}
	// TODO: I think this would be a lot cleaner if all Nodes returned a Node as their evaluated value
	// TODO: this is all really hack, I'm not sure if it will handle certain edge cases like, if a node
	//       inside the sourceObject changes (but not the sourceObject itself), will it update the corresponding
	//       node inside the cloned object?
	// Note: we don't have to account for undefined source, since an undefined source should never trigger an evaluate()
	evaluate () {
		// get the values at the source and arguments nodes
		const sourceObject = this.source.value;
		const argumentsObject = this.arguments.value;

		// leverage javascript inheritance & prototype tree for scopes
		const sourceScope = sourceObject.scope.extend();
		const argumentsScope = this.parentScope.extend();

		// Mapping between nodes in the child, and the scope that they belong to
		// (either source or arguments scope, depending on where the node came from)
		// References in the child will be resolved using whichever scope they belong to (see notes on "Nearest Scope")
		const scopeMap = new Map();

		const child = new ObjectNode({statements: []}, null); // temporary object node, so don't attach listeners?
		for (const [key, valueNode] of argumentsObject.properties.entries()) {
			const node = valueNode.clone(null);
			child.properties.set(key, node);
			scopeMap.set(node, argumentsScope);
		}

		// inherit properties from source if they aren't already in arguments
		for (const [key, valueNode] of sourceObject.properties.entries()) {
			if (!child.properties.has(key)) {
				const node = valueNode.clone(null);
				child.properties.set(key, node);
				scopeMap.set(node, sourceScope);
			}
		}

		for (const insertion of sourceObject.insertions) {
			const node = insertion.clone(null);
			child.insertions.push(node);
			scopeMap.set(node, sourceScope); // add insertion to scopeMap so it will be resolved during reference resolution
		}
		for (const insertion of argumentsObject.insertions) {
			const node = insertion.clone(null);
			child.insertions.push(node);
			scopeMap.set(node, argumentsScope);
		}

		for (const [key, valueNode] of child.properties.entries()) {
			sourceScope.set(key, valueNode);
			argumentsScope.set(key, valueNode);
		}

		for (const [node, scope] of scopeMap.entries()) {
			node.resolveReferences(scope);
		}

		return child;
	}
}

// TODO: short circuit for boolean ops?
// TODO: should we make operators extend regular objects, with properties and a _return property?
//       Right now we are directly returning the evaluated value.
class BinopNode extends Node {
	// TODO: support more than 2 operands?
	constructor (syntaxNode, parent) {
		super(syntaxNode, parent);
		if (!syntaxNode) return; // a hack for cloning
		this.operands = [NodeFactory(syntaxNode.left, this), NodeFactory(syntaxNode.right, this)];
		this.operator = syntaxNode.operator;
	}

	resolveReferences (scope) {
		for (const operand of this.operands) {
			operand.resolveReferences(scope);
		}
	}
	clone(parent) {
		const newNode = new BinopNode(null, parent);
		newNode.operands = this.operands.map(operand => operand.clone(newNode));
		newNode.operator = this.operator;
		return newNode;
	}
	evaluate () {
		// TODO: should not be dependent on javascript's type coercion. Should be using custom defined coercion methods
		let left = this.operands[0].value;
		let right = this.operands[1].value;

		switch (this.operator) {
			case '+': return left + right;
			case '-': return left - right;
			case '**': return left ** right;
			case '*': return left * right;
			case '/': return left / right;
			case '%': return left % right;
			case '<=': return left <= right;
			case '>=': return left >= right;
			case '<': return left < right;
			case '>': return left > right;
			case '==': return left === right; // TODO: reference equality? is this even necessary?
			case '=': return left == right;   // TODO: don't use javascript's equality, implement my own type coercion and equality
			case '!=': return left != right;  // TODO: don't use javascript's equality, implement my own type coercion and equality
			case '!==': return left !== right;
			case '&': return left && right;   // TODO: manually coerce to boolean
			case '|': return left || right;   // TODO: manually coerce t boolean

			// we should never get here because unknown binary operators should be caught in the parser
			default: throw Error(`Interpreter error: unknown binary operator "${operator}".`);
		}
	}
}

// See section "Member Access and Alias Bindings" to see how this works
// Notice the similarity to a ReferenceNode.
// MemberAccessNodes are basically ReferenceNodes that can rebind to new targets.
// TODO: I wonder if we can leverage this similarity. Instead of having nodes listen directly
//       to the MemberAccessNode, we can have the MemberAccessNode generate a ReferenceNode to the target,
//       and have nodes listen to that. Then, if the target changes, the MemberAccessNode creates a new
//       ReferenceNode, and migrates all listeners from the previous ReferenceNode to the new one.
class MemberAccessNode extends Node {
	constructor (syntaxNode, parent) {
		super(syntaxNode, parent);
		if (!syntaxNode) return; // a hack for cloning
		const self = this;
		// a fake node to listen to source changes and forward updates to updateTarget()
		this.sourceListener = {
			update() {
				self.updateTarget();
			}
		}
		this.source = NodeFactory(syntaxNode.source, this.sourceListener);
		if (typeof syntaxNode.key == 'string') {
			const dummySyntaxNode = { value: `\"${syntaxNode.key}\"` }; // convert the key to a string by wrapping in quotes
			this.key = new StringNode(dummySyntaxNode, this.sourceListener);
		} else {
			this.key = NodeFactory(syntaxNode.key, this.sourceListener);
		}
	}
	clone (parent) {
		const newNode = new MemberAccessNode(null, parent);
		newNode.source = this.source.clone(newNode);
		newNode.key = this.key.clone(newNode);
		return newNode;
	}
	resolveReferences (scope) {
		this.source.resolveReferences(scope);
		this.key.resolveReferences(scope);
	}
	// Note: target should be a Node, not a value!
	evaluateTarget() {
		if (this.source.value instanceof ObjectNode) {
			return this.source.value.getNode(this.key.value); // TODO: support object-key access
		}
		return undefined;
	}
	// re-evaluate and re-bind target
	updateTarget () {
		if (VERBOSE) console.log(`updating target for MemberAccessNode with id ${this.id}`); // for debugging

		const oldTarget = this.target;
		this.target = this.evaluateTarget();
		if (this.target != oldTarget) {
			if (oldTarget) {
				oldTarget.removeListener(this); // unbind from old target
			}
			if (this.target && !(this.target instanceof ObjectNode)) {
				// we only need to add a listener if the target is not an ObjectNode
				this.target.addListener(this);  // bind to new target
			}
			this.update(); // target changed so re-evaluate value
		}
	}
	evaluate () {
		return this.target && this.target.value;
	}
}

class InsertionNode extends Node {
	constructor (syntaxNode, parent) {
		super(syntaxNode, parent);
		if (!syntaxNode) return; // a hack for cloning
		this.targetNode = NodeFactory(syntaxNode.target, this);
		this.valueNode = NodeFactory(syntaxNode.value, this);

		this.targetVal = undefined;
	}
	clone (parent) {
		const newNode = new InsertionNode(null, parent);
		newNode.targetNode = this.targetNode.clone(newNode);
		newNode.valueNode = this.valueNode.clone(newNode);
		return newNode;
	}
	resolveReferences (scope) {
		this.targetNode.resolveReferences(scope);
		this.valueNode.resolveReferences(scope);
	}
	evaluate() {
		return this.targetNode && this.targetNode.value;
	}
	update () {
		if (VERBOSE) console.log(`updating target for InsertionNode with id ${this.id}`); // for debugging

		const oldTarget = this.targetVal;
		this.targetVal = this.evaluate();
		if (this.targetVal != oldTarget) {	
			if (oldTarget)
				oldTarget.removeItem(this.valueNode); // unbind from old target

			this.targetVal.addItem(this.valueNode);  // bind to new target
		}
	}
	destruct () {
		if (this.targetVal) {
			this.targetVal.removeItem(this.valueNode);
		}
	}
}

// In lumino, insertions are supposed to be stored in a linked-list structure.
// However, for simplicity, we define a Collector type that just flattens all insertions into an array-like structure.
class CollectorNode extends Node {
	constructor (syntaxNode, parent) {
		super(syntaxNode, parent);
		this.items = new Set();
		this.value = this; // we need an initial value to trigger any reference nodes to update, just like an ObjectNode
	}
	clone () {
		throw Error('unimplemented Collector clone'); // TODO
	}
	resolveReferences () {
		// CollectorNodes act like NumberNodes and call update() during reference resolution
		// to trigger the initial evaluation pass.
		this.update();
	}
	evaluate () {
		// re-create properties from scratch every time
		this.properties = new Map();
		for (const [index, valueNode] of [...this.items.values()].entries()) {
			this.properties.set(index, valueNode);
		}
		const lengthNode = new NumberNode({value: this.items.size}, null);
		lengthNode.update(); // initialize number node
		this.properties.set('length', lengthNode);
		return this;
	}
	getNode (key) {
		return this.properties.get(key);
	}
	get (key) {
		return this.getNode(key).value;
	}
	update () {
		if (VERBOSE) console.log(`updating CollectorNode with id ${this.id}`); // for debugging

		this.evaluate();
		for (const listener of this.listeners) {
			listener.update(); // since properties re-created every time, always notify listeners
		}
	}
	addItem (valueNode) {
		this.items.add(valueNode)
		this.update();
	}
	removeItem (valueNode) {
		this.items.remove(valueNode)
		this.update();
	}
}

class UnaryNode extends Node {
	constructor (syntaxNode, parent) {
		super(syntaxNode, parent);
		if (!syntaxNode) return; // a hack for cloning
		this.operand = NodeFactory(syntaxNode.value, this);
		this.operator = syntaxNode.operator;
	}
	clone (parent) {
		const newNode = new UnaryNode(null, parent);
		newNode.operand = this.operand.clone(newNode);
		newNode.operator = this.operator;
		return newNode;
	}
	resolveReferences (scope) {
		this.operand.resolveReferences(scope);
	}
	evaluate () {
		switch (this.operator) {
			case '!': return ! this.operand.value;
			case '+': return + this.operand.value;
			case '-': return - this.operand.value;
			// we should never get here because unknown unary operators should be caught in the parser
			default: throw Error(`Interpreter error: unknown unary operator "${operator}".`);
		}
	}
}

// These are just wrappers around javascript primitives, eg String, Boolean, Numbers.
// All of them start with value undefined, and then during reference resolution,
// will update once with the correct value. Then they will never change value again.
class PrimitiveNode extends Node {
	// Note that while the AST preserves all primtive values as a strings (eg 5 would be represented as "5"),
	// the interpreter parses the values to Javascript primitives before returning it.
	// Other nodes like BinopNode.evaluate() also return raw javascript primitives.
	//
	// TODO: perhaps we should wrap raw values in ObjectNodes, so that we can add properties
	//       and do stuff like `5.type == 'number'`
	evaluate (scope) {
		return this.getRawValue();
	}
	getRawValue() {
		throw Error(`Unimplemented ${this.constructor.name}.getRawValue() function`);
	}
	clone (parent) {
		throw Error(`Unimplemented ${this.constructor.name}.getRawValue() function`);
	}
	// Primitive nodes act like references to global objects (eg NumberNodes act like
	// reference to some global library of Number objects), so just like ReferenceNodes,
	// they call update() during reference resolution to trigger the initial evaluation pass.
	resolveReferences (scope) {
		this.update(); // TODO: maybe we should override update() to not do anything, because NumberNodes never change? would be a slight optimization.
	}
}

class StringNode extends PrimitiveNode {
	getRawValue () { return JSON.parse(this.syntaxNode.value); }
	clone (parent) { return new StringNode(this.syntaxNode, parent); }
}

class NumberNode extends PrimitiveNode {
	getRawValue () { return +this.syntaxNode.value; }
	clone (parent) { return new NumberNode(this.syntaxNode, parent); }
}

class BooleanNode extends PrimitiveNode {
	getRawValue () { return JSON.parse(this.syntaxNode.value); }
	clone (parent) { return new BooleanNode(this.syntaxNode, parent); }
}

// UndefinedNodes never change value from their initial value of undefined, so we have to manually trigger any updates.
// TODO: in most cases, we never have to trigger any updates, because most nodes operating on an UndefinedNode would also have a value
//       of undefined (eg CloneNodes, MemberAccessNodes, etc). The only reason why we manually trigger an update here is because
//       of Binop and Unary Nodes, which are the only nodes that can return a non-undefined value even when operands are undefined.
//       A slight optimization would be to have Binop and Unary nodes just check for UndefinedNode operands during reference resolution
//       and trigger an update themselves. That way, we can actually combine all UndefinedNodes into a single global constant,
//       UNDEFINED = new UndefinedNode(), which would never update and would never have any listeners.
class UndefinedNode extends PrimitiveNode {
	getRawValue () { return undefined; }
	clone (parent) { return new UndefinedNode(null, parent); }
	update() { this.listeners.forEach(listener => listener.update()) }
}

class Interpreter {

	// todo: rename source to something better, like sourceText or rawCode
	constructor (source) {
		this.source = source;
	}

	run () {
		try {
			var preprocessor = new PreProcessor(this.source);
			preprocessor.run();
		} catch (err) {
			console.log("Syntax error detected in preprocessor");
			console.log(err);
		}

		parseBlockRecursive(preprocessor.rootBlock);
	}

	// note: actually, modular recursive parsing is only used to localize syntax errors
	//       so after it gets to the interpreter, all the ASTs should be merged together
	//       so the interpreter can interpret the entire program, and so we can resolve scoping
	parseBlockRecursive (block, scope) {
		let blockString = block.getBlockString();

		// let AST = parse(blockString, block.blockType);
		// let scope = ...; // TODO

		for (let child of block.children) {
			this.parseBlockRecursive(child);
		}

		return this;
	}

	// pass in a scope, a dictionary of named Node objects that you provide.
	// This will allow you provide "input" arguments to the program, and change them
	// dynamically to see how they affect the program output.
	interpretTest(scope = Scope.EMPTY, blockType = 'Indent') {
		const encoded = new PreProcessor(this.source).encodeIndentation();
		const AST = parse(encoded, blockType);
		const root = NodeFactory(AST);
		root.resolveReferences(scope);  // start with empty scope
	
		if (VERBOSE) console.log(root);

		return root;
	}
}

export { Interpreter, NumberNode, Node, Scope };
