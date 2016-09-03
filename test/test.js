import test from 'ava';

import {readFileSync, readdirSync} from 'fs';
import globby from 'globby';
import path from 'path';
import postcss from "postcss";
import atomised from '../src';
import perfectionist from "perfectionist";
import reporter from 'postcss-reporter';

const srcCSS = check => postcss([
    atomised({jsonPath: path.resolve('./output/', `${check}.json`)}),
    reporter(),
    perfectionist({format: 'compact'})
]).process(readFileSync(`${check}/src.css`, 'utf8'), {from: `${check}/src.css`});

const expectedCSS = check => postcss([
    perfectionist({format: 'compact'})
]).process(readFileSync(`${check}/expected.css`, 'utf8'));

globby(['./fixtures/*']).then(paths => {
    // .filter(check => check === 'invalid-selectors')
    paths.forEach(check => {
        test(check, t => srcCSS(check).then((result) => {
            t.is(result.css, expectedCSS(check).css);

            const resultJson = require(`./output/${check}.json`);
            const expectedJson = require(`${check}/expected.json`);
            t.deepEqual(resultJson, expectedJson);

            // console.log(result.css)
        }));
    });
});
