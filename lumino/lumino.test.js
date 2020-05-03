import { UNDEFINED, Firefly } from './lumino.js';

const adamTemplate = {
    properties: {
        'addr_next': { type: 'inbox_next' }, // the address for retrieving the next node in the inbox iterator
        'addr_val': { type: 'inbox_value' }, // the address for retrieving the value at the current node in the inbox iterator

        'addr_10': { type: 'access', source: 'addr_next', address: 'addr_val' }, // retrieve value of first inbox item, which should be eveTemplate
        'addr_11': { type: 'spawn', source: 'addr_10' }, // spawn eveTemplate
    },
    outbox: [
        { source: 'addr_11', target: 'addr_11' }, // insert value at addr_11 into itself (should insert eve into itself)
    ],
}

const eveTemplate = {
    properties: {
        'addr_eve_next': { type: 'inbox_next' },
        'addr_eve_val': { type: 'inbox_value' },

        'addr_255': { type: 'access', source: 'addr_101', address: 'addr_751' },
        'addr_231': { type: 'spawn', source: 'addr_255' },
    },
    outbox: [
        { source: 'addr_509', target: 'addr_999' },
    ]
}



test('basic tests', () => {
    const dummyValueNode = {
        value: eveTemplate, // note that usually, value contains live Actors, but for now we are using templates as actors as well
    }

    const adam = new Firefly(adamTemplate);
    adam.addItem(dummyValueNode);

    const eve = adam.getValue('addr_11');

	expect(eve).not.toBe(UNDEFINED);
    expect(eve.inbox_next).toBe('addr_eve_next');
    expect(eve.getValue(eve.inbox_next).getValue(eve.inbox_value)).toBe(eve);
});

// todo: test destructors
