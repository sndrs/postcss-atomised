// merge rules with the same selector in the same container (root, at-rule etc)
export default css => {
    css.walkRules(rule => {
        rule.parent.each(testRule => {
            if (rule.selector === testRule.selector && rule !== testRule) {
                testRule.walkDecls(decl => decl.moveTo(rule));
                testRule.remove();
            }
        });
    });
};
