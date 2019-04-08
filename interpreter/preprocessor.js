// preprocessing
function preprocessor(program) {
	var processed = program;
	try {
		let indentChar = getIndentCharacter(processed);

	} catch (err) {
		console.log("Syntax error detected in preprocessor");
		console.log(err);
	}

	// vvvv old stuff vvv
	processed = emptyLinesAndCommentsProcessing(processed);
	processed = indentationProcessing(processed);

	return processed;
}

// Returns the character used for indentation, either spaces " " or tabs "\t"
// Returns tabs by default, if zero indentation is detected in the file.
// Throw error if mixed tabs and spaces detected, or if indentation uses a different character entirely.

// TODO: indicate line number and column number in error message.
function getIndentCharacter(text) {

	let indentChar = '';

	// note: String.protype.matchAll is not supported in IE, Edge, Opera, or Node.js,
	//       so instead I am using a stringMatchAll function provided in matchAllPolyfill.js
	let indentationMatches = stringMatchAll(text, /(^|\n)([^\S\n]+)\S/g);  // [^\S\n] matches all whitespace except newlines. you can also use (?!\n)\s

	// go through all indentations in the file
	for (match of indentationMatches) {

		let indentation = match[2];

		let illegalIndentChars = indentation.replace(/[ \t]/g,''); // remove tabs and spaces to find illegal characters
		if (illegalIndentChars.length > 0) {
			// indentation contains characters other than tabs or spaces
			// throw error, and print out the first bad character
			throw Error('Bad indentation, illegal indentation character with unicode value '
				+ illegalIndentChars[0].charCodeAt(0));
		}

		if (!indentChar) {
			indentChar = indentation[0]; // set indentChar to first indentation character found
			// TODO: if indent char is spaces, maybe we should also track the number of spaces? eg 4 spaces = 1 indent
		}

		if (indentation.replace(new RegExp(indentChar, 'g'),'').length > 0) {
			throw Error('Bad indentation, mixed spaces and tabs');
		}
	};
	
	return indentChar || '\t';  // if no indentation character found, return "\t" by default
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
