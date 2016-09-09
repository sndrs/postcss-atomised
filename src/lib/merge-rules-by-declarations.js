import isEqual from 'lodash.isequal';

const getDecls = node => node.filter(testNode => testNode.type === 'decl').map(decl => {
    const { prop, value } = decl;
    return { prop, value };
});

// merge rules with the same declarations in the same container (root, at-rule etc)
export default css => {
    const blacklist = ['keyframes', 'font-face'];
    css.walkRules(rule => {
        if (blacklist.some(name => name === rule.parent.name)) {
            return;
        }
        const ruleDecls = getDecls(rule.nodes);
        rule.parent.each(testRule => {
            if (rule !== testRule && isEqual(ruleDecls, getDecls(testRule.nodes))) {
                rule.selector += `, ${testRule.selector}`; // eslint-disable-line no-param-reassign
                testRule.remove();
            }
        });
    });
};
