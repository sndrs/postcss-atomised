import test from 'ava';

import {readFileSync, readdirSync} from 'fs';
import globby from 'globby';
import path from 'path';
import postcss from "postcss";
import atomised from '../src';
import perfectionist from "perfectionist";
import reporter from 'postcss-reporter';

const srcCSS = fixture => postcss([
    atomised({jsonPath: path.resolve('./output/', `${fixture}.json`)}),
    reporter(),
    perfectionist({format: 'compact'})
]).process(readFileSync(`${fixture}/src.css`, 'utf8'), {from: `${fixture}/src.css`});

const getExpectedCSS = fixture => postcss([
    perfectionist({format: 'compact'})
]).process(readFileSync(`${fixture}/expected.css`, 'utf8'));

globby(['./fixtures/*'])
    .then(paths => {
        console.log(paths);
        paths
        // .filter(path => /invalid-selectors/.test(path))
        .forEach(fixture => {
            test(fixture, t => srcCSS(fixture).then(result => {
                const resultJSON = require(`./output/${fixture}.json`);
                const expectedJSON = require(`${fixture}/expected.json`);
                const expectedCSS = getExpectedCSS(fixture).css;

                t.is(result.css, expectedCSS);
                t.deepEqual(resultJSON, expectedJSON);

                // console.log(result.css)
            }));
        });
    })
    .catch(console.log);
