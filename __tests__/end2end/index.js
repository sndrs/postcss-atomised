// End-to-end test that runs through the files in `./fixtures`,
// creates an atomised version of the CSS and updates the DOM accordingly,
// then checks the computed style of the DOM elements of the original for
// equivalence with those in the atomised version.
//
// The idea being that if these pass, we're not dropping any style information.

'use strict';

import path from 'path';
import {readFileSync} from 'fs';
import {create} from 'phantom';
import postcss from "postcss";
import perfectionist from 'perfectionist';
import reduce from 'lodash.reduce';
import del from 'del';
import hasha from 'hasha';
import replaceClasses from 'replace-classes';
import atomised from '../../src';

it('renders chained selectors properly', test('chained-selectors'));
it('renders overridden declarations properly', test('overrides'));
it('renders @keyframes properly', test('keyframes'));
it('renders common declarations properly', test('repetition'));
it('renders @supports properly', test('supports'));
it('renders pseudos properly', test('pseudo'));
it('renders unatomisable rules properly', test('unatomisable'));
it('renders expanded shorthand declarations properly', test('longhand'));
it('renders @font-face declarations properly', test('font-face'));

let instance, page;

beforeEach(async () => {
    instance = await create();
    page = await instance.createPage();
    await page.property('viewportSize', { width: 600, height: 1 });
})

afterEach(async () => {
    await page.close();
    await instance.exit();
})

const getComputedStyles = () => page.evaluate(function () {
    return [].slice.call(document.body.getElementsByTagName("*")).map(function (element) {
        return window.getComputedStyle(element);
    });
});

function test(fileName) {
    return async () => {
        const src = readFileSync(path.resolve(__dirname, 'fixtures', `${fileName}.html`), 'utf8');
        const mapDest = path.resolve(__dirname, `.${hasha(src, {algorithm: 'md5'})}.json`);

        // console.log(await page.property('content'));

        await page.property('content', src);
        const orginalComputedStyles = await getComputedStyles();

        // console.log(await page.property('content'));

        const atomisedCSS = await postcss([atomised({jsonPath: mapDest})]).process(src.match(/<style>([\s\S]*)<\/style>/)[1]);
        const atomicMap = reduce(require(mapDest), (atomicMap, atomicClasses, className) => {
            atomicMap[className] = `${className} ${atomicClasses.join(' ')}`;
            return atomicMap;
        }, {});

        const atomisedSrc = replaceClasses(src, atomicMap).replace(/(<style>)([\s\S]*)(<\/style>)/, `$1${atomisedCSS.css}$3`);

        await page.property('content', atomisedSrc);
        const atomisedComputedStyles = await getComputedStyles();

        // console.log(await page.property('content'));

        await del(mapDest);

        // make sure our processing has done something
        expect(src).not.toEqual(atomisedSrc);

        // make sure we've got something like what we'd expect back from phantom (not a given!)
        expect(Object.keys(orginalComputedStyles[0])).toContain('fontSize');
        expect(Object.keys(atomisedComputedStyles[0])).toContain('fontSize');

        // test what we got back
        expect(orginalComputedStyles).toEqual(atomisedComputedStyles);
    }
}
