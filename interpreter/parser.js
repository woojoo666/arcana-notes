import grammar from './grammar.js';

import { importCommonJS, VERBOSE } from './utils.js';
const nearley = importCommonJS('nearley');

// --------------------------- PARSER ----------------------------

// comparison of parser libraries: https://tomassetti.me/parsing-in-javascript/
// For now I am using the nearley.js library to generate the parser, as Canopy (http://canopy.jcoglan.com) doesn't support left-recursive rules
//     and Ohm(https://github.com/harc/ohm) makes it complicated to work with rules that have multiple "arity" (see https://nextjournal.com/dubroy/ohm-parsing-made-easy)
// I chose Nearley because it looks simple and concise. The playground (omrelli.ug/nearley-playground/) made it very easy to test grammars as well.

// first: convert indentation into INDENT and DEDENT, convert newlines to commas, and ignore indentation and newlines in braced blocks.
//        convert words and operators into tokens
//
// Then parse everything using Nearley.js
// Everything in the AST should correspond to an "actor" node, which we will use for the reactive updating.
// Even if-statements, for-loops, operators, all will use "actor" nodes

// Later I might switch from Nearley to a custom parser that will allow me to parse blocks independently to localize errors.


// note: `nearley` and `grammar` objects included by the scripts in the <head> of the html

function parse (text, blockType) {  // TODO: when we write our tokenizer, change this to take in tokens instead of raw text
	if (VERBOSE) console.log('parsing: \n' + text);
	try {
		const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
		parser.lexer.setBlockType(blockType);
		parser.feed(text);
		return parser.results[0]; // return first successful parsing
	} catch (err) {
		console.log("Error at character " + err.offset);
	}
}

export { parse };
