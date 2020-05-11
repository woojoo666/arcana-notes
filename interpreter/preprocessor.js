// PreProcessor and Block Classes

import { matchAll } from './utils.js';

// notice that indentation regexes include lines with zero indentation
const indentRegex = /\n([^\S\n]*)(?=\S)/;  // [^\S\n] matches all whitespace except newlines. you can also use (?!\n)\s
const firstIndentRegex = /^([^\S\n]*)(?=\S)/; // first line has to be handled separately because possible zero-length match
const parenRegex = /\(|\)/;

class PreProcessor {

	constructor (source) {
		this.source = source;
		this.indentSequence = null;
	}
}

// preprocessing
PreProcessor.prototype.run = function () {
	let blockBoundaries = this.getBlockIterator();
	this.constructBlockTree(blockBoundaries);
}

// Returns the indentation length
// sets the character used for indentation, either spaces " " or tabs "\t"
// Throw error if mixed tabs and spaces detected, or if indentation uses a different character entirely.
PreProcessor.prototype.indentLength = function (indentation) {

	if (indentation.length <= 0) return 0;

	let illegalIndentChars = indentation.replace(/[ \t]/g,''); // remove tabs and spaces to find illegal characters
	if (illegalIndentChars.length > 0) {
		// indentation contains characters other than tabs or spaces
		// throw error, and print out the first bad character
		throw Error('Bad indentation, illegal indentation character with unicode value '
			+ illegalIndentChars[0].charCodeAt(0));
	}

	if (!this.indentSequence) {
		this.indentSequence = indentation[0]; // set indentSequence to first indentation character found
		// TODO: if indent char is spaces, maybe we should also track the number of spaces? eg 4 spaces = 1 indent.
		//       If we do, then we should throw an error if there are spaces left-over, "inconsistent indentation error"
	}

	if (indentation.replace(new RegExp(this.indentSequence, 'g'),'').length > 0) {
		throw Error('Bad indentation, mixed spaces and tabs');
	}

	return  indentation.split(this.indentSequence).length - 1;
}

PreProcessor.prototype.getBlockIterator = function () {

	var self = this;

	// match parenthesis, indentation, and end of input
	// note: RegExp.exec() and matchAll() will infinitely match $ if used with the 'g' flag,
	//       so make sure to check for that when looping through the matches.
	// TODO: could we use Moo lexer for this?
	// TODO: ignore lines that are only contain comments
	let blockRegex = new RegExp(parenRegex.source+'|'+indentRegex.source+'|$', 'g');

	// make sure to use an iterable here, not an array, because matching $ with the global flag will infinitely loop at the end
	let matches = matchAll(this.source, blockRegex); // provided in matchAllPolyfill.js

	let baseIndent = -1;
	let indentStack = [baseIndent];
	function prevLevel() {
		return indentStack[indentStack.length - 1];
	}

	let bracesLevel = 0;
	return {
		*[Symbol.iterator]() {

			// first line has to be handled separately because possible zero-length match,
			// and zero-length matches cause matchAll() to loop infinitely
			let match = self.source.match(firstIndentRegex);
			if (match) {
				let indentLevel = self.indentLength(match[1]); 
				indentStack.push(indentLevel);
				yield { direction: 'start', blockType: 'Indent', offset: match.index, matchText: match[0] };
			}

			for (let match of matches) {
				// note that matching $ with global flag will cause it to match infinitely,
				// so make sure we exit after the first match of $
				let matchText = match[0];
				let endOfInput = match[0].length == 0;
				let blockType = parenRegex.test(matchText) ? 'Braces' : 'Indent';
				let direction = null;  // "start" to indicate block start, "end" for end of a block
				let offset = match.index;
				let offsetLast = match.index + matchText.length;

				if (blockType == 'Braces') {
					let direction = (matchText == '(')? 'start' : 'end';
					bracesLevel += (direction == 'start')? +1 : -1;
					if (bracesLevel < 0)
						throw Error('Pre-processing error, extra closed brace at offset ' + offset);

					yield { direction, blockType, offset, matchText };

				} else { // indent type is "Indent"
					let indentLevel = endOfInput ? baseIndent : self.indentLength(match[1]);

					// If we are inside a braced block, make sure indentation stays above the block's base level,
					// but otherwise ignore the indentation
					if (bracesLevel > 0) {
						if (indentLevel < prevLevel()) {
							throw Error('Pre-processing error, dedented below the base indentation of this braced block, offset ' + offset);
						}
						continue;
					}

					if (indentLevel > prevLevel()) { // indentation increased
						indentStack.push(indentLevel);

						yield { direction: 'start', blockType, offset, matchText };
					
					} else if (indentLevel < prevLevel()) { // indentation decreased
						while (indentLevel < prevLevel()) { // pop levels from stack until indentation level matches
							indentStack.pop();
							if (indentStack.length == 0) {
								throw Error("Pre-processing error, dedented below the first line's indentation, offset " + offset);
							}
							yield { direction: 'end', blockType, offset, matchText };
						}
						if (indentLevel != prevLevel()) {
							// INVALID INDENTATION, we have dedented to a level that we never indented to in the first place (see "badIndentation" test)
							// note that this will also naturally catch cases where we dedent past the first line indentation (see "dedentPastFirstLine" test)
							throw Error('Pre-processing error, bad indentation at offset ' + offset);
						}
					}
				}
				if (endOfInput) break;
			}
			if (bracesLevel > 0) {
				throw Error('Pre-processing error, unclosed braces');
			}
		}
	}
}

// a class for maintaining text offset mappings while doing string operations
class Block {

	static genId() {
		if (this.idCounter == undefined) {
			this.idCounter = 0;
		}
		return 'BLOCK_'+this.idCounter++;
	}

	constructor (source, parent, blockType) {
		this.source = source;
		this.parent = parent; // parent block
		this.blockType = blockType;
		this.children = [];   // every chunk is either a slice of the parent, or an annotation like "{ BLOCK_12 }"

		this.id = Block.genId();
	}

	getBlockString () {
		if (this.children.length == 0) {
			return this.source.slice(this.startOffset, this.endOffset);
		}

		// if you have say, 3 children, it should end up something like this
		// <text> (Block1) <text> {Block2} <text> {Block3} <text>

		let str = this.source.slice(this.startOffset, this.children[0].startOffset)
		for (let i = 0; i < this.children.length; i++) {

			let current = this.children[i];
			let next = null;

			if (i < this.children.length - 1) {
				next = this.children[i+1];
			} else {
				// if current child is the last child, then create a "dummy" next child
				next = { startOffset: this.endOffset };
			}

			if (current.blockType == 'Braces') {
				str += current.id;
			} else {
				str += '{' + current.id + '}';
			}

			str += this.source.slice(current.endOffset, next.startOffset);
		}
		return str;
	}
}

PreProcessor.prototype.constructBlockTree = function (blockBoundaries) {
	let blockStack = [];

	function currentBlock() {
		return blockStack[blockStack.length-1];
	}

	for (let { direction, blockType, offset, matchText } of blockBoundaries) {
		if (direction == 'start') {
			let child = new Block(this.source, currentBlock(), blockType);
			child.startOffset = offset+matchText.length;
			if (currentBlock() == null) { // if currentBlock is null, this must be the root block
				this.rootBlock = child;
			} else {
				currentBlock().children.push(child);
			}

			blockStack.push(child);
		} else {
			currentBlock().endOffset = offset;
			blockStack.pop();
		}
	}

	return this;
}

// Currently our interpreter don't support the recursive block structure created by constructBlockTree().
// So for now, we use this simple function to just convert indentation into "{" and "}" braces so we can feed it into the parser.
// Once our interpreting can support block trees, then we can interpret each block individually, and we won't need this function.
PreProcessor.prototype.encodeIndentation = function () {
	let blockBoundaries = this.getBlockIterator();
	let output = '';
	let lastOffset = 0;
	for (let { direction, blockType, offset, matchText } of blockBoundaries) {
		output += this.source.slice(lastOffset, offset);
		lastOffset = offset;
		if (blockType == 'Indent') {
			output += direction == 'start' ? ' { ' : ' } ';
		}
	}

	// The parser and interpreter currently expect the outermost block to be a Block of statements, not an Object (see grammar.ne).
	// However, getBlockIterator() always starts with an "indent start" boundary and ends with an "indent end" boundary,
	// so we end up with an extra "{" and "}" in the beginning and end. Strip these off.
	output = output.slice(3, -3);

	return output;
}

export { PreProcessor, Block };
