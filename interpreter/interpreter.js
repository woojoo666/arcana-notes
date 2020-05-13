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
//       create Nodes directly, and then in the interpreter, just clone the rootNode.

class Scope {
	constructor (self, parent, map) {
		this.parent = parent || new Map(); // parent can actually be a Scope or Map. If not provided, use empty map as parent.
		this.map = map || new Map(); // allow initialization from existing map
		this.self = self;
	}
	set(key, val) { this.map.set(key, val); return this; }
	get(key) { return this.map.has(key) ? this.map.get(key) : this.parent.get(key); }
	getSelf() { return this.self; }
	has(key) { return this.map.has(key) || this.parent.has(key); }
	extend(self, map) { return new Scope(self, this, map); } // you can optionally provide a `map` of initial key-value pairs
	// TODO: should we support deleting properties? If we only delete properties from current scope, subsequent get() requests will just retrieve from parent scopes.
}

// notice that scopes constructed outside an ObjectNode have no "self" or "this"
Scope.EMPTY = new Scope();
Scope.fromObject = obj => new Scope(undefined, undefined, new Map(Object.entries(obj)));

class NodeFactory {
	animate (syntaxNode, parent) {
		if (syntaxNode.type == 'create') {
			syntaxNode = syntaxNode.block; // 'create' nodes contain a 'block' node
		}
		let NodeClass = this.getNodeClass(syntaxNode);
		let node = new NodeClass(syntaxNode, parent, this);
		return this.postTransform(node);
	}
	getNodeClass (syntaxNode, parent) {
		switch (syntaxNode.type) {
			case 'block': return ObjectNode;
			case 'binop': return BinopNode;
			case 'unaryop': return UnaryNode;
			case 'memberAccess': return MemberAccessNode;
			case 'reference': return ReferenceNode;
			case 'string': return StringNode;
			case 'number': return NumberNode;
			case 'boolean': return BooleanNode;
			case 'undefined': return UndefinedNode;
			case 'clone': return CloneNode;
			case 'insertion': return InsertionNode;
			case 'collector': return CollectorNode;
		}
		throw Error('No handler for syntaxNode of type ' + syntaxNode.type);
	}
	postTransform (node) {
		return node; // by default, no transformation
	}
}

let idCounter = 0;

class Node {
	constructor (syntaxNode, parent, nodeFactory) {
		this.id = idCounter++;
		this.listeners = new Set();
		this.syntaxNode = syntaxNode;
		this.nodeFactory = nodeFactory;
		this.children = new Set();

// Note that even if all references and primitives are undefined, we still need to do an initial evaluation pass.
// This may seem counter-intuitive because it might be simpler to just initialize all nodes to undefined, and then
// only update if they update to a non-undefined value (eg if a reference node gets a value during reference resolution).
// However, note that Binop and Unary Nodes can return a non-undefined value even when operands are undefined. Eg
// `undefined == undefined` should return `true`.
//
// TODO: Right now we are forcing every node to update during the reference resolution pass, but this can cause many nodes
//       to update multiple times. Each node technically only needs to update once during the initial evaluation pass.
//       To optimize this, maybe we can start the initial evaluation pass at the "leaves" of the graph, aka the reference
//       nodes and primitives, and then work our way towards the root.
// 
// TODO: A slight optimization would be to have Binop and Unary nodes just check for undefined operands during
//       reference resolution and trigger an update themselves. That way, we can initialize all other nodes to undefined
//       and save a lot of updates. As a bonus, this will allow us to combine all UndefinedNodes into a single global constant,
//       UNDEFINED = new UndefinedNode(), which would never update and would never have any listeners.

		this.value = undefined;

		if (parent) {
			this.addListener(parent);
		}

		if (new.target === Node) {
			throw Error('Do not instantiate the abstract Node class');
		}
	}
	registerChildren(...nodes) {
		nodes.forEach(node => this.children.add(node));
		// every node is responsible for resolving references on their children, and calling the destructor of their children
	}
	unregisterChild(node) {
		this.children.delete(node);
	}
	addListener (listener) {
		this.listeners.add(listener);
	}
	removeListener (listener) {
		this.listeners.delete(listener);
	}
	resolveReferences (scope) {
		this.children.forEach(child => child.resolveReferences(scope));
	}
	notifyListeners () {
		for (const listener of this.listeners) {
			listener.update();
		}
	}
	// sets the value.
	// Value should always be an ObjectNode or CloneNode (TODO: make sure this is followed for all Nodes) 
	evaluate () {
		throw Error(`Unimplemented ${this.constructor.name}.evaluate() function`);
	}
	update () {
		if (VERBOSE) console.log(`updating ${this.constructor.name} with id ${this.id}`); // for debugging

		const oldValue = this.value;
		this.value = this.evaluate();
		if (this.value != oldValue) {
			this.notifyListeners();
		}
	}
	destruct () {
		this.children.forEach(child => child.destruct());
	}
}

// represents an object, with properties and insertions
// Note that ObjectNodes never update, so they should listen to nobody, and have no listeners.
// This is why we pass "null" as the "parent" argument in calls to NodeFactory()
//
// TODO: support computed properties. This will mean that nodes will have to start listening to object nodes for changes to properties.
//       We will also have to check for property collisions, and use `overdefined` whenever there are two properties with the same key.
class ObjectNode extends Node {
	// TODO: since objects never update(), we don't need to pass in "parent" because there should be no listeners
	constructor (syntaxNode, parent, nodeFactory) {
		super(syntaxNode, parent, nodeFactory);
		this.properties = new Map(); // static properties
		this.insertions = [];
		this.value = this;    // ObjectNode initialize to themselves at the beginning, so cloning doesn't break

		if (!syntaxNode.statements) {
			return; // CollectorNode extends ObjectNode but has no statements, so exit
		}

		for (const statement of syntaxNode.statements) {
			switch (statement.type) {
				case 'property':
					const key = statement.keyType == 'number' ? JSON.parse(statement.key)
						: statement.keyType == 'boolean' ? JSON.parse(statement.key)
						: statement.key;
					this.properties.set(key, this.nodeFactory.animate(statement.value, null));
					break;
				case 'insertion':
					this.insertions.push(this.nodeFactory.animate(statement, null));
					break;
			}
		}

		this.registerChildren(...this.properties.values(), ...this.insertions);
	}
	getNode (key) {
		return this.properties.get(key);
	}
	get (key) {
		return this.getNode(key) && this.getNode(key).value;
	}
	// the value of an object node is itself.
	evaluate() {
		return this;
	}
	// recursively called on neighbor nodes, finds and resolves ReferenceNode nodes
	resolveReferences (scope) {
		// store scope so it can be re-used during cloning (see CloneNode.evaluate())
		this.scope = scope.extend(this, this.properties);

		super.resolveReferences(this.scope);
	}
}

// Right now when we resolve references, ReferenceNodes basically become like proxies,
// forwarding values and updates. It's possible that during reference resolution, we just
// get rid of these intermediate reference nodes, but I can't find a clean way to do so.
class ReferenceNode extends Node {
	constructor (syntaxNode, parent, nodeFactory) {
		super(syntaxNode, parent, nodeFactory);
		this.targetName = syntaxNode.name;
	}
	// TODO: Reference resolution happens at the end of a cloning operation.
	// So we should use it to trigger evaluation, because the Reference nodes
	// are at the "leaves" of the clone, so the evaluation will ripple all the
	// way to the root.
	resolveReferences (scope) {
		// TODO: we should only unbind and re-bind if the target changes?
		if (this.target) {
			this.target.removeListener(this); // unbind from old target
		}
		this.target = this.syntaxNode.selfRef ? scope.getSelf() : scope.get(this.targetName);
		if (this.target && !(this.target instanceof ObjectNode)) {
			// we only need to add a listener if the target is not an ObjectNode
			this.target.addListener(this);
		} else {
			if (VERBOSE) console.log(`ReferenceNode with undefined target ${this.targetName}, possibly an implicit input?`);
		}
		super.resolveReferences(scope); // technically un-necessary because reference nodes have no children
		this.update();
	}
	evaluate () {
		return this.target && this.target.value;
	}
}

// TODO: can we represent ObjectNode as simply a CloneNode without a source?
class CloneNode extends Node {
	constructor (syntaxNode, parent, nodeFactory) {
		super(syntaxNode, parent, nodeFactory);
		this.source = this.nodeFactory.animate(syntaxNode.source, this);
		this.arguments = this.nodeFactory.animate(syntaxNode.block, this);

		this.registerChildren(this.source);
		// notice that we _do not_ register the arguments obj as a child. That's because arguments is treated as a template,
		//       should be left un-resolved and should not perform any insertions. The arguments block is only used during
		//       evaluate() to create the child object, and we resolve references on the child.

		// when value changes, destruct previous value
		this.onChangeListener = {
			update: () => {
				if (this.prevValue) {
					this.prevValue.destruct();
					this.unregisterChild(this.prevValue);
				}
				this.prevValue = this.value;
			}
		}
		this.addListener(this.onChangeListener);
	}
	resolveReferences (scope) {
		this.parentScope = scope; // store the current scope so it can be used during reference resolution in evaluate().
		super.resolveReferences(scope);
		this.update(); // CloneNodes need to evaluate even if all operands are undefined, so force update during reference resolution
	}
	// TODO: account for cloning primitives? I think this would be a lot cleaner if all Nodes returned a Node as their evaluated value
	// TODO: this is all really hacky, I'm not sure if it will handle certain edge cases like, if a node
	//       inside the sourceObject changes (but not the sourceObject itself), will it update the corresponding
	//       node inside the cloned object?
	evaluate () {
		// get the values at the source and arguments nodes
		const sourceObject = this.source.value;
		const argumentsObject = this.arguments.value;

		if (!(sourceObject instanceof ObjectNode) || !(argumentsObject instanceof ObjectNode)) {
			return undefined;
		}

		// create clones without resolving references, so should be inert and have no side effects yet
		const sourceClone = this.nodeFactory.animate(sourceObject.syntaxNode, null);
		const argumentsClone = this.nodeFactory.animate(argumentsObject.syntaxNode, null);

		const child = this.nodeFactory.animate({type: 'block', statements: []}, null); // temporary object node, so don't attach listeners?

		// Mapping between nodes in the child, and the scope that they belong to
		// (either source or arguments scope, depending on where the node came from)
		// References in the child will be resolved using whichever scope they belong to (see notes on "Nearest Scope")
		const scopeMap = new Map();
		const sourceScopeExt = sourceObject.scope.extend(child); //note: when resolving references, any self references should point to the child
		const argumentsScopeExt = this.parentScope.extend(child);

		for (const [key, valueNode] of argumentsClone.properties.entries()) {
			child.properties.set(key, valueNode);
			scopeMap.set(valueNode, argumentsScopeExt);
		}

		// inherit properties from source if they aren't already in arguments
		for (const [key, valueNode] of sourceClone.properties.entries()) {
			if (!child.properties.has(key)) {
				child.properties.set(key, valueNode);
				scopeMap.set(valueNode, sourceScopeExt);
			}
		}

		// add insertions to child, and also add them to scopeMap so they will be resolved during reference resolution
		for (const insertion of sourceClone.insertions) {
			child.insertions.push(insertion);
			scopeMap.set(insertion, sourceScopeExt);
		}
		for (const insertion of argumentsClone.insertions) {
			child.insertions.push(insertion);
			scopeMap.set(insertion, argumentsScopeExt);
		}

		for (const [key, valueNode] of child.properties.entries()) {
			sourceScopeExt.set(key, valueNode);
			argumentsScopeExt.set(key, valueNode);
		}

		for (const [node, scope] of scopeMap.entries()) {
			node.resolveReferences(scope);
		}

		// since we are manually creating properties+insertions, we have to manually register them
		child.registerChildren(...child.properties.values(), ...child.insertions);

		this.registerChildren(child);

		return child;
	}
}

// TODO: short circuit for boolean ops?
// TODO: should we make operators extend regular objects, with properties and a _return property?
//       Right now we are directly returning the evaluated value.
class BinopNode extends Node {
	// TODO: support more than 2 operands?
	constructor (syntaxNode, parent, nodeFactory) {
		super(syntaxNode, parent, nodeFactory);
		this.operands = [this.nodeFactory.animate(syntaxNode.left, this), this.nodeFactory.animate(syntaxNode.right, this)];
		this.operator = syntaxNode.operator;
		this.registerChildren(...this.operands);
	}

	resolveReferences (scope) {
		for (const operand of this.operands) {
			operand.resolveReferences(scope);
		}
		this.update(); // BinopNodes need to evaluate even if all operands are undefined, so force update during reference resolution
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
	constructor (syntaxNode, parent, nodeFactory) {
		super(syntaxNode, parent, nodeFactory);

		// a fake node to listen to source changes and forward updates to updateTarget()
		this.sourceListener = {
			update: () => this.updateTarget(),
		}
		this.source = this.nodeFactory.animate(syntaxNode.source, this.sourceListener);
		if (typeof syntaxNode.key == 'string') {
			const dummySyntaxNode = { type: 'string', value: `\"${syntaxNode.key}\"` }; // convert the key to a string by wrapping in quotes
			this.key = this.nodeFactory.animate(dummySyntaxNode, this.sourceListener);
		} else {
			this.key = this.nodeFactory.animate(syntaxNode.key, this.sourceListener);
		}

		this.registerChildren(this.source, this.key);
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
	constructor (syntaxNode, parent, nodeFactory) {
		super(syntaxNode, parent, nodeFactory);
		this.targetNode = this.nodeFactory.animate(syntaxNode.target, this);
		this.valueNode = this.nodeFactory.animate(syntaxNode.value, this);

		this.targetVal = undefined;
		this.registerChildren(this.targetNode, this.valueNode);
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

// CollectorNodes only add properties, never remove them. Instead of removing, sets them to undefined. This is so that
// we never lose any listeners. See notes section "Interpreter Implementation - collectors and propagating updates" for details
class CollectorNode extends ObjectNode {
	constructor (syntaxNode, parent, nodeFactory) {
		super(syntaxNode, parent, nodeFactory);
		this.items = new Set();
		this.value = this; // we need an initial value to trigger any reference nodes to update, just like an ObjectNode
	}
	evaluate () {
		const remainingKeys = new Set(this.properties.keys());
		// re-create properties from scratch every time
		for (const [index, valueNode] of [...this.items.values()].entries()) {
			const itemRefNode = this.getNode(index);
			if (itemRefNode.target !== valueNode) {
				if (itemRefNode.target)
					itemRefNode.target.removeListener(itemRefNode); // unregister from old target
				itemRefNode.target = valueNode;
				itemRefNode.target.addListener(itemRefNode); // register to new target
				itemRefNode.update();
			}
			remainingKeys.delete(index);
		}
		const lengthNode = this.getNode('length');
		if (lengthNode.value !== this.items.size) {
			lengthNode.target = { value: this.items.size };
			lengthNode.update();
		}
		remainingKeys.delete('length');

		for (const key of remainingKeys.values()) {
			const refNode = this.getNode(key);
			if (refNode.target) {
				refNode.target.removeListener(refNode);
				refNode.target = undefined;
				refNode.update();
			}
		}

		return this;
	}
	resolveReferences (scope) {
		super.resolveReferences(scope);
		this.update();
	}
	getNode (key) {
		let isValidKey = key == 'length' || (typeof(key) == 'number' && key >= 0);
		if (!isValidKey) {
			// we can safely ignore these requests since they should never return a value, so we never have to update the reader
			return undefined;
		}
		// note that we never resolve references on these generated references
		// Instead we just directly set the target value and force them to update()
		if (!this.properties.has(key)) {
			this.properties.set(key, this.nodeFactory.animate({type: 'reference'}));
		}
		return this.properties.get(key);
	}
	get (key) {
		return this.getNode(key).value;
	}
	addItem (valueNode) {
		this.items.add(valueNode)
		this.update();
	}
	removeItem (valueNode) {
		this.items.delete(valueNode)
		this.update();
	}
}

class UnaryNode extends Node {
	constructor (syntaxNode, parent, nodeFactory) {
		super(syntaxNode, parent, nodeFactory);
		this.operand = this.nodeFactory.animate(syntaxNode.value, this);
		this.operator = syntaxNode.operator;
		this.registerChildren(this.operand);
	}
	resolveReferences (scope) {
		super.resolveReferences(scope);
		this.update(); // UnaryNodes need to evaluate even if all operands are undefined, so force update during reference resolution
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
//
// Primitives act like references (eg we can think of all NumberNodes as a reference to some
// global library of number objects). Thus, PrimitiveNodes act like ReferenceNodes:
//  1. call update() during reference resolution to start initial evaluation pass
//  2. listeners are triggered on first update() call
class PrimitiveNode extends Node {
	constructor(syntaxNode, parent, nodeFactory) {
		super(syntaxNode, parent, nodeFactory);
		this.value = {}; // a hack to guarantee that listeners are triggered on first update() call
	}
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
	resolveReferences (scope) {
		super.resolveReferences(scope); // technically un-necessary because primitive nodes have no children
		this.update(); // TODO: maybe we should override update() to not do anything, because NumberNodes never change? would be a slight optimization.
	}
}

class StringNode extends PrimitiveNode {
	getRawValue () { return JSON.parse(this.syntaxNode.value); }
}

class NumberNode extends PrimitiveNode {
	getRawValue () { return +this.syntaxNode.value; }
}

class BooleanNode extends PrimitiveNode {
	getRawValue () { return JSON.parse(this.syntaxNode.value); }
}

class UndefinedNode extends PrimitiveNode {
	getRawValue () { return undefined; }
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
	// note: we assume that the outermost syntax node is of type "block", so that the root is always an ObjectNode. This is important for scoping and resolving self
	interpretTest(scope = Scope.EMPTY, blockType = 'Indent', nodeFactory = new NodeFactory()) {
		const encoded = new PreProcessor(this.source).encodeIndentation();
		const AST = parse(encoded, blockType);
		const root = nodeFactory.animate(AST, null, nodeFactory);
		root.resolveReferences(scope);

		if (VERBOSE) console.log(root);

		return root;
	}
}

export {
	NodeFactory,
	Scope,

	Node,
	ObjectNode,
	ReferenceNode,
	CloneNode,
	BinopNode,
	MemberAccessNode,
	InsertionNode,
	CollectorNode,
	UnaryNode,
	PrimitiveNode,
	StringNode,
	NumberNode,
	BooleanNode,
	UndefinedNode,

	Interpreter,
};
