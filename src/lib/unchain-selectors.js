// get single instances of each selector if its a list (.a, .b etc)
export default css => {
    css.walkRules(rule => {
        rule.replaceWith(rule.selectors.map(selector => rule.clone({selector})));
    });
};
