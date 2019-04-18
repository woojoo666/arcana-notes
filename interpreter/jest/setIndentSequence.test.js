import { PreProcessor } from '../preprocessor';


let noIndentation = '';
let tabIndentation = '\t\t';
let spacesIndentation = '  ';
let mixedIndentation = '\t  ';
let illegalIndentation = '\r';

// In the following tests, since we are manually calling indentLength, 
// we don't need to initialize the PreProcessor with any arguments

test('indentation using tabs', () => {
	let processor = new PreProcessor();
	expect(processor.indentLength(tabIndentation)).toBe(2);
	expect(processor.indentSequence).toBe('\t');
});

test('indentation using spaces', () => {
	let processor = new PreProcessor();
	expect(processor.indentLength(spacesIndentation)).toBe(2);
	expect(processor.indentSequence).toBe(' ');
});

test('no indentation, should use the default indentSequence, tabs', () => {
	let processor = new PreProcessor();
	expect(processor.indentLength(noIndentation)).toBe(0);
	expect(processor.indentSequence).toBe(null);
});

test('mixed indentation, should throw an error', () => {
	let processor = new PreProcessor();
	expect(processor.indentLength.bind(processor, mixedIndentation)).toThrow();
});

test('multi-line mixed indentation, should throw an error', () => {
	let processor = new PreProcessor();
	expect(processor.indentLength(tabIndentation)).toBe(2);  // first line should process fine
	expect(processor.indentLength.bind(processor, spacesIndentation)).toThrow();
})

test('illegal indentation character, should throw an error', () => {
	let processor = new PreProcessor();
	expect(processor.indentLength.bind(processor, illegalIndentation)).toThrow();
});
