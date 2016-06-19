import postcss from 'postcss';
import resolveProp from 'postcss-resolve-prop';
import uniqBy from 'lodash.uniqby';

// get rid over over-ridden props in a rule
export default css => {
    css.walkRules(rule => {
        const resolvedDecls = [];
        rule.walkDecls(decl => {
            const {prop, value} = decl;
            resolvedDecls.push(postcss.decl({prop, value: resolveProp(rule, prop)}));
        });
        rule.removeAll();
        rule.append(uniqBy(resolvedDecls, 'prop'));
    });
};
