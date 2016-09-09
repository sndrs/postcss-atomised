/* eslint-disable */

import path from 'path';
import postcss from 'postcss';
import del from 'del';
import atomised from '../src';

const defaultLocation = path.resolve(__dirname, '..', 'atomic-map.json');
const testLocation = path.resolve(__dirname, '..', 'test.json');

it('saves json to the specified location if it is specified', async () => {
    await postcss([atomised({ jsonPath: testLocation })]).process('.red { color: red }');
    expect(() => {
        require(testLocation);
    }).not.toThrow();
    expect(() => {
        require(defaultLocation);
    }).toThrow();
    await del(testLocation);
});

it('saves json to the default location if it is not specified', async () => {
    await postcss([atomised()]).process('.red { color: red }');
    expect(() => {
        require('./ewrw');
    }).toThrow();
    expect(() => {
        require(defaultLocation);
    }).not.toThrow();
    await del(defaultLocation);
});
