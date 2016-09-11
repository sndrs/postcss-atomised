import path from 'path';
import { writeFile } from 'fs';

import mkdirp from 'mkdirp';
import hash from 'shorthash';
import pify from 'pify';

import postcss from 'postcss';
import mqpacker from 'css-mqpacker';
import stats from 'cssstats';

import mergeRulesBySelector from './lib/merge-rules-by-selector';
import mergeRulesByDeclarations from './lib/merge-rules-by-declarations';
import unchainSelectors from './lib/unchain-selectors';
import passthruUnatomisable from './lib/passthru-unatomisable';
import resolveDeclarations from './lib/resolve-declarations';
import expandShorthand from './lib/expand-shorthand';
import numberToLetter from './lib/number-to-letter';
import reportStats from './lib/report-stats';
import getContext from './lib/get-context';

const writeFileP = pify(writeFile);
const mkdirpP = pify(mkdirp);

const atomise = (css, result, jsonPath) => {
    reportStats(result, stats(css.toString()), 'magenta', 'Found:    ');

    // We'll create a new root of atomic classes to eventually return in the result
    const newRoot = [];

    // We also need a place to store the map of original classnames to the atomic ones
    const atomicMap = {};

    // Prepare the CSS for parsing:

    // 1. get single instances of each selector if its a list
    unchainSelectors(css); // .a, .b {} => .a {}; .b {}

    // 2. merge rules with the same selector if they have the same container (root, at-rule etc)
    mergeRulesBySelector(css); // .a {}; .a {} => .a {}

    // 3. expand shorthand rules
    expandShorthand(css); // margin to margin-top/right/bottom/left etc

    // 4. get rid over over-ridden props in a rule (like the cascade would).
    resolveDeclarations(css); // .a {color: red; color: blue} => .a {color: blue}

    // Now we're ready to start...

    // Pass any keyframes or font-face at-rules straight through
    // to the atomic stylesheet
    css.walkAtRules(atRule => {
        if (['keyframes', 'font-face'].some(name => name === atRule.name)) {
            newRoot.push(atRule.clone());
            atRule.remove();
        }
    });

    // Pass any rules which don't use single classnames as selectors
    // straight through to the atomic stylesheet (they're not really atomic,
    // but maybe the design requires complex selectors – we shouldn't break it)
    passthruUnatomisable(css, newRoot, result);

    // Now we have something we can atomise...

    // We'll go through each declaration, and if we've not seen
    // it in this context before (in this at-rule, with this pseudo etc),
    // we creat a new atomic class that captures it and store that
    // against a hash of the declaration + the context, for
    // future reference

    // Create a new postcss object to describe an atomic representation
    // of a declaration
    function createAtomicRule(decl, selector, atrules) {
        return atrules.reduce((rule, atrule) => {
            const { name, params } = atrule;
            return postcss.atRule({ name, params }).append(rule);
        }, postcss.rule({ selector }).append(decl));
    }

    // create the store for the hash/atomic rule pairs
    const atomicRules = {};

    // check each declaration...
    css.walkDecls(decl => {
        // get the context of a declaration
        const context = getContext(decl);
        const contextAtrules = context.filter(node => node.type === 'atrule');
        const [className, ...contextPseudos] = context.filter(node => node.type === 'rule')[0].selector.split(/::|:/);

        // create a hash from the declaration + context
        const key = hash.unique(createAtomicRule(decl, contextPseudos.join(''), contextAtrules).toString());

        // if we've not seen this declaration in this context before...
        if (!{}.hasOwnProperty.call(atomicRules, key)) {
            // create an atomic rule for it
            const shortClassName = numberToLetter(Object.keys(atomicRules).length);
            const atomicClassName = `.${shortClassName}${contextPseudos.map(p => `:${p}`).join('')}`;
            newRoot.push(createAtomicRule(decl, atomicClassName, contextAtrules));

            // then store the atomic selector against its hash
            atomicRules[key] = shortClassName;
        }

        // create a mapping from the selector to which this declaration
        // belongs to the atomic rule which captures it
        const mapClassName = className.replace(/^\./g, '');
        atomicMap[mapClassName] = (atomicMap[mapClassName] || []).concat(atomicRules[key]);
    });

    // clear out the old css and return the atomic rules
    result.root.removeAll();
    result.root.append(newRoot);

    // merge media queries and sort by min-width
    mqpacker.pack(result, { sort: true }).css; // eslint-disable-line no-unused-expressions

    // combine any rules that have the same contents
    // e.g. unatomiseable/atomisable ones
    mergeRulesByDeclarations(css); // body {color: red}; .a {color: red} => body, .a {color: red}

    reportStats(result, stats(css.toString()), 'blue', 'Returned: ');

    // save the JSON file
    return mkdirpP(path.dirname(jsonPath))
        .then(() =>
            writeFileP(jsonPath, JSON.stringify(atomicMap, null, 2))
        );
};

export default postcss.plugin('postcss-atomised', ({ jsonPath = path.resolve(process.cwd(), 'atomic-map.json') } = {}) =>
    (css, result) => atomise(css, result, jsonPath)
);
