function validateCollector (collector) {
    const items = collector.items;
    const properties = collector.properties;

    for (const [key, refNode] of collector.properties) {
        if (key == 'length') {
            if (refNode.value != items.size) throw Error('collector: length mismatch');
        } else if (typeof(key) == 'number' && key < items.size) {
            if (!items.has(refNode.target)) throw Error(`collector: in-bounds property ${key} has value that is not inside items`);
        } else {
            if (refNode.value !== undefined) throw Error(`collector: out-of-bounds property should be undefined`);
        }
    }
}

const getItems = collector => [...collector.items].map(item => item.value);

export { validateCollector, getItems };
