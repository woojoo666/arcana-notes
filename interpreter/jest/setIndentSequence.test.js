import { PreProcessor } from '../preprocessor';


let noIndentation = "foo: bar";
let tabIndentation = `
	foo
		bar`;
let spacesIndentation = `
  foo
    bar`;
let mixedIndentation = `
	foo
	  bar`;
let illegalIndentation = "\r  foo";


test('indentation using tabs', () => {
	let processor = new PreProcessor(tabIndentation);
	processor.setIndentSequence();
	expect(processor.indentSequence).toBe('\t');
});

test('indentation using spaces', () => {
	let processor = new PreProcessor(spacesIndentation);
	processor.setIndentSequence();
	expect(processor.indentSequence).toBe(' ');
});

test('no indentation, should use the default indentSequence, tabs', () => {
	let processor = new PreProcessor(noIndentation);
	processor.setIndentSequence();
	expect(processor.indentSequence).toBe('\t');
});

test('mixed indentation, should throw an error', () => {
	let processor = new PreProcessor(mixedIndentation);
	expect(processor.setIndentSequence).toThrow();
});

test('illegal indentation character, should throw an error', () => {
	let processor = new PreProcessor(illegalIndentation);
	expect(processor.setIndentSequence).toThrow();
});
