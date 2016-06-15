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
const expandLongHands = postcss.plugin('postcss-expand-longhand', (opts = {}) => css => {
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
const atomise = postcss.plugin('atomise', (opts = {}) => (css, result) => {
    const hashes = []; // used to prevent duplicates

    const getParents = node => {
        const parents = [node];
        while (node.parent) {
            parents.push(node.parent);
            node = node.parent;
        }
        return parents;
    }

    const newRoot = [];
    result['atomicMap'] = {};

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
        if (!hashes.some(hash => hash === hashed)) {

            const pseudo = declPseudos.length ? `:${declPseudos.join(':')}` : '';
            const shortClassName = numberToLetter(hashes.length);

            result.atomicMap[parentClassname] = (result.atomicMap[parentClassname] || []);
            result.atomicMap[parentClassname].push(shortClassName);

            newRoot.push(declAtrules.reduce((rule, atrule) => {
                return postcss.atRule({name: atrule.name, params: atrule.params}).append(rule);
            }, postcss.rule({selector: `.${shortClassName}${pseudo}`}).append(decl)));

            hashes.push(hashed);
        }
    });
    result.root.removeAll();
    result.root.append(newRoot);
});


module.exports = postcss.plugin('postcss-atomised', (opts = {}) => (css, result) => postcss([
    unchainSelectors(),
    mergeRules(),
    expandLongHands(),
    dedupeDecls(),
    atomise(),
    mqpacker({sort: true})
]).process(result.root));



    // const atomicMapByAtrule = {};
    // // side effects: updates `atomicMapByAtrule`
    // const parseCSS = (container, atRule = 'media|all') => {
    //     container.each(node => {
    //         if (node.type === 'atrule') {
    //             parseCSS(node, `${node.name}|${node.params}`);
    //         }
    //         if (node.type === 'rule') {
    //             atomicMapByAtrule[atRule] = (atomicMapByAtrule[atRule] || {});
    //             selectorParser(selectors => {
    //                 selectors.each(selector => {
    //                     // console.log(selector);
    //                 })
    //             }).process(node.selector);
    //             node.selector.split(',')
    //                 .map(selector => selector.trim().replace(/^\./g, ''))
    //                 .forEach(selector => {
    //                     const [className, pseudo] = selector.split(':');
    //                     const decls = [];
    //                     node.walkDecls(decl => {
    //                         const hashed = hash.unique(decl.toString() + atRule + pseudo);
    //                         decls.push({decl, hash: hashed});
    //                     })
    //                     atomicMapByAtrule[atRule][className] = _.union(
    //                         decls.map(decl => Object.assign({pseudo}, decl)),
    //                         (atomicMapByAtrule[atRule][className] || [])
    //                     ).sort().reverse(); // easier for testing
    //                 });
    //         }
    //     });
    // };

    // parseCSS(css);

    // // console.log(JSON.stringify(atomicMapByAtrule, null, 2));

    // result.root.removeAll();
    // result.atomicMap = {};
    // Object.keys(atomicMapByAtrule).reduce((shortClassNames, atRule) => {
    //     // container object to store short classnames in as we loop.
    //     // makes sure we only create one instance for each hash
    //     const classesForAtRule = atomicMapByAtrule[atRule];
    //     const wrapAtRule = (() => {
    //         const [name, params] = atRule.split("|");
    //         return node => params === 'all' ? node : postcss.atRule({name, params}).append(node);
    //     })();
    //     const pseudo = (pseudo = false) => pseudo ? `:${pseudo}` : '';
    //     Object.keys(classesForAtRule).forEach(className => {
    //         classesForAtRule[className].forEach(declaration => {
    //             if (!shortClassNames.hasOwnProperty(declaration.hash)) {
    //                 const shortClassName = numberToLetter(Object.keys(shortClassNames).length);
    //                 shortClassNames[declaration.hash] = shortClassName;

    //                 const rule = postcss.rule({ selector: `.${shortClassName}${pseudo(declaration.pseudo)}` });
    //                 rule.append(declaration.decl);
    //                 result.root.append(wrapAtRule(rule));
    //             }
    //             result.atomicMap[className] = (result.atomicMap[className] || []).concat(shortClassNames[declaration.hash]);
    //         })
    //     });
    //     return shortClassNames;
    // }, {});
    // return postcss([mqpacker({sort: true})]).process(result.root);

