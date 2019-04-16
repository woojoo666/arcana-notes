// PreProcessor and Block Classes

import { matchAll } from './matchAllPolyfill.js';

// notice that this indentation regex includes lines with zero indentation
const indentationRegex = /(^|\n)([^\S\n]*)\S/; // [^\S\n] matches all whitespace except newlines. you can also use (?!\n)\s
const parenthesisRegex = /\(|\)/;

class PreProcessor {

	constructor (rawText) {
		this.rawText = rawText;
		this.indentSequence = '';
	}
}

// preprocessing
PreProcessor.prototype.run = function () {
	try {
		this.setIndentSequence();
		let blockBoundaries = this.getBlockIterator();
		this.constructBlockTree(blockBoundaries);
		this.parseBlockRecursive(this.rootBlock);

	} catch (err) {
		console.log("Syntax error detected in preprocessor");
		console.log(err);
	}
}

// Returns the character used for indentation, either spaces " " or tabs "\t"
// Returns tabs by default, if zero indentation is detected in the file.
// Throw error if mixed tabs and spaces detected, or if indentation uses a different character entirely.

// TODO: indicate line number and column number in error message.
// TODO: we can also calculate baseIndentation here
PreProcessor.prototype.setIndentSequence = function () {

	this.indentSequence = null;  // default indent sequence is "\t"

	// note: String.protype.matchAll is not supported in IE, Edge, Opera, or Node.js,
	//       so instead I am using a matchAll function provided in matchAllPolyfill.js
	let indentationMatches = matchAll(this.rawText, new RegExp(indentationRegex, 'g'));

	// go through all indentations in the file
	for (let match of indentationMatches) {

		let indentation = match[2];

		if (indentation.length <= 0) continue;   // indentationRegex includes lines with zero indentation, so skip them

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
	};

	if (!this.indentSequence) {
		this.indentSequence = '\t';   // default indent sequence is "\t"
	}

	return this;
}

PreProcessor.prototype.getBlockIterator = function () {

	let self = this;

	// takes an indentationRegex match, and returns the indentation length
	function indentLength (match) {
		let indentation = match[2]; // indentation should be in the second capture group
		return indentation.split(self.indentSequence).length - 1;
	}

	// match parenthesis, indentation, and end of input
	// note: RegExp.exec() and matchAll() will infinitely match $ if used with the 'g' flag,
	//       so make sure to check for that when looping through the matches.
	let blockRegex = new RegExp(parenthesisRegex.source+'|'+indentationRegex.source+'|$', 'g');

	// make sure to use an iterable here, not an array, because matching $ with the global flag will infinitely loop at the end
	let matches = matchAll(this.rawText, blockRegex); // provided in matchAllPolyfill.js

	// TODO: baseIndentation can be found in setIndentSequence
	let baseIndentation = indentLength(this.rawText.match(indentationRegex), this.indentSequence); // get indentation of first line
	let indentationStack = [baseIndentation];
	let lastLevel = indentationStack[indentationStack.length - 1];  // lastLevel is always the top of the stack

	let bracesLevel = 0;

	return {
		*[Symbol.iterator]() {

			for (let match of matches) {
				// note that matching $ with global flag will cause it to match infinitely,
				// so make sure we exit after the first match of $
				let endOfInput = match[0].length == 0;

				let blockType = parenthesisRegex.test(match[0]) ? 'Braces' : 'Indent';
				let delimiterType = null;  // "start" to indicate block start, "end" for end of a block
				let offset = match.index;
				let offsetLast = match.index + match[0].length;

				if (blockType == 'Braces') {
					if (match[0] == '(') {
						delimiterType = 'start';
						bracesLevel++;
					} else {
						delimiterType = 'end';
						bracesLevel--;
						if (bracesLevel < 0)
							throw Error('Pre-processing error, extra closed brace at offset ' + offset);
					}

					yield { delimiterType, blockType, offset, text: match[0] };

				} else { // indent type is "Indent"
					let indentationLevel = null;

					if (endOfInput) { // this means we are at end of input (matched with "$")
						indentationLevel = baseIndentation; 
					} else {
						indentationLevel = indentLength(match);   // counts number of indents
					}

					// If we are inside a braced block, make sure indentation stays above the block's base level,
					// but otherwise ignore the indentation
					if (bracesLevel > 0) {
						if (indentationLevel < lastLevel) {
							throw Error('Pre-processing error, dedented below the base indentation of this braced block, offset ' + offset);
						}
						if (endOfInput) {
							throw Error('Pre-processing error, unclosed braces');
							break;  // break, to prevent infinite loops from $ constantly matching
						}
						continue;
					}

					if (indentationLevel > lastLevel) { // indentation increased
						indentationStack.push(indentationLevel);
						lastLevel = indentationStack[indentationStack.length - 1];

						delimiterType = "start";
						yield { delimiterType, blockType, offset, text: match[0] };
					
					} else if (indentationLevel < lastLevel) { // indentation decreased
						while (indentationLevel < lastLevel) { // pop levels from stack until indentation level matches
							indentationStack.pop();
							lastLevel = indentationStack[indentationStack.length - 1];

							if (indentationStack.length == 0) {
								throw Error("Pre-processing error, dedented below the first line's indentation, offset " + offset);
							}
							delimiterType = "end";
							yield { delimiterType, blockType, offset, text: match[0] };
						}
						if (indentationLevel != lastLevel) {
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
		return this.idCounter++;
	}

	constructor (text, parent, blockType) {
		this.text = text;
		this.parent = parent; // parent block
		this.blockType = blockType;
		this.children = [];   // every chunk is either a slice of the parent, or an annotation like "{ BLOCK_12 }"

		this.id = Block.genId();
	}

	getBlockString () {
		if (this.children.length == 0) {
			return this.text.slice(this.startOffset, this.endOffset);
		}

		// if you have say, 3 children, it should end up something like this
		// <text> (Block1)  <text> {Block2} <text> {Block3} <text>
		// note that for braced blocks, we don't need to add "(" or ")", because it is already in the text

		let str = this.text.slice(this.startOffset, this.children[0].endOffset)
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

			str += this.text.slice(current.endOffset, next.startOffset);
		}
		return str;
	}
}

PreProcessor.prototype.constructBlockTree = function (blockBoundaries) {
	this.rootBlock = new Block(this.rawText, null, null);
	let blockStack = [this.rootBlock];
	let currentBlock = this.rootBlock;

	function stackPush(item) {
		blockStack.push(item);
		currentBlock = blockStack[blockStack.length-1];
	}

	function stackPop() {
		blockStack.pop();
		currentBlock = blockStack[blockStack.length-1];
	}

	for (let { delimiterType, blockType, offset, text } of blockBoundaries) {
		if (delimiterType == 'start') {
			let child = new Block(this.rawText, currentBlock, blockType);
			child.startOffset = offset+text.length;
			currentBlock.children.push(child);

			stackPush(child);
		} else {
			currentBlock.endOffset = offset;
			stackPop();
		}
	}

	return this;
}

PreProcessor.prototype.parseBlockRecursive = function (block) {
	block.parseTree = parse(block.getBlockString());
	for (let child of block.children) {
		this.parseBlockRecursive(child);
	}

	return this;
}

export { PreProcessor, Block };
