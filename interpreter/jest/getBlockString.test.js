import { Block } from '../preprocessor';


test('control test', () => {
	let text = 'alice(bob)cassie\n\tdave\nethan';
	let root = new Block(text, null, null);
	root.startOffset = 0;
	root.endOffset = text.length;

	let bobBlock = new Block(text, root, 'Braces');
	let daveBlock = new Block(text, root, 'Indent');

	bobBlock.startOffset = 6;
	bobBlock.endOffset = 9;

	daveBlock.startOffset = 18;
	daveBlock.endOffset = 22;

	root.children = [bobBlock, daveBlock];
	expect(root.getBlockString()).toBe('alice(1)cassie\n\t{2}\nethan');
});
