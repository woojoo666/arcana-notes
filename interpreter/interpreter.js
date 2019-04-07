// This contains all the "glue" connecting the preprocessor, lexer, parser, and interpreter

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
Notice that it is recursive, so every object node contains child object nodes,
	which keep track of their offset and original block length,
	so when any piece of code changes, you can traverse the node tree to figure
	out exactly which node needs to be re-parsed.
*/

// analyzes braces and indentation to extract all nested blocks
// returns undefined if block structure is illegal, eg if there are unclosed braces
function extractBlocks(text) {

	let match = text.match(/(^|\n)[ \t]+/);
	if (match)
	let indentChar = match[0];

	text.match(/(\(|\)|(^)) 

	xxxx UNFINISHED xxxx
	
	let lines = block.split('\n').filter(str => ! /^\s*$/.test(str));   // split into lines and filter out empty lines

	if (lines.length <= 0) {
		return []; // empty block
	}

	let blockIndentationLevel = text.match(/^\t*/)[0].length; // indentation level of this entire block is determined by first line

	let tokens = [];
	lines.forEach(line => {
		while (line != '') {
			
		}
	});
}

// if nestedBlocks isn't provided, will call extractBlocks to extract nested blocks
// note that since extractBlocks recurses deeply and extracts all nested blocks, theoretically
// extractBlocks should only need to be called on the top-level block, and then every block will pass
// along the extracted block data recursively so no child needs to call extractBlocks again
function parseBlock(blockString, nestedBlocks) {
	// call parser?
}

