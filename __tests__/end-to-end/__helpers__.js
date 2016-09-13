import path from 'path';
import { readFileSync } from 'fs';
import { create } from 'phantom';
import postcss from 'postcss';
import replaceClasses from 'replace-classes';

import atomised from '../../src';

/* eslint-disable prefer-arrow-callback */
const getComputedStyles = (page) => page.evaluate(function getPhantomComputedStyles() {
    return [].slice.call(document.body.getElementsByTagName('*')).map(function getTagComputedStyles(element) {
        return window.getComputedStyle(element);
    });
});
/* eslint-enable prefer-arrow-callback */

export default filePath => async (done) => {
    const src = readFileSync(path.resolve(__dirname, filePath), 'utf8');
    const instance = await create();
    const page = await instance.createPage();

    await page.property('viewportSize', { width: 600, height: 1 });

        // console.log(await page.property('content'));

    await page.property('content', src);
    const orginalComputedStyles = await getComputedStyles(page);

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
    const atomisedComputedStyles = await getComputedStyles(page);

        // console.log(await page.property('content'));

        // make sure our processing has done something
    expect(src).not.toEqual(atomisedSrc);

        // make sure we've got something like what we'd expect back from phantom (not a given!)
    expect(Object.keys(orginalComputedStyles[0])).toContain('fontSize');
    expect(Object.keys(atomisedComputedStyles[0])).toContain('fontSize');

        // test what we got back
    expect(orginalComputedStyles).toEqual(atomisedComputedStyles);

    await page.close();
    await instance.exit();
    done();
};
