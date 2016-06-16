import path from 'path';
import { writeFile } from 'fs';
import mkdirp from 'mkdirp';

import postcss from 'postcss';

import selectorParser from 'postcss-selector-parser';
import resolveProp from 'postcss-resolve-prop';
import parseSides from 'parse-css-sides';
import parseFont from 'parse-css-font';
import mqpacker from "css-mqpacker";

import hash from 'shorthash';
import _ from 'lodash';

// I have no idea how this actually works, but it does
// I got it off SO #toptier
// http://stackoverflow.com/a/32007970
const numberToLetter = i => (i >= 26 ? numberToLetter((i / 26 >> 0) - 1) : '') + 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRTUVWXYZ'[i % 26 >> 0];

// get single instances of each selector if its a list (.a, .b etc)
const unchainSelectors = postcss.plugin('postcss-unchain-selectors', (opts = {}) => css => {
    css.walkRules(rule => {
        rule.replaceWith(rule.selectors.map(selector => rule.clone({selector})));
    });
});

// merge rules with the same selector in the same container (root, at-rule etc)
const mergeRules = postcss.plugin('postcss-merge-rules', (opts = {}) => css => {
    css.walkRules(rule => {
        rule.parent.each(otherRule => {
            if (rule.selector === otherRule.selector && rule !== otherRule) {
                otherRule.walkDecls(decl => decl.moveTo(rule));
                otherRule.remove();
            }
        });
    });
});

// get rid over over-ridden props in a rule
const dedupeDecls = postcss.plugin('postcss-dedupe-declarations', (opts = {}) => css => {
    css.walkRules(rule => {
        const resolvedDecls = [];
        rule.walkDecls(decl => {
            const {prop, value} = decl;
            resolvedDecls.push(postcss.decl({prop, value: resolveProp(rule, prop)}));
        });
        rule.removeAll();
        rule.append(_.uniqBy(resolvedDecls, 'prop'));
    });
});

// expand longhand rules
const longhand = postcss.plugin('postcss-expand-longhand', (opts = {}) => css => {
    css.walkDecls(decl => {
        ['margin', 'padding'].forEach(prop => {
            if (decl.prop === prop) {
                const sides = parseSides(decl.value);
                decl.replaceWith(Object.keys(sides).map(key => {
                    return postcss.decl({prop: `${prop}-${key}`, value: sides[key]});
                }));
            }
        })
        if (decl.prop === 'font') {
            const fontProps = parseFont(decl.value);
            decl.replaceWith(Object.keys(fontProps).map(key => {
                if (key === 'lineHeight') {
                    return postcss.decl({prop: 'line-height', value: fontProps[key]});
                }
                return postcss.decl({prop: `font-${key}`, value: fontProps[key].toString()});
            }))
        }
    });
});

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
                const [className, ...pseudos] = node.selector.split(':');
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
            if (err) {
                throw "couldn't create directory for JSON."
            }
            writeFile(json, JSON.stringify(atomicMap, null, 2), resolve);
        })
    })
});

module.exports = postcss.plugin('postcss-atomised', ({json = path.resolve(process.cwd(), 'atomic-map.json')} = {}) => (css, result) => postcss([
    unchainSelectors(),
    mergeRules(),
    longhand(),
    dedupeDecls(),
    atomise(json),
    mqpacker({sort: true})
]).process(result.root));
