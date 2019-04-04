// preprocessing
function preprocessor(program) {
	var processed = program;
	processed = emptyLinesAndCommentsProcessing(processed);
	processed = indentationProcessing(processed);

	return processed;
}

function emptyLinesAndCommentsProcessing(text) {
	text = text.replace(/(^|\n)\s*\n/g, (_, linebreak) => linebreak); // removes empty lines at start or middle of program
	text = text.replace(/\s*$/g, '');        // removes empty lines and whitespace at end of program

	text = text.replace(/\/\/.*($|\n)/g, (_, linebreak) => linebreak);    // strips out comments

	return text;
}

// note that text input should not have empty lines
// we are using "{" and "}" to denote indentation increases/decreases
//
// parse each line, such that:
//    * when indentation increases, insert a INDENT token "{"
//    * when indentation decreases, insert a DEDENT token "}" and a comma ","
//       * note that indentation can decrease multiple times at once
//    * if indentation stays the same, insert a "," delimiter if there isn't one already
//
// also note that the initial indentation level of the program is determined by the first line
function indentationProcessing(text) {

	let firstLineIndentation = text.match(/^\t*/)[0].length; // subtract out first ^ char

	let indentationStack = [firstLineIndentation];
	let lastLevel = indentationStack[indentationStack.length - 1];  // lastLevel is always the top of the stack

	// add a newline at the end with same indentation as first line, to finalize the indentation processing
	text += '\n' + '\t'.repeat(firstLineIndentation);

	const INDENT_TOKEN = '{';
	const DEDENT_TOKEN = '}';

	// find every newline via regex, and process the indentation after it
	return text.replace(/(,?)\n(\t*)/g, (_, comma, indentation) => {
		let indentationLevel = indentation.length;   // counts number of indents
		let replacement = comma || '';

		if (indentationLevel > lastLevel) {
			// if indentation increased, push new level to stack, and insert "INDENT" token to program
			indentationStack.push(indentationLevel);
			lastLevel = indentationStack[indentationStack.length - 1];
			replacement += INDENT_TOKEN;

		} else if (indentationLevel == lastLevel) {
			// for statements that are on the same level, replace the newline with a comma
			// if there already is a comma, this will simply keep it the same
			replacement = ',';

		} else {
			// if indentation decreased, pop levels from stack and insert "DEDENT" token to program, until indentation level matches
			while (indentationLevel < lastLevel) {
				indentationStack.pop();
				lastLevel = indentationStack[indentationStack.length - 1];
				replacement += DEDENT_TOKEN + ',';  // a dedent finalizes both the block and the statement that the block is in, so add a comma
			}
			if (indentationLevel != lastLevel) {
				// INVALID INDENTATION, we have dedented to a level that we never indented to in the first place (see "badIndentation" test)
				// note that this will also naturally catch cases where we dedent past the first line indentation (see "dedentPastFirstLine" test)
				throw Error("Pre-processing error, bad indentation");
			}
		}
		return replacement;
	});
}
