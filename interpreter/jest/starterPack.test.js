import fs from 'fs';
import path from 'path';
import { Interpreter, Scope } from '../interpreter.js';

const starterPackSrc = fs.readFileSync(path.resolve(__dirname, '../starter-pack.owo'), 'utf8');
let starterPack = new Interpreter(starterPackSrc).interpretTest();

const interpret = src => new Interpreter(src).interpretTest(new Scope(starterPack.properties)); // use the starter pack as the outer scope

// simple test to make sure nothing crashes
test('test starter pack usage', () => {
    expect(interpret('x: toBoolean()').get('x')).not.toEqual(undefined);
});

test('test coerce to boolean', () => {
    // false
    expect(interpret('bool: toBoolean(x: false)->').get('bool')).toEqual(false);
    expect(interpret('bool: toBoolean(x: "")->').get('bool')).toEqual(false);
    expect(interpret('bool: toBoolean(x: 0)->').get('bool')).toEqual(false);
    expect(interpret('bool: toBoolean(x: undefined)->').get('bool')).toEqual(false);

    // true
    expect(interpret('bool: toBoolean(x: true)->').get('bool')).toEqual(true);
    expect(interpret('bool: toBoolean(x: "hi")->').get('bool')).toEqual(true);
    expect(interpret('bool: toBoolean(x: 100)->').get('bool')).toEqual(true);
    expect(interpret('bool: toBoolean(x: ())->').get('bool')).toEqual(true);
});
