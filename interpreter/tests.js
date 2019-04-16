// ------------------- parser tests ------------------------

// parse function from parser.js

var parsetests = [
	'testkey:testval,nested:(nestkey:nestval),empty:(),notrailing:comma',
	'trailing:comma,',
	'this:should:fail',
];

parsetests.forEach(test => {
	console.log("Test Parse: " + test);
	console.log(parse(test));
});

// ------------------ integration tests -----------------

var testCode = `
testkey:testval,

foo:bar,
nested:
	another:block
	lets:(try:some,braced:blocks)

empty:()

last:
	test:test,
`;

// this should fail for now, until we implement list items
var shouldFail = `
foo:bar,
	implicitBlock:propval
`;

console.log(preprocessor(testCode));

console.log(parse(preprocessor(testCode)));
console.log(parse(preprocessor(shouldFail)));
