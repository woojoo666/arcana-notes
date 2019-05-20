// This contains all the "glue" connecting the preprocessor, lexer, parser, and interpreter

import { PreProcessor, Block } from './preprocessor.js';
import { parse } from './parser.js';

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

function NodeFactory (syntaxNode, parent) {
	switch (syntaxNode.type) {
		case 'block': return new ObjectNode(syntaxNode, parent);
		case 'binop': return new BinopNode(syntaxNode, parent);
		case 'unaryop': return new UnaryNode(syntaxNode, parent);
		case 'memberAccess': return new MemberAccessNode(syntaxNode, parent);
		case 'reference': return new ReferenceNode(syntaxNode, parent);
		case 'string': return new StringNode(syntaxNode, parent);
		case 'number': return new NumberNode(syntaxNode, parent);
		case 'create': return NodeFactory(syntaxNode.block, parent); // 'create' nodes contain a 'block' node
		case 'clone': return new CloneNode(syntaxNode, parent);
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
		// TODO
	}
	resolveReferences (scope) {
		throw Error(`Unimplemented ${this.constructor.name}.resolveReferences() function`);
	}
	// sets the value
	evaluate () {
		throw Error(`Unimplemented ${this.constructor.name}.evaluate() function`);
	}
	clone (parent) {
		throw Error(`Unimplemented ${this.constructor.name}.clone() function`);
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
}

// represents an object, with properties and insertions
// TODO: right now an ObjectNode listens to changes to any property nodes,
//       and will trigger all memberAccess nodes listening. This means that,
//       if you have a giant tree of object nodes, a change in one of the leaves
//       will trigger the entire tree to update. This would not be necessary with alias binding...
class ObjectNode extends Node {
	constructor (syntaxNode, parent) {
		super(syntaxNode, parent);
		this.children = [];   // TODO: should we keep references to children (aka nested blocks)?
		this.properties = {}; // static properties
		this.insertions = []; // TODO
		this.value = false; // see ObjectNode.evaluate() for why we do this

		for (const statement of syntaxNode.statements) {
			switch (statement.type) {
				case 'property':
					this.properties[statement.key] = NodeFactory(statement.value, this);
					break;
				case 'insertion':
					throw Error('Unimplemented insertion handling'); // TODO
					break;
			}
		}
	}
	clone (parent) {
		let newNode = new ObjectNode({statements: []}, parent); // use a dummy syntaxNode
		for (const [key, valueNode] of Object.entries(this.properties)) {
			newNode.properties[key] = valueNode.clone(newNode);
		}
		// TODO: clone insertions
		return newNode;
	}
	evaluate() {
		return this.properties; // the value of an object node is its properties
	}
	// ObjectNode updates should _always_ trigger MemberAccessNodes to update. So we simply
	// manually trigger the listeners. Note that each MemberAccessNode.update()
	update () {
		console.log(`updating ${this.constructor.name} with id ${this.id}`); // for debugging
		this.value = this.evaluate();
		for (const listener of this.listeners) {
			listener.update();
		}
	}
	// recursively called on neighbor nodes, finds and resolves ReferenceNode nodes
	resolveReferences (scope) {
		// TODO: we don't need to store scope, it is only used to resolve references before runtime.
		//       Might be helpful for debugging though
		this.scope = Object.create(scope); // leverage javascript inheritance & prototype tree for scopes

		for (const [key, valueNode] of Object.entries(this.properties)) {
			this.scope[key] = valueNode;
		}

		for (const valueNode of Object.values(this.properties)) {
			valueNode.resolveReferences(this.scope);
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
		this.target.addListener(newNode);
		return newNode;
	}
	// Reference resolution happens at the end of a cloning operation.
	// So we also use it to trigger evaluation, because the Reference nodes
	// are at the "leaves" of the clone, so the evaluation will ripple all the
	// way to the root.
	// Note that resolveReferences() is also used to override references in a clone operation.
	resolveReferences (scope) {
		if (scope[this.targetName]) {
			if (this.target) {
				this.target.removeListener(this); // unbind from old target
			}
			this.target = scope[this.targetName];
			if (this.target) {
				this.target.addListener(this);
			} else {
				console.log(`ReferenceNode with undefined target ${this.targetName}, possibly an implicit input?`);
			}
		}
		this.update(); // TODO: do we need to update() if target doesn't change?
	}
	evaluate () {
		return this.target && this.target.value;
	}
	// Tweak the update() function so that we always update if the target is an ObjectNode
	// TODO: this feels hacky...
	update () {
		console.log(`updating ${this.constructor.name} with id ${this.id}`); // for debugging
		console.log(`target is of type: ${this.target.constructor.name}`); // for debugging
		const oldValue = this.value;
		this.value = this.evaluate();
		if (this.value != oldValue || this.target.constructor.name == 'ObjectNode') {	
			for (const listener of this.listeners) {
				listener.update();
			}
		}
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
	}
	clone (parent) {
		const newNode = new CloneNode(undefined, parent);
		newNode.source = this.source.clone(newNode);
		newNode.arguments = this.arguments.clone(newNode);
		return newNode;
	}
	resolveReferences (scope) {
		this.source.resolveReferences(scope);
		this.arguments.resolveReferences(scope);
	}
	// TODO: I think this would be a lot cleaner if all Nodes returned a Node as their evaluated value
	// TODO: this is all really hack, I'm not sure if it will handle certain edge cases like, if a node
	//       inside the sourceObject changes (but not the sourceObject itself), will it update the corresponding
	//       node inside the cloned object?
	evaluate () {
		// TODO: right now assumes that source is a reference, and arguments is a block
		const sourceProps = this.source.value;
		const argumentProps = this.arguments.properties;

		const combined = new ObjectNode({statements: []}, null); // temporary object node, so don't attach listeners?
		for (const [key, valueNode] of Object.entries(argumentProps)) {
			combined.properties[key] = valueNode.clone(combined);
		}

		// inherit properties from source if they aren't already in arguments
		for (const [key, valueNode] of Object.entries(sourceProps)) {
			if (combined.properties[key] === undefined) {
				combined.properties[key] = valueNode.clone(combined);
			} else {
				// we still have to clone source properties that don't appear in the child object
				valueNode.clone(combined);
			}
		}

		const childScope = combined.properties;

		combined.resolveReferences(childScope); // start with empty scope

		return combined;
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
			case '=': return left == right;
			case '!=': return left != right;
			case '!==': return left !== right;
			case '&': return left && right;
			case '|': return left || right;
			// we should never get here because unknown binary operators should be caught in the parser
			default: throw Error(`Interpreter error: unknown binary operator "${operator}".`);
		}
	}
}

// TODO: should act like a binop node?
// TODO: currently, it's possible for there to be tons of member access nodes with the same source & key.
//       For example, if we had `a: foo.x, b: foo.x, c: foo.x, d: foo.x ...`. If the object changes,
//       all of these member access nodes will be triggered, even though we technically only need to trigger
//       one of them. Is there a better system?
class MemberAccessNode extends Node {
	constructor (syntaxNode, parent) {
		super(syntaxNode, parent);
		if (!syntaxNode) return; // a hack for cloning
		this.source = NodeFactory(syntaxNode.source, this);
		this.key = syntaxNode.key;
	}
	clone (parent) {
		const newNode = new MemberAccessNode(null, parent);
		newNode.source = this.source.clone(newNode);
		newNode.key = this.key;
		return newNode;
	}
	resolveReferences (scope) {
		this.source.resolveReferences(scope);
	}
	evaluate () {
		// TODO: if source is an Undefined object, then member access should return Undefined
		if (this.source.value === undefined) {
			throw Error('Interpreter error: trying to access property of a non-object.')
		}
		return this.source.value.properties[this.key].value;
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

// StringNodes start with value undefined, and then during reference resolution,
// will update once with the correct value. Then they will never change value again.
class StringNode extends Node {
	constructor (syntaxNode, parent) {
		super(syntaxNode, parent);
		this.value = syntaxNode.value; // StringNodes never need to be re-evaluated
	}
	evaluate (scope) { return this.value }  // this.value will never change
	// TODO: maybe we should override update() to not do anything, because NumberNodes never change?
	//       would be a slight optimization.

	clone (parent) {
		return new StringNode(this.syntaxNode, parent);
	}
	// StringNodes act like references to global Number objects, so just like ReferenceNodes,
	// they call update() during reference resolution to trigger the initial evaluation pass.
	resolveReferences (scope) {
		this.update();
	}
}

// NumberNodes start with value undefined, and then during reference resolution,
// will update once with the correct value. Then they will never change value again.
class NumberNode extends Node {
	constructor (syntaxNode, parent) {
		super(syntaxNode, parent);
	}
	evaluate (scope) { return this.syntaxNode.value }  // always returns the same value
	// TODO: maybe we should override update() to not do anything, because NumberNodes never change?
	//       would be a slight optimization.

	clone (parent) {
		return new NumberNode(this.syntaxNode, parent);
	}
	// NumberNodes act like references to global Number objects, so just like ReferenceNodes,
	// they call update() during reference resolution to trigger the initial evaluation pass.
	resolveReferences (scope) {
		this.update();
	}
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
	interpretTest(scope, blockType) {
		const AST = parse(this.source, blockType);
		const root = NodeFactory(AST);
		root.resolveReferences(scope);  // start with empty scope
		console.log(root);
		return root;
	}
}

export { Interpreter, NumberNode };
