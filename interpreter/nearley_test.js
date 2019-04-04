// from the "getting started" tutorial

const nearley = require("nearley");
const grammar = require("./nearley_test_grammar.js");

// Create a Parser object from our grammar.
const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

// Parse something!
parser.feed("foo\nbar\nfoo\nfoo");

// parser.results is an array of possible parsings.
console.log(parser.results); // [[[[ "foo" ],"\n" ]]]
