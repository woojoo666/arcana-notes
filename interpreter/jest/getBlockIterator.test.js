import { PreProcessor } from '../preprocessor';

expect.extend({
	toEqualDelimiterString(received, delimiterStr) {
		let array = [...received];          // convert iterable to array
		let stripped = array.map(obj => {   // strip extraneous properties
			delete obj.offset;
			delete obj.text;
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
//		{ delimiterType: "start", blockType: "Braces" },
//		{ delimiterType: "start", blockType: "Indent" },
//		{ delimiterType: "end"  , blockType: "Indent" },
//		{ delimiterType: "end"  , blockType: "Braces" },
function fromDelimiterString (delimiterStr) {
	return [...delimiterStr].map(char => ({
		delimiterType: /\(|\{/.test(char) ? 'start' : 'end',  // if ( or {, use 'start'
		blockType:     /\(|\)/.test(char) ? 'Braces' : 'Indent',  // if ( or ), use 'Braces'
	}));
}

// test the helper functions
test('test custom matcher and helper function fromDelimiterString()', () => {
	let delimiters = [
		{ delimiterType: 'start', blockType: 'Braces', offset: 123, text: 'junk' },   // note: junk offsets and text
		{ delimiterType: 'start', blockType: 'Indent', offset: 123, text: 'junk' },
		{ delimiterType: 'end'  , blockType: 'Indent', offset: 123, text: 'junk' },
		{ delimiterType: 'end'  , blockType: 'Braces', offset: 123, text: 'junk' },
	];
	let delimiterStr = '({})';
	expect(delimiters).toEqualDelimiterString(delimiterStr);
});

test('control test', () => {
	let text = 
`( ( foo ) ) ( bar )
	indented block
		another indented block
back to base level`;
	let processor = new PreProcessor(text);
	processor.setIndentSequence();
	expect(processor.indentSequence).toBe('\t');
	let blockBoundaries = processor.getBlockIterator();
	expect(blockBoundaries).toEqualDelimiterString('(())(){{}}');
	expect([...blockBoundaries]).toMatchSnapshot();
});
