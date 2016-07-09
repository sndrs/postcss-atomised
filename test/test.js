import test from 'ava';

import {readFileSync, readdirSync} from 'fs';
import junk from 'junk';
import path from 'path';
import postcss from "postcss";
import atomised from '../src';
import perfectionist from "perfectionist";
import reporter from 'postcss-reporter';

const fixturePath = check => `./fixtures/${check}`;

const srcCSS = check => postcss([
    atomised(),
    reporter(),
    perfectionist({format: 'compact'})
]).process(readFileSync(`${fixturePath(check)}/src.css`, 'utf8'), {from: `${fixturePath(check)}/src.css`});

const expectedCSS = check => postcss([
    perfectionist({format: 'compact'})
]).process(readFileSync(`${fixturePath(check)}/expected.css`, 'utf8'));

const expectedMap = check => require(`${fixturePath(check)}/expected.json`);

readdirSync('fixtures').filter(junk.not)
    // .filter(check => check === 'chained')
    .forEach(check => {
        test(check, t => srcCSS(check).then((result) => {
            t.is(result.css, expectedCSS(check).css);
            t.deepEqual(result.atomisedClassMap, expectedMap(check));
        }));
    });
