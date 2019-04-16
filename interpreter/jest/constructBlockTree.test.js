import { PreProcessor, Block } from '../preprocessor';

test('control test', () => {
	let text = 'alice(bob)cassie\n\tdave\nethan';
	let preprocessor = new PreProcessor(text);
	preprocessor.setIndentSequence();
	let blockBoundaries = preprocessor.getBlockIterator();
	preprocessor.constructBlockTree(blockBoundaries);

	let rootBlock = preprocessor.rootBlock;
	expect(rootBlock.startOffset).toBe(0);
	expect(rootBlock.endOffset).toBe(text.length);
	expect(rootBlock.children.length).toBe(2);

	let bobBlock = rootBlock.children[0];
	expect(bobBlock.startOffset).toBe(6);
	expect(bobBlock.endOffset).toBe(9);

	let daveBlock = rootBlock.children[1];
	expect(daveBlock.startOffset).toBe(18);
	expect(daveBlock.endOffset).toBe(22);
});
