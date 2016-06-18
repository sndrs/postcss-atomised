import path from 'path';
import { writeFile } from 'fs';
import mkdirp from 'mkdirp';

import postcss from 'postcss';
import parseSelector from 'postcss-selector-parser';

import mergeRules from './lib/merge-rules';
import unchainSelectors from './lib/unchain-selectors';
import dedupeDeclarations from './lib/dedupe-declarations';
import expandShorthand from './lib/expand-shorthand';
import numberToLetter from './lib/number-to-letter';

import mqpacker from "css-mqpacker";

import hash from 'shorthash';

// this does the bulk of the plugin's work, and is used below as part of
// the general postcss().process() whose result is returned
const atomise = postcss.plugin('atomise', (json) => (css, result) => {

    // we'll create a new root of atomic classes to return in the result
    const newRoot = [];

    // place to store the map of original classnames to the atomic ones
    const atomicMap = {};

    // firstly, pass any keyframes or font-face at-rules straight through
    // to the atomic stylesheet
    css.walkAtRules(atRule => {
        if (['keyframes', 'font-face'].some(name => name === atRule.name)) {
            newRoot.push(atRule.clone());
            atRule.remove();
        };
    })

    // next, pass any rules which don't use single classnames as selectors
    // straight through to the atomic stylesheet (they're not really atomic,
    // but maybe the design requires complex selectors – we shouldn't break it)
    css.walkRules(rule => {
        parseSelector(selectors => {
            selectors.each(selector => {
                const [first, ...rest] = selector.nodes;
                if (first.type !== "class" || rest.some(selector => selector.type !== 'pseudo')) {
                    newRoot.push(rule.clone());
                    rule.remove();
                }
            })
        }).process(rule.selector);
    })

    // now we have something we can atomise.
    // we'll go through each declaration, and if we've not seen
    // it in this context before (in this at-rule, with this pseudo etc),
    // we creat a new atomic class that captures it and store that
    // against a hash of the declaration + the context, for
    // future reference

    // get the context of this declaration
    const getContext = node => {
        const parents = [];
        while (node.parent) {
            parents.push(node.parent);
            node = node.parent;
        }
        return parents;
    }

    // create a new postcss object to describe an atomic representation
    // of a declaration
    const createAtomicRule = (decl, selector, atrules) => atrules.reduce((rule, atrule) => {
        const {name, params} = atrule;
        return postcss.atRule({name, params}).append(rule);
    }, postcss.rule({selector}).append(decl));

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
        if (!atomicRules.hasOwnProperty(key)) {
            // create an atomic rule for it
            const shortClassName = numberToLetter(Object.keys(atomicRules).length);
            newRoot.push(createAtomicRule(decl, `.${shortClassName}${contextPseudos.map(p => `:${p}`).join('')}`, contextAtrules));

            // then store the atomic selector against its hash
            atomicRules[key] = shortClassName;
        }

        // create a mapping from the selector to which this declaration
        // belongs to the atomic rule which captures it
        const mapClassName = className.replace(/^\./g, '');
        if (!atomicMap.hasOwnProperty(mapClassName)) {
            atomicMap[mapClassName] = [];
        };
        atomicMap[mapClassName].push(atomicRules[key]);
    });

    // clear out the old css and return the atomic rules
    result.root.removeAll();
    result.root.append(newRoot);

    return new Promise((resolve, reject) => {
        mkdirp(path.dirname(json), err => {
            if (err) reject(err);
            writeFile(json, JSON.stringify(atomicMap, null, 2), resolve);
        });
    })
});

module.exports = postcss.plugin('postcss-atomised', ({json = path.resolve(process.cwd(), 'atomic-map.json')} = {}) => (css, result) => postcss([
    unchainSelectors(),
    mergeRules(),
    expandShorthand(),
    dedupeDeclarations(),
    atomise(json),
    mqpacker({sort: true})
]).process(result.root));
