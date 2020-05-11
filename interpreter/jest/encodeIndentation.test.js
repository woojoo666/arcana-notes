import { PreProcessor } from '../preprocessor';

let tabbedIndentation = `
foo
	bar(
		baz
	)
zed
`;

test('no indentation, should not change', () => {
	let noIndentation = 'foo ( bar ( baz ) )';
	expect(new PreProcessor(noIndentation).encodeIndentation()).toEqual(noIndentation);
});

test('empty string, should return empty', () => {
	let empty = '';
	expect(new PreProcessor(empty).encodeIndentation()).toEqual('');
});

test('convert indentation to braces', () => {
	expect(new PreProcessor(tabbedIndentation).encodeIndentation()).toMatchSnapshot();
});
