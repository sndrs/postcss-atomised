import test from 'ava';

import {readFileSync} from 'fs';
import postcss from "postcss";
import perfectionist from "perfectionist";
import atomised from './postcss-atomised/src';

const fixturePath = check => `./test/fixtures/${check}`;

const srcCSS = check => postcss([atomised(), perfectionist({format: 'compact'})])
    .process(readFileSync(`${fixturePath(check)}/src.css`, 'utf8'));
const expectedCSS = check => postcss([perfectionist({format: 'compact'})])
    .process(readFileSync(`${fixturePath(check)}/expected.css`, 'utf8'));
const expectedMap = check => require(`${fixturePath(check)}/expected.json`);




[
    'chained',
    'dedupe',
    'mq',
    'supports',
    'pseudo',
    'complex' // mix of everything
].forEach(check => {
        test(check, t => srcCSS(check).then(result => {
            console.log(result.atomicCSS.result.root);
            t.deepEqual(result.atomicCSS.result.root, expectedCSS(check).result.root);
            // t.deepEqual(result.atomicMap, expectedMap(check));
        }));
});

// test(t => t.throws(atomise('keyframes')));
// test(t => t.throws(atomise('font-face')));
test(t => t.pass());
