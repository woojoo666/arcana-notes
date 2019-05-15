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

function NodeFactory (syntaxNode) {
	switch (syntaxNode.type) {
		case 'block': return new ObjectNode(syntaxNode);
		case 'binop': return new BinopNode(syntaxNode);
		case 'unaryop': return new UnaryNode(syntaxNode);
		case 'memberAccess': return new MemberAccessNode(syntaxNode);
		case 'reference': return new ReferenceNode(syntaxNode);
		case 'string': return new StringNode(syntaxNode);
		case 'number': return new NumberNode(syntaxNode);
	}
	throw Error('No handler for syntaxNode of type ' + syntaxNode.type);
}

class Node {
	constructor (syntaxNode) {
		this.listeners = [];
		this.syntaxNode = syntaxNode;

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
	// sets the value
	evaluate () {
		throw Error("Unimplemented Node.evaluate() function");
	}
	update () {
		const oldValue = this.value;
		this.evaluate();
		if (this.value != oldValue) {	
			for (listener of this.listeners) {
				listener.update();
			}
		}
	}
}

// represents an object, with properties and insertions
class ObjectNode extends Node {
	constructor (syntaxNode) {
		super();
		this.children = [];   // TODO: should we keep references to children (aka nested blocks)?
		this.properties = []; // static properties
		this.insertions = []; // TODO

		for (const statement of syntaxNode.statements) {
			switch (statement.type) {
				case 'property':
					this.properties[statement.key] = NodeFactory(statement.value);
					break;
				case 'insertion':
					throw Error('Unimplemented insertion handling'); // TODO
					break;
			}
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
	constructor (syntaxNode) {
		super();
		this.targetName = syntaxNode.name;
	}
	resolveReferences (scope) {
		this.target = scope[this.targetName];
		if (this.target)
			this.target.addListener(this);
		else
			console.log(`ReferenceNode with undefined target ${this.targetName}, possibly an implicit input?`)
	}
	evaluate () {
		this.value = this.target.evaluate();
	}
}

// TODO: can we represent Node as simply a CloneNode without a source?
class CloneNode extends Node {
	constructor(syntaxNode) {
		super();
		this.source = NodeFactory(syntaxNode.source);
		this.arguments = NodeFactory(syntaxNode.block);
	}
	resolveReferences (scope) {
		this.source.resolveReferences(scope);
		this.arguments.resolveReferences(scope);
	}

	evaluate () {
		throw Error('Unimplemented CloneNode.evaluate()'); // TODO
	}
}

// TODO: short circuit for boolean ops?
// TODO: should we make operators extend regular objects, with properties and a _return property?
//       Right now we are directly returning the evaluated value.
class BinopNode extends Node {
	// TODO: support more than 2 operands?
	constructor (syntaxNode) {
		super();
		this.operands = [NodeFactory(syntaxNode.left), NodeFactory(syntaxNode.right)];
		this.operator = syntaxNode.operator;
	}

	resolveReferences (scope) {
		for (const operand of this.operands) {
			operand.resolveReferences(scope);
		}
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

// should act like a binop node?
class MemberAccessNode extends Node {
	constructor (syntaxNode) {
		super();
		this.source = NodeFactory(syntaxNode.source);
		this.key = syntaxNode.key;
	}
	resolveReferences (scope) {
		this.source.resolveReferences(scope);
	}
	evaluate () {
		if (this.source.properties === undefined) {
			throw Error('Interpreter error: trying to access property of a non-object.')
		}
		return this.source.properties[this.key];
	}
}

class UnaryNode extends Node {
	constructor (syntaxNode) {
		super();
		this.operand = NodeFactory(syntaxNode.value);
		this.operator = syntaxNode.operator;
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

class StringNode extends Node {
	resolveReferences (scope) {}  // do nothing
}

class NumberNode extends Node {
	resolveReferences (scope) {}  // do nothing
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

	interpretTest(blockType) {
		const AST = parse(this.source, blockType);
		const root = NodeFactory(AST);
		root.resolveReferences({});  // start with empty scope
		console.log(root);
	}
}

export { Interpreter };
