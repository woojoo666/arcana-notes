import { PreProcessor } from '../preprocessor';

expect.extend({
	toEqualDelimiterString(received, delimiterStr) {
		let array = [...received];          // convert iterable to array
		let stripped = array.map(obj => {   // strip extraneous properties
			delete obj.offset;
			delete obj.matchText;
			return obj;
		});
		let pass = this.equals(stripped, fromDelimiterString(delimiterStr));
		return {
			message: () => `expected iterable to ${pass ? 'not ' : ''}match delimiter string \"${delimiterStr}\"`,
			pass: pass,
		};
	}
});

// Generates the expected block delimiter objects from a sequence of (){} characters
// for example, ({}) will generate:
//		{ direction: "start", blockType: "Braces" },
//		{ direction: "start", blockType: "Indent" },
//		{ direction: "end"  , blockType: "Indent" },
//		{ direction: "end"  , blockType: "Braces" },
function fromDelimiterString (delimiterStr) {
	return [...delimiterStr].map(char => ({
		direction: /\(|\{/.test(char) ? 'start' : 'end',  // if ( or {, use 'start'
		blockType: /\(|\)/.test(char) ? 'Braces' : 'Indent',  // if ( or ), use 'Braces'
	}));
}

// test the helper functions
test('test custom matcher and helper function fromDelimiterString()', () => {
	let delimiters = [
		{ direction: 'start', blockType: 'Braces', offset: 123, matchText: 'junk' },   // note: junk offsets and matchText
		{ direction: 'start', blockType: 'Indent', offset: 123, matchText: 'junk' },
		{ direction: 'end'  , blockType: 'Indent', offset: 123, matchText: 'junk' },
		{ direction: 'end'  , blockType: 'Braces', offset: 123, matchText: 'junk' },
	];
	let delimiterStr = '({})';
	expect(delimiters).toEqualDelimiterString(delimiterStr);
});

let shouldPass = [
	{
		name: 'controlTest',
		text:
`( ( foo ) ) ( bar )
	indented block
		another indented block
back to base level`,
		expected: ('{(())(){{}}}')
	},


	// note that the base level starts at indentation level 1 here
	{
		name: 'emptyLineAtStartOrEnd',
		text:
`
	foo
		indented block
			another indented block
`, // should implicitly return to base level because end of input
		expected: ('{{{}}}')
	},


	{
		name: 'multilineBracedBlock',
		text:
`( ( foo ) + 10
	+ 20
		+ 30 )
	indented block`,
		expected: ('{(()){}}')
	},


	{
		name: 'multilineBracedBlock2',
		text:
`( ( foo ) + 10
	+ 20
		+ 30
)
	indented block`,
		expected: ('{(()){}}')
	},


	{
		name: 'multilineBracedBlock3',
		text:
`( ( foo ) + 10
	+ 20
		+ 30
)
base level block`,
		expected: ('{(())}')
	},


	{
		name: 'indentedBraces',
		text:
`foo
	( bar )
base level block
(another)`,
		expected: ('{{()}()}')
	},
];

describe('Successfully retrieve block boundaries', () => {
	shouldPass.forEach(testCase => {
		test(testCase.name, () => {
			let processor = new PreProcessor(testCase.text);
			let blockBoundaries = processor.getBlockIterator();
			expect(blockBoundaries).toEqualDelimiterString(testCase.expected);
			expect([...blockBoundaries]).toMatchSnapshot();
		});
	});
});

let shouldFail = [
	{
		name: 'unclosedBrace',
		text:
`( ( foo ) ( bar )
	indented block`,
		expected: null
	},

	{
		name: 'extraClosedBrace',
		text:
`( ( foo ) ( bar ) ) )
	indented block`,
		expected: null
	},

	{
		name: 'illegalDedent',
		text:
`	indented block
			another indented block
		illegal dedent`,
		expected: null
	},

	{
		name: 'dedentedBelowBase',
		text:
`	first line
oops dedented too far`,
		expected: null
	},

	{
		name: 'dedentedBelowBlockBase',
		text:
`base level
	( braced block base level
oops
	)`,
		expected: null
	},
];

// TODO: check error messages, all messages should contain something like "preprocessor error"
describe('Should throw error while retrieving block boundaries', () => {
	shouldFail.forEach(testCase => {
		test(testCase.name, () => {
			let processor = new PreProcessor(testCase.text);
			let iterable = processor.getBlockIterator();
			expect(() => [...iterable]).toThrow();   // iterate through iterable to trigger errors
		});
	});
});
