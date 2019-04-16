import { PreProcessor } from '../preprocessor';

test('control test', () => {
	let text = 
`( ( foo ) ) ( bar )
	indented block
		another indented block
back to base level`;
	let processor = new PreProcessor(text);
	processor.setIndentSequence();
	let blockBoundaries = processor.getBlockIterator();
	expect([...blockBoundaries]).toMatchSnapshot();
});
