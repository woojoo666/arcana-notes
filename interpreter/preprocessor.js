// PreProcessor and Block Classes

import { matchAll } from './matchAllPolyfill.js';

// notice that indentation regexes include lines with zero indentation
const newlineIndentRegex = /\n([^\S\n]*)(?=\S)/;  // [^\S\n] matches all whitespace except newlines. you can also use (?!\n)\s
const firstLineIndentRegex = /^([^\S\n]*)(?=\S)/; // first line has to be handled separately because possible zero-length match
const parenthesisRegex = /\(|\)/;

class PreProcessor {

	constructor (rawText) {
		this.rawText = rawText;
		this.indentSequence = null;
	}
}

// preprocessing
PreProcessor.prototype.run = function () {
	try {
		let blockBoundaries = this.getBlockIterator();
		this.constructBlockTree(blockBoundaries);
		this.parseBlockRecursive(this.rootBlock);

	} catch (err) {
		console.log("Syntax error detected in preprocessor");
		console.log(err);
	}
}

// Returns the indentation length
// sets the character used for indentation, either spaces " " or tabs "\t"
// Throw error if mixed tabs and spaces detected, or if indentation uses a different character entirely.
PreProcessor.prototype.getIndentationLength = function (indentation) {

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
	let blockRegex = new RegExp(parenthesisRegex.source+'|'+newlineIndentRegex.source+'|$', 'g');

	// make sure to use an iterable here, not an array, because matching $ with the global flag will infinitely loop at the end
	let matches = matchAll(this.rawText, blockRegex); // provided in matchAllPolyfill.js

	let baseIndentation = -1;
	let indentationStack = [baseIndentation];
	function previousLevel() {
		return indentationStack[indentationStack.length - 1];
	}

	let bracesLevel = 0;
	return {
		*[Symbol.iterator]() {

			// first line has to be handled separately because possible zero-length match,
			// and zero-length matches cause matchAll() to loop infinitely
			let firstLineMatch = self.rawText.match(firstLineIndentRegex);
			if (firstLineMatch) {
				let indentationLevel = self.getIndentationLength(firstLineMatch[1]); 
				indentationStack.push(indentationLevel);
				let blockType = 'Indent';
				let delimiterType = 'start';
				let offset = firstLineMatch.index;

				yield { delimiterType, blockType, offset, text: firstLineMatch[0] };
			}

			for (let match of matches) {
				// note that matching $ with global flag will cause it to match infinitely,
				// so make sure we exit after the first match of $
				let endOfInput = match[0].length == 0;

				// TODO: ignore lines that are only contain comments

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
						indentationLevel = self.getIndentationLength(match[1]);   // counts number of indents
					}

					// If we are inside a braced block, make sure indentation stays above the block's base level,
					// but otherwise ignore the indentation
					if (bracesLevel > 0) {
						if (indentationLevel < previousLevel()) {
							throw Error('Pre-processing error, dedented below the base indentation of this braced block, offset ' + offset);
						}
						continue;
					}

					if (indentationLevel > previousLevel()) { // indentation increased
						indentationStack.push(indentationLevel);

						delimiterType = "start";
						yield { delimiterType, blockType, offset, text: match[0] };
					
					} else if (indentationLevel < previousLevel()) { // indentation decreased
						while (indentationLevel < previousLevel()) { // pop levels from stack until indentation level matches
							indentationStack.pop();

							if (indentationStack.length == 0) {
								throw Error("Pre-processing error, dedented below the first line's indentation, offset " + offset);
							}
							delimiterType = "end";
							yield { delimiterType, blockType, offset, text: match[0] };
						}
						if (indentationLevel != previousLevel()) {
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

		let str = this.text.slice(this.startOffset, this.children[0].startOffset)
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
	let blockStack = [];

	function currentBlock() {
		return blockStack[blockStack.length-1];
	}

	for (let { delimiterType, blockType, offset, text } of blockBoundaries) {
		if (delimiterType == 'start') {
			let child = new Block(this.rawText, currentBlock(), blockType);
			child.startOffset = offset+text.length;
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

PreProcessor.prototype.parseBlockRecursive = function (block) {
	block.parseTree = parse(block.getBlockString());
	for (let child of block.children) {
		this.parseBlockRecursive(child);
	}

	return this;
}

export { PreProcessor, Block };
