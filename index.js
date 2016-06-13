import _ from 'lodash';
import hash from 'shorthash';
import postcss from "postcss";
import mqpacker from "css-mqpacker";
import perfectionist from "perfectionist";
import chalk from "chalk";
import prettyBytes from 'pretty-bytes';
import gzipSize from 'gzip-size';

// I have no idea how this actually works, but it does
// I got it off SO #toptier
// http://stackoverflow.com/a/32007970
const numberToLetter = i => (i >= 26 ? numberToLetter((i / 26 >> 0) - 1) : '') + 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRTUVWXYZ'[i % 26 >> 0];

const getDeclarations = (rule, atrule = false) => {
    const {selector, nodes} = rule;
    const selectors = selector.replace(/\./g, '').split(', ');
    return selectors.map(selector => {
        const [className, pseudo] = selector.split(':');
        const declarations = nodes.map(declaration => {
            const {prop, value} = declaration;
            return {prop, value, hash: hash.unique(`${prop}${value}${atrule}${pseudo}`), pseudo};
        });
        return {selector: className, declarations};
    });
}

const CSSfromAST = declarationsForAtrule => _.map(declarationsForAtrule, declaration => {
        if (declaration.atrule) {
            return `${declaration.atrule} {.${declaration.className} {${declaration.prop}:${declaration.value}}}`;
        }
        return `.${declaration.className} {${declaration.prop}:${declaration.value}}`;
    }).join('');

const debug = _ => console.log(JSON.stringify(_, null, 4));

export default function atomiseCSS (css) {
    return postcss([perfectionist({format: 'compact'})]).process(css)
    .then(AST => {
        // console.log('************** AST ****************');
        // debug(AST);
        return AST.root.nodes.reduce((atrules, rule) => {
            let atrule;
            if (rule.type === 'rule') {
                atrule = 'none';
                atrules[atrule] = (atrules[atrule] || []).concat(getDeclarations(rule, atrule));
            }
            if (rule.type === 'atrule') {
                if (_.includes(['media', 'supports'], rule.name)) {
                    atrule = `@${rule.name} ${rule.params}`;
                    rule.nodes.forEach(rule => {
                        atrules[atrule] = (atrules[atrule] || []).concat(getDeclarations(rule, atrule));
                    });
                }
                if (rule.name === 'keyframes') {
                    throw('@keyframes should be put in the global scope');
                }
                if (rule.name === 'font-face') {
                    throw('@font-face should be put in the global scope');
                }
            }
            return atrules;
        }, {});
    })
    .then(rulesByAtrule => {
        // console.log('************** rulesByAtrule ****************');
        // debug(rulesByAtrule)
        Object.keys(rulesByAtrule).forEach(atrule => {
            rulesByAtrule[atrule] = rulesByAtrule[atrule].reduce((classMap, rule) => {
                classMap[rule.selector] = _.uniqWith(rule.declarations.concat(classMap[rule.selector] || []), (a, b) => {
                    return a.prop === b.prop && a.pseudo === b.pseudo;
                }).reverse(); // easier for testing
                return classMap;
            }, {})
        })
        return rulesByAtrule;
    })
    .then(classMapByAtrule => {
        // console.log('************** classMapByAtrule ****************');
        // debug(classMapByAtrule)
        let atRuleIndex = 0;
        const atomicDeclarationsByAtrule = _.reduce(classMapByAtrule, (declarations, declarationsForAtrule, atrule) => {
            let atrulePrefix = '';
            if (atrule !== 'none') {
                atrulePrefix = numberToLetter(atRuleIndex) + '-';
                atRuleIndex++;
            }
            declarations[atrule] = _.chain(declarationsForAtrule)
                .flatMap(styles => styles)
                .uniqBy('hash')
                .orderBy(['prop'])
                .reduce((declarations, declaration, j) => {
                    const {prop, value, atrule, pseudo} = declaration;
                    const pseudoSuffix = pseudo !== undefined ? `:${pseudo}` : '';
                    declarations[declaration.hash] = {
                        className: `${atrulePrefix}${numberToLetter(j)}${pseudoSuffix}`,
                        prop,
                        value,
                        atrule
                    };
                    return declarations;
                }, {})
                .value();
            return declarations;
        }, {});
        // debug(atomicDeclarationsByAtrule);

        const atomicDeclarations = _.reduce(atomicDeclarationsByAtrule, (atomicDeclarations, atrule) => {
            _.assign(atomicDeclarations, atrule);
            return atomicDeclarations;
        }, {});

        // create the CSS from `atomicDeclarations`, e.g.
        // .a {width:100%}
        // .b {height:1rem}
        const atomicCSS = postcss([mqpacker({
                sort: true
            }), perfectionist({
                format: 'compact'
            })])
            .process(_.map(atomicDeclarationsByAtrule, (declarationsForAtrule, atrule) => {
                if (atrule === 'none') {
                    return CSSfromAST(declarationsForAtrule);
                }
                return `${atrule} {${CSSfromAST(declarationsForAtrule)}}`;
            }).join(''))
            .css;

        const atomicMap = _.reduce(classMapByAtrule, (atomicMap, classMap) => {
            _.forEach(classMap, (declaration, className) => {
                atomicMap[className] = (atomicMap[className] || [])
                    .concat(declaration
                        .map(rule => rule.hash)
                        .map(hash => atomicDeclarations[hash].className.split(':')[0])
                        .sort() // easier for testing
                    );
            });
            return atomicMap;
        }, {});

        // console.log('************** CSS ****************');
        // console.log(atomicCSS);

        // console.log('************** JSON ****************');
        // debug(atomicMap);

        console.log(`${chalk.white(`${Object.keys(atomicMap).length} selectors`)} found in ${chalk.white(prettyBytes(gzipSize.sync(css)))} of CSS (gzipped).`);
        console.log(`${chalk.blue(`${Object.keys(atomicDeclarations).length} atomic classes`)} created in ${chalk.green(prettyBytes(gzipSize.sync(atomicCSS)))} (gzipped).`);

        return {atomicCSS, atomicMap};
    });
}
