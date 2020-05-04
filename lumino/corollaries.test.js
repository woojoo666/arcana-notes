import { transform } from './corollaries';

const example_shorthand = {
	properties: {
		addr_10: 'NEXT',
		addr_11: 'VALUE',
		addr_255: 'addr_101[addr_751]',
        addr_231: 'addr_255()',

		addr_500: { type: 'access', source: 'addr_501', address: 'addr_502' }, // transform() should support long-hand syntax as well
	},
	outbox: [
		'addr_999 <: addr_509',
	],
}

const example_output = {
	properties: {
		'addr_10': { type: 'inbox_next' },
		'addr_11': { type: 'inbox_value' },
		'addr_255': { type: 'access', source: 'addr_101', address: 'addr_751' },
		'addr_231': { type: 'spawn', source: 'addr_255' },
		'addr_500': { type: 'access', source: 'addr_501', address: 'addr_502' },
	},
	outbox: [
		{ source: 'addr_509', target: 'addr_999' },
	],
}

test('basic shorthand', () => {
    expect(transform(example_shorthand)).toEqual(example_output);
});
