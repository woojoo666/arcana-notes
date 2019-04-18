// This contains all the "glue" connecting the preprocessor, lexer, parser, and interpreter

import { PreProcessor, Block } from './preprocessor.js';

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

	parseBlockRecursive (block) {
		let blockString = block.getBlockString();

		let tokens = lexicalAnalysis(blockString);

		for (let child of block.children) {
			this.parseBlockRecursive(child);
		}

		return this;
	}

	lexicalAnalysis (blockString) {

	}

	// if nestedBlocks isn't provided, will call extractBlocks to extract nested blocks
	// note that since extractBlocks recurses deeply and extracts all nested blocks, theoretically
	// extractBlocks should only need to be called on the top-level block, and then every block will pass
	// along the extracted block data recursively so no child needs to call extractBlocks again
	parseBlock (blockString, nestedBlocks) {
		// call parser?
	}

}
