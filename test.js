import test from 'ava';

import {readFileSync} from 'fs';
import postcss from "postcss";
import atomised from './postcss-atomised/src';
import perfectionist from "perfectionist";

const fixturePath = check => `./test/fixtures/${check}`;

const srcCSS = check => postcss([
        atomised(),
        perfectionist({format: 'compact'})
    ])
    .process(readFileSync(`${fixturePath(check)}/src.css`, 'utf8'));

// const expectedCSS = check => postcss([stylefmt])
//     .process(readFileSync(`${fixturePath(check)}/expected.css`, 'utf8'));

// const expectedMap = check => require(`${fixturePath(check)}/expected.json`);




[
    "longhand",
    'chained',
    'dedupe',
    'mq',
    'supports',
    'pseudo',
    'complex' // mix of everything
].forEach(check => {
        srcCSS(check).then(result => {
            console.log(result.css);
        })
        // test(check, t => srcCSS(check).then((result) => {
        //     // console.log(result.css);
        //     // t.is(result.css, expectedCSS(check).css);

        //     // console.log(JSON.stringify(result.atomicMap, null, 2));
        //     // t.deepEqual(result.atomicMap, expectedMap(check));
        // }));
});

// test(t => t.throws(atomise('keyframes')));
// test(t => t.throws(atomise('font-face')));
test(t => t.pass());
