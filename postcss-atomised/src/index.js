import postcss from 'postcss';
import mqpacker from "css-mqpacker";
import perfectionist from "perfectionist";
import hash from 'shorthash';
import _ from 'lodash';

// I have no idea how this actually works, but it does
// I got it off SO #toptier
// http://stackoverflow.com/a/32007970
const numberToLetter = i => (i >= 26 ? numberToLetter((i / 26 >> 0) - 1) : '') + 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRTUVWXYZ'[i % 26 >> 0];

module.exports = postcss.plugin('atomised', (opts = {}) => {
    return (css, result) => {
        const classMapByAtrule = {};
        // side effects: updates `classMapByAtrule`
        const parseCSS = (container, atRule = 'none') => {
            container.each(node => {
                if (node.type === 'atrule') {
                    parseCSS(node, `@${node.name} ${node.params}`);
                }
                if (node.type === 'rule') {
                    classMapByAtrule[atRule] = (classMapByAtrule[atRule] || {});
                    const decls = [];
                    node.walkDecls(decl => {
                        const hashed = hash.unique(decl.toString() + atRule);
                        decls.push({decl, hash: hashed});
                    })
                    node.selector.split(',')
                        .map(selector => selector.trim().replace(/^\./g, ''))
                        .forEach(selector => {
                            const [className, pseudo] = selector.split(':');
                            classMapByAtrule[atRule][className] = _.unionWith(
                                decls.map(decl => Object.assign({pseudo}, decl)),
                                (classMapByAtrule[atRule][className] || []),
                                (a, b) => a.decl.prop === b.decl.prop && a.pseudo === b.pseudo
                            ).sort().reverse(); // easier for testing
                        });
                }
            });
        };

        parseCSS(css);

        let atomicCSS = '';
        const atomicMap = {};
        // side effects: updates `atomicCSS` and `atomicMap`
        Object.keys(classMapByAtrule).reduce((shortClassNames, atRule) => {
            const classes = classMapByAtrule[atRule];
            const wrapAtRule = css => atRule === 'none' ? css : `${atRule} {${css}}`;
            const pseudoisedClassName = (className, pseudo = false) => pseudo ? `${className}:${pseudo}` : className;
            Object.keys(classes).forEach(className => {
                classes[className].forEach(declaration => {
                    if (!shortClassNames.hasOwnProperty(declaration.hash)) {
                        const shortClassName = numberToLetter(Object.keys(shortClassNames).length);
                        shortClassNames[declaration.hash] = shortClassName;
                        atomicCSS += wrapAtRule(`.${pseudoisedClassName(shortClassName, declaration.pseudo)} {${declaration.decl.toString()}}`);
                    }
                    atomicMap[className] = (atomicMap[className] || []).concat(shortClassNames[declaration.hash]);
                })
            });
            return shortClassNames;
        }, {});

        result['atomicCSS'] = postcss([mqpacker({sort: true})]).process(atomicCSS);
        result['atomicMap'] = atomicMap;
    }
});
