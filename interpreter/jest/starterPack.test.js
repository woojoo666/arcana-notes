import fs from 'fs';
import path from 'path';
import { Interpreter, Scope } from '../interpreter.js';

const starterPackSrc = fs.readFileSync(path.resolve(__dirname, '../starter-pack.owo'), 'utf8');
let starterPack = new Interpreter(starterPackSrc).interpretTest(undefined, undefined, false);

const interpret = src => new Interpreter(src).interpretTest(new Scope(starterPack.properties), undefined, false); // use the starter pack as the outer scope

// simple test to make sure nothing crashes
test('test starter pack usage', () => {
    expect(interpret('x: toBoolean()').get('x')).not.toEqual(undefined);
});

test('test coerce to boolean', () => {
    // false
    expect(interpret('bool: toBoolean(x: false).result').get('bool')).toEqual(false);
    expect(interpret('bool: toBoolean(x: "").result').get('bool')).toEqual(false);
    expect(interpret('bool: toBoolean(x: 0).result').get('bool')).toEqual(false);
    expect(interpret('bool: toBoolean(x: undefined).result').get('bool')).toEqual(false);

    // true
    expect(interpret('bool: toBoolean(x: true).result').get('bool')).toEqual(true);
    expect(interpret('bool: toBoolean(x: "hi").result').get('bool')).toEqual(true);
    expect(interpret('bool: toBoolean(x: 100).result').get('bool')).toEqual(true);
    expect(interpret('bool: toBoolean(x: ()).result').get('bool')).toEqual(true);
});
