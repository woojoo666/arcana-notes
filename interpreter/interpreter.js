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

// override properties in the source node with arguments, and re-evaluate
function clone (sourceNode, argumentsNode) {

}

// Scope leverages the javascript prototypal inheritance system
class Scope {
	// appends the variables to the scope
	constructor (variables) {
		this.vars = variables;
	}
	extend (variables) {

		var newScope = Object.create(this.scope); // leverage javascript inheritance for scopes
		for (let v of variables) {
			this[v.name] = v.value;
		}
	}
	resolve (name) {
		return this.
	}
}

function NodeFactory (syntaxNode, scope) {
	switch (syntaxNode.type) {
		case 'block': return Node(syntaxNode, scope);
		case 'binop': return BinopNode(syntaxNode, scope);
		case 'unary': return UnaryNode(syntaxNode, scope);
		case 'memberAccess': return MemberAccessNode(syntaxNode, scope);
		case 'reference': return scope.resolve(syntaxNode.value);
		case 'string': return StringNode(syntaxNode);
		case 'number': return NumberNode(syntaxNode);
	}
	throw Error('No handler for syntaxNode of type ' + syntaxNode.type);
}

// represents an object, with properties and insertions
class Node {
	constructor (syntaxNode, scope) {
		this.listeners = [];
		this.syntaxNode = syntaxNode;
		this.children = [];
		this.properties = [];
		this.insertions = [];

		this.scope = Object.create(this.scope); // leverage javascript inheritance for scopes
		for (var prop in properties) {

		}

		for (statement of syntaxNode.statements) {
			switch (statement.type) {
				case 'property':
					this.properties[statement.key] = NodeFactory(statement.value, scope);
					break;
				case 'insertion':
					throw Error('Unimplemented insertion handling'); // TODO
					break;
			}
		}
	}
	addListener (listener) {
		this.listeners.push(listener);
	}
	removeListener (listener) {
		// TODO
	}

	// returns a value
	evaluate () {
		throw Error("unknown evaluate function");
	}
	update () {

		for (listener of this.listeners) {
			listener.update();
		}
	}
}

// TODO: can we represent Node as simply a CloneNode without a source?
class CloneNode extends Node {
	constructor(syntaxNode, scope) {

	}
}

// TODO: short circuit for boolean ops?
class BinopNode extends Node {
	constructor (syntaxNode, scope) {
		super(syntaxNode);
	}

	evaluate () {
		let left = this.syntaxNode.left.value;
		let right = this.syntaxNode.right.value;

		switch (this.syntaxNode.operator) {
			case '!': return left ! right;
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
			default: throw Error(`interpreter error: unknown syntax operator "${operator}".`);
		}
	}
}

// should act like a binop node
class MemberAccessNode extends BinopNode {
	constructor (syntaxNode, scope) {

	}

	evaluate () {

	}
}

class UnaryNode extends Node {
}

class StringNode extends Node {
	
}

class NumberNode extends Node {
	
}

class Interpreter {

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

		let AST = parse(blockString, block.blockType);
		let scope = ...; // TODO

		for (let child of block.children) {
			this.parseBlockRecursive(child);
		}

		return this;
	}

	interpretBlock(AST, scope) {
		
	}
}
