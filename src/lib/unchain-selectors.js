import postcss from 'postcss';

// get single instances of each selector if its a list (.a, .b etc)
export default postcss.plugin('postcss-unchain-selectors', (opts = {}) => css => {
    css.walkRules(rule => {
        rule.replaceWith(rule.selectors.map(selector => rule.clone({selector})));
    });
});
