/* eslint-disable */

import path from 'path';
import postcss from 'postcss';
import del from 'del';
import atomised from '../../src';

const defaultLocation = path.resolve(process.cwd(), 'atomised-map.json');
const testLocation = path.resolve(__dirname, '..', 'test.json');
var handler = jest.fn();

afterEach(async done => {
    await del(defaultLocation);
    await del(testLocation);
    done();
})

it('does not save a map if mapPath is null', async done => {
    await postcss([atomised({mapPath: null})]).process('.red { color: red }');
    expect(() => {
        require(defaultLocation);
    }).toThrow();
    done();
});

it('saves the map to the specified location if it is specified', async done => {
    await postcss([atomised({ mapPath: testLocation })]).process('.red { color: red }');
    expect(() => {
        require(testLocation);
    }).not.toThrow();
    expect(() => {
        require(defaultLocation);
    }).toThrow();
    done();
});

it('call the handler function if it is specified', async done => {
    await postcss([atomised({ mapHandler: handler })]).process('.red { color: red }');
    expect(handler).toBeCalledWith({red: ['a']});
    done();
});

it('saves the map to the default location if none is specified', async done => {
    await postcss([atomised()]).process('.red { color: red }');
    expect(() => {
        require(defaultLocation);
    }).not.toThrow();
    done();
});
