import _ from 'lodash';
import hash from 'shorthash';
import postcss from "postcss";
import remify from 'postcss-pxtorem';
import nano from "cssnano";
import autoprefixer from "autoprefixer";
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
    const declarations = nodes.map(declaration => {
        const {prop, value} = declaration;
        return {prop, value, hash: hash.unique(`${prop}${value}${atrule}`)};
    });
    return {selector: selector.replace(/\./g, '').split(','), declarations};
}

const CSSfromAST = declarationsForAtrule => _.map(declarationsForAtrule, declaration => {
        if (declaration.atrule) {
            return `${declaration.atrule} {.${declaration.className} {${declaration.prop}:${declaration.value}}}`;
        }
        return `.${declaration.className} {${declaration.prop}:${declaration.value}}`;
    }).join('');

const debug = _ => console.log(JSON.stringify(_, null, 4));

export default function atomiseCSS (css) {
    return postcss([remify({
            replace: true,
            root_value: 16,
            unit_precision: 5,
            prop_white_list: []
        }), nano({
            mergeLonghand: false,
            svgo: false,
            zindex: false
        })]).process(css)
    .then(AST => {
        return AST.root.nodes.reduce((atrules, rule) => {
            let atrule;
            if (rule.type === 'rule') {
                atrule = 'none';
                atrules[atrule] = (atrules[atrule] || []).concat(getDeclarations(rule, atrule));
            }
            if (rule.type === 'atrule') {
                atrule = `@${rule.name} ${rule.params}`;
                rule.nodes.forEach(rule => {
                    atrules[atrule] = (atrules[atrule] || []).concat(getDeclarations(rule, atrule));
                });
            }
            return atrules;
        }, {});
    })
    .then(rulesByAtrule => {
        Object.keys(rulesByAtrule).forEach(atrule => {
            rulesByAtrule[atrule] = rulesByAtrule[atrule].reduce((classMap, rule) => {
                rule.selector.forEach(className => {
                    classMap[className] = _.uniqBy(rule.declarations.concat(classMap[className] || []), 'prop');
                })
                return classMap;
            }, {})
        })
        return rulesByAtrule;
    })
    .then(classMapByAtrule => {
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
                    const {prop, value, atrule} = declaration;
                    declarations[declaration.hash] = {
                        className: `${atrulePrefix}${numberToLetter(j)}`,
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
            Object.assign(atomicDeclarations, atrule);
            return atomicDeclarations;
        }, {});

        // create the CSS from `atomicDeclarations`, e.g.
        // .a {width:100%}
        // .b {height:1rem}
        let atomicCSS = _.map(atomicDeclarationsByAtrule, (declarationsForAtrule, atrule) => {
            if (atrule === 'none') {
                return CSSfromAST(declarationsForAtrule);
            }
            return `${atrule} {${CSSfromAST(declarationsForAtrule)}}`;
        }).join('');


        atomicCSS = postcss([autoprefixer(), mqpacker({sort: true}), perfectionist({format: 'compact'})])
            .process(atomicCSS)
            .css;

        // create a map of the original classes to the atomic classes
        // {
        //     "nav": ["a", "b"]
        // }

        const atomicMap = _.reduce(classMapByAtrule, (atomicMap, classMap) => {
            _.forEach(classMap, (declaration, className) => {
                atomicMap[className] = (atomicMap[className] || [])
                    .concat(declaration
                        .map(rule => rule.hash)
                        .map(hash => atomicDeclarations[hash].className)
                    );
            });
            return atomicMap;
        }, {});

        console.log(`${chalk.white(`${Object.keys(atomicMap).length} selectors`)} found in ${chalk.white(prettyBytes(gzipSize.sync(css)))} of CSS (gzipped).`);
        console.log(`${chalk.blue(`${Object.keys(atomicDeclarations).length} atomic classes`)} created in ${chalk.green(prettyBytes(gzipSize.sync(atomicCSS)))} (gzipped).`);

        return {atomicCSS, atomicMap};
    });
}
