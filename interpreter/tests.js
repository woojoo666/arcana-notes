// ------------------ preprocessor tests --------------------

// some empty lines with spaces and tabs in them
var emptyLinesTest = `
	    
	test


	lineWithComment   // some comment
 
`;

var test1 = `
a: 10
b: 20
c: (x: a, y: b)
d:
	foo: 1
	bar: 2
`;

var testIndentation = `start
in this 	program
	I 	test indentation
parsing
	these are
	some statements
	on the same level
here
	we
	test
		multiple
			dedentations
at once`;

var testIndentation2 = `start
test
	indentedLastLine`;

var badIndentation = `start
this
		is
	bad
indentation`;

var alreadyCommas = `start
make
	sure we,
	aren't adding,
	double commas,`;

var indentedFirstLine = `		start
		first line
		indentation level 2
			test
				test`;

var dedentPastFirstLine = `		start
		first line
		indentation level 2
oops`;

console.log(emptyLinesAndCommentsProcessing(emptyLinesTest));
console.log(emptyLinesAndCommentsProcessing(test1));


// note that these tests will add an extra comma at the front
console.log(indentationProcessing(testIndentation));
console.log(indentationProcessing(testIndentation2));

try {
console.log(indentationProcessing(badIndentation));
} catch (err) {
	console.log(err);
}

console.log(indentationProcessing(alreadyCommas));

console.log(indentationProcessing(indentedFirstLine));

try {
console.log(indentationProcessing(dedentPastFirstLine));
} catch (err) {
	console.log(err);
}

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
