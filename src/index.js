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
import stylelint from 'stylelint';
import reporter from 'postcss-reporter';

import hash from 'shorthash';

// get hashes for each declaration
const atomise = postcss.plugin('atomise', (json) => (css, result) => {
    const hashes = {}; // used to prevent duplicates

    const getParents = node => {
        const parents = [node];
        while (node.parent) {
            parents.push(node.parent);
            node = node.parent;
        }
        return parents;
    }

    const newRoot = [];
    const atomicMap = {};

    css.walkAtRules(atRule => {
        if (['keyframes', 'font-face'].some(name => name === atRule.name)) {
            newRoot.push(atRule.clone());
            atRule.remove();
        };
    })

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

    css.walkDecls(decl => {
        let cssStr = '';
        const declAtrules = [];
        let declPseudos = [];
        let parentClassname;

        getParents(decl).forEach(node => {
            if (node.type === 'decl') {
                cssStr += decl.toString();
            }
            if (node.type === 'rule') {
                const [className, ...pseudos] = node.selector.split(/::|:/);
                cssStr += pseudos.join('');
                declPseudos = pseudos;
                parentClassname = className.replace(/^\./g, '');
            }
            if (node.type === 'atrule') {
                const {name, params} = node;
                cssStr += `${name}${params}`;
                declAtrules.push(node);
            }
        });

        const hashed = hash.unique(cssStr);
        if (!hashes.hasOwnProperty(hashed)) {
            const pseudo = declPseudos.length ? `:${declPseudos.join(':')}` : '';
            const shortClassName = numberToLetter(Object.keys(hashes).length);

            newRoot.push(declAtrules.reduce((rule, atrule) => {
                return postcss.atRule({name: atrule.name, params: atrule.params}).append(rule);
            }, postcss.rule({selector: `.${shortClassName}${pseudo}`}).append(decl)));

            hashes[hashed] = shortClassName;
        }

        atomicMap[parentClassname] = (atomicMap[parentClassname] || []);
        atomicMap[parentClassname].push(hashes[hashed]);
    });

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
