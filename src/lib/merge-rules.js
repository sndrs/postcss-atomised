import postcss from 'postcss';

// merge rules with the same selector in the same container (root, at-rule etc)
export default css => {
    css.walkRules(rule => {
        rule.parent.each(otherRule => {
            if (rule.selector === otherRule.selector && rule !== otherRule) {
                otherRule.walkDecls(decl => decl.moveTo(rule));
                otherRule.remove();
            }
        });
    });
};
