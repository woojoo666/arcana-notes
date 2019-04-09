// TODO: use jasmine test framework

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
make,
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


var noIndentChar = "foo: bar";
var tabIndentChar = `
	foo
		bar`;
var spacesIndentChar = `
    foo
        bar`;
var mixedIndentChars = `
	foo
	    bar`;
var illegalIndentChar = "\r  foo";

console.assert(getIndentSequence(noIndentChar) === '\t', "indentation error");
console.assert(getIndentSequence(tabIndentChar) === '\t', "indentation error");
console.assert(getIndentSequence(spacesIndentChar) === ' ', "indentation error");

try {
	console.log(getIndentSequence(mixedIndentChars));
	console.log(getIndentSequence(illegalIndentChar));
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

// ------------------- extract block tests -----------------

(function blockIteratorTests() {

	// Helper function, makes sure that the list of block delimiters returned by getBlockIterator
	// matches the expected list.
	function checkDelimiters(actual, expected) {
		actual = [...actual] // convert it from an iterable to an array
		if (actual.length != expected.length) return false;
		for (let [index, delimiter] of actual.entries()) {
			if (delimiter.delimiterType != expected[index].delimiterType) {
				return false;
			}
			if (delimiter.blockType != expected[index].blockType) {
				return false;
			}
		}
		return true;
	}

	// Generates the expected block delimiter objects from a sequence of (){} characters
	// for example, ({}) will generate:
	//		{ delimiterType: "start", blockType: "Braces" },
	//		{ delimiterType: "start", blockType: "Indent" },
	//		{ delimiterType: "end"  , blockType: "Indent" },
	//		{ delimiterType: "end"  , blockType: "Braces" },
	function generateExpected (str) {
		return [...str].map(char => ({
			delimiterType: /\(|\{/.test(char) ? 'start' : 'end',  // if ( or {, use 'start'
			blockType:     /\(|\)/.test(char) ? 'Braces' : 'Indent',  // if ( or ), use 'Braces'
		}));
	}

	// test the test functions
	console.assert(checkDelimiters(generateExpected('({})'),[
			{ delimiterType: "start", blockType: "Braces" },
			{ delimiterType: "start", blockType: "Indent" },
			{ delimiterType: "end"  , blockType: "Indent" },
			{ delimiterType: "end"  , blockType: "Braces" },
		]), 'error in test helper function generateExpected() or checkDelimiters()');


	let controlTest = {
		name: 'controlTest',
		text:
`( ( foo ) ) ( bar )
	indented block
		another indented block
back to base level`,
		expected: generateExpected('(())(){{}}')
	};


	// note that the base level starts at indentation level 1 here
	let emptyLineAtStartOrEnd = {
		name: 'emptyLineAtStartOrEnd',
		text:
`
	foo
		indented block
			another indented block
`, // should implicitly return to base level because end of input
		expected: generateExpected('{{}}')
	};


	let multilineBracedBlock = {
		name: 'multilineBracedBlock',
		text:
`( ( foo ) + 10
	+ 20
		+ 30 )
	indented block`,
		expected: generateExpected('(()){}')
	};


	let multilineBracedBlock2 = {
		name: 'multilineBracedBlock2',
		text:
`( ( foo ) + 10
	+ 20
		+ 30
)
	indented block`,
		expected: generateExpected('(()){}')
	};


	let multilineBracedBlock3 = {
		name: 'multilineBracedBlock3',
		text:
`( ( foo ) + 10
	+ 20
		+ 30
)
base level block`,
		expected: generateExpected('(())')
	};


	let unclosedBrace = {
		name: 'unclosedBrace',
		text:
`( ( foo ) ( bar )
	indented block`,
		expected: null
	};

	let extraClosedBrace = {
		name: 'extraClosedBrace',
		text:
`( ( foo ) ( bar ) ) )
	indented block`,
		expected: null
	};

	let illegalDedent = {
		name: 'illegalDedent',
		text:
`	indented block
			another indented block
		illegal dedent`,
		expected: null
	};

	let dedentedBelowBase = {
		name: 'dedentedBelowBase',
		text:
`	first line
oops dedented too far`,
		expected: null
	};

	let dedentedBelowBlockBase = {
		name: 'dedentedBelowBlockBase',
		text:
`base level
	( braced block base level
oops
	)`,
		expected: null
	};

	// TODO: this is unnecessary if we use Jasmine testing framework
	function assertError(fn) {

		let errorThrown = null;

		try {
			fn();
		} catch (err) {
			errorThrown = err;
		}

		if (errorThrown) {
			console.log('Assertion succeeded, an error was successfully thrown: \"' + errorThrown.message + '\"');
		} else {
			throw Error('Assertion fail. Expected an error, but none was thrown');
		}
	}

	let tests = [
		controlTest,
		emptyLineAtStartOrEnd,
		multilineBracedBlock,
		multilineBracedBlock2,
		multilineBracedBlock3,
		unclosedBrace,
		extraClosedBrace,
		illegalDedent,
		dedentedBelowBase,
		dedentedBelowBlockBase,
	];


	let controlTest_indentSequence = getIndentSequence(controlTest.text);
	console.table([...getBlockIterator(controlTest.text, controlTest_indentSequence)]);

	tests.forEach(testCase => {
		console.log('Starting test: ' + testCase.name);
		let indentSequence = getIndentSequence(testCase.text);
		if (testCase.expected != null) {
			let blockDelimiters = getBlockIterator(testCase.text, indentSequence);
			console.assert(checkDelimiters(blockDelimiters, testCase.expected), "getBlockIterator() test failed");
		} else {
			assertError(() => [...getBlockIterator(testCase.text, indentSequence)]);
		}
	});
})();
