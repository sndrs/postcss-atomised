import test from 'ava';
import atomiseCSS from './index';

import {readFileSync, readdirSync} from 'fs';
import postcss from "postcss";
import perfectionist from "perfectionist";

const fixturePath = check => `./test/fixtures/${check}`;

const atomise = check => atomiseCSS(readFileSync(`${fixturePath(check)}/src.css`, 'utf8'));
const expectedCSS = check => postcss([perfectionist({format: 'compact'})])
    .process(readFileSync(`${fixturePath(check)}/expected.css`, 'utf8'))
    .css;
const expectedMap = check => require(`${fixturePath(check)}/expected.json`);

readdirSync('test/fixtures').forEach(check => {
    test(check, t => atomise(check).then(({atomicCSS, atomicMap}) => {
        t.is(atomicCSS, expectedCSS(check));
        t.deepEqual(atomicMap, expectedMap(check));
    }));
});
