// End-to-end test that runs through the files in `./fixtures`,
// creates an atomised version of the CSS and updates the DOM accordingly,
// then checks the computed style of the DOM elements of the original for
// equivalence with those in the atomised version.
//
// The idea being that if these pass, we're not dropping any style information.

import path from 'path';
import { readFileSync } from 'fs';
import { create } from 'phantom';
import postcss from 'postcss';
import replaceClasses from 'replace-classes';
import atomised from '../src';

let instance;
let page;

beforeEach(async () => {
    instance = await create();
    page = await instance.createPage();
    await page.property('viewportSize', { width: 600, height: 1 });
});

afterEach(async () => {
    await page.close();
    await instance.exit();
});

/* eslint-disable prefer-arrow-callback */
const getComputedStyles = () => page.evaluate(function getPhantomComputedStyles() {
    return [].slice.call(document.body.getElementsByTagName('*')).map(function getTagComputedStyles(element) {
        return window.getComputedStyle(element);
    });
});
/* eslint-enable prefer-arrow-callback */

function test(fileName) {
    return async () => {
        const src = readFileSync(path.resolve(__dirname, 'end-to-end', `${fileName}.html`), 'utf8');

        // console.log(await page.property('content'));

        await page.property('content', src);
        const orginalComputedStyles = await getComputedStyles();

        // console.log(await page.property('content'));

        let atomicMap;
        const atomisedCSS = await postcss([atomised({
            mapHandler: json => { atomicMap = Object.assign({}, json); },
            mapPath: null,
        })])
            .process(src.match(/<style>([\s\S]*)<\/style>/)[1]);

        // eslint-disable-next-line global-require
        const stringifiedAtomicMap = Object.keys(atomicMap).reduce((map, className) =>
            Object.assign(map, {
                [className]: `${className} ${atomicMap[className].join(' ')}`,
            })
        , {});

        const atomisedSrc = replaceClasses(src, stringifiedAtomicMap)
            .replace(/(<style>)([\s\S]*)(<\/style>)/, `$1${atomisedCSS.css}$3`);

        await page.property('content', atomisedSrc);
        const atomisedComputedStyles = await getComputedStyles();

        // console.log(await page.property('content'));

        // make sure our processing has done something
        expect(src).not.toEqual(atomisedSrc);

        // make sure we've got something like what we'd expect back from phantom (not a given!)
        expect(Object.keys(orginalComputedStyles[0])).toContain('fontSize');
        expect(Object.keys(atomisedComputedStyles[0])).toContain('fontSize');

        // test what we got back
        expect(orginalComputedStyles).toEqual(atomisedComputedStyles);
    };
}

it('renders chained selectors properly', test('chained-selectors'));
it('renders overridden declarations properly', test('overrides'));
it('renders @keyframes properly', test('keyframes'));
it('renders common declarations properly', test('repetition'));
it('renders @supports properly', test('supports'));
it('renders pseudos properly', test('pseudo'));
it('renders unatomisable rules properly', test('unatomisable'));
it('renders expanded shorthand declarations properly', test('longhand'));
it('renders @font-face declarations properly', test('font-face'));
it('renders complex css properly', test('complex'));
it('renders media queries properly', test('mq'));
