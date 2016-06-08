import test from 'ava';
import atomiseCSS from './index';

import {readFileSync} from 'fs';
import postcss from "postcss";
import perfectionist from "perfectionist";

const fixture = check => `./test/fixtures/${check}`;

const atomise = check => atomiseCSS(readFileSync(`${fixture(check)}/src.css`, 'utf8'));
const expectedCSS = check => postcss([perfectionist({format: 'compact'})])
    .process(readFileSync(`${fixture(check)}/expected.css`, 'utf8'))
    .css;
const expectedMap = check => require(`${fixture(check)}/expected.json`);

['dedupe', 'chained', 'mq'].forEach(check => {
    test(t => atomise(check).then(({atomicCSS, atomicMap}) => {
        t.is(atomicCSS, expectedCSS(check));
        t.deepEqual(atomicMap, expectedMap(check));
    }));
});