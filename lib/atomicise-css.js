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

export default function atomiciseCSS (css) {
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
        // now we have the postcss AST of the cleaned stylesheet.
        // clean it up into something more manageable for our purposes:
        // [{
        //     "selector": [
        //         "nav"
        //     ],
        //     "declarations": [
        //         {
        //             "prop": "width",
        //             "value": "100%",
        //             "hash": "Z3MSls"
        //         },
        //         {
        //             "prop": "height",
        //             "value": "1rem",
        //             "hash": "1KyxG0"
        //         }
        //     ]
        // }]
        return AST.root.nodes.map(rule => {
            const {selector, nodes} = rule;
            const declarations = nodes.map(declaration => {
                const {prop, value} = declaration;
                return {prop, value, hash: hash.unique(`${prop}${value}`)};
            });
            return {selector: selector.replace(/\./g, '').split(','), declarations};
        });
    })
    .then(AST => {
        // console.log(JSON.stringify(AST, null, 4));
        // some selectors could be lists (.a, .b {}).
        // collect individual classes and store their style declarations.
        // if they have duplicate properties, choose the last instance (like the cascade would):
        // {
        //     "nav": [{
        //         "property": "width",
        //         "value": "100%",
        //         "hash": "Z3MSls"
        //         }, {
        //         "property": "height",
        //         "value": "1rem",
        //         "hash": "1Kyihw"
        //     }],
        // }
        return AST.reduce((classMap, rule) => {
            rule.selector.forEach(className => {
                // const pseudo = className.match(/(.+):(.+)/);
                // if (pseudo) {
                //     rule.declarations = rule.declarations.map(declaration => {
                //         declaration.pseudo = pseudo[2];
                //         return declaration;
                //     });
                //     className = pseudo[1];
                // }
                // reordered to make testing easier
                classMap[className] = _.chain(rule.declarations.concat(classMap[className] || []))
                    .uniqBy('prop')
                    .orderBy('prop')
                    .value();
            })
            return classMap;
        }, {});
    })
    .then(classMap => {
        // get unique styles, keyed by their hash, with a short classname, e.g.
        // {
        // "Z3MSls": {
        //     "className": "a",
        //     "property": "width",
        //     "value": "100%"
        // },
        // "1Kyihw": {
        //     "className": "b",
        //     "property": "height",
        //     "value": "1rem"
        // }
        const atomicDeclarations = _.chain(classMap)
            .flatMap(styles => styles)
            .uniqBy('hash')
            .orderBy('prop')
            .reduce((declarations, declaration, i) => {
                const {prop, value} = declaration;
                declarations[declaration.hash] = {
                    className: numberToLetter(i),
                    prop,
                    value
                };
                return declarations;
            }, {})
            .value();

        // create the CSS from `atomicDeclarations`, e.g.
        // .a {width:100%}
        // .b {height:1rem}
        let atomicCSS = _.map(atomicDeclarations, declaration => {
            return `.${declaration.className} {${declaration.prop}:${declaration.value}}`;
        }).join('');
        atomicCSS = postcss([autoprefixer(), mqpacker({sort: true}), perfectionist({format: 'compact'})]).process(atomicCSS).css;

        // create a map of the original classes to the atomic classes
        // {
        //     "nav": ["a", "b"]
        // }
        const atomicMap = _.reduce(classMap, (atomicMap, styles, className) => {
            atomicMap[className] = styles.map(style => atomicDeclarations[style.hash].className);
            return atomicMap;
        }, {});

        console.log(`${chalk.white(`${Object.keys(classMap).length} selectors`)} found in ${chalk.white(prettyBytes(gzipSize.sync(css)))} of CSS (gzipped).`);
        console.log(`${chalk.blue(`${Object.keys(atomicDeclarations).length} atomic classes`)} created in ${chalk.green(prettyBytes(gzipSize.sync(atomicCSS)))} (gzipped).`);

        return {atomicCSS, atomicMap};
    });
}