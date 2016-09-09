import parseSelector from 'postcss-selector-parser';
import chalk from 'chalk';

import getContext from './get-context';

export default (css, newRoot, result) => {
    css.walkRules(rule => {
        parseSelector(selectors => {
            selectors.each(selector => {
                const [first, ...rest] = selector.nodes;
                if (first.type !== 'class' || rest.some(selector => selector.type !== 'pseudo')) {
                    const newRuleInContext = getContext(rule).reduce((newRule, context) => {
                        if (context !== rule.root()) {
                            const newParent = context.clone();
                            newParent.removeAll();
                            newParent.append(newRule);
                            return newParent;
                        } else {
                            return newRule;
                        }
                    }, rule.clone());
                    newRoot.push(newRuleInContext);
                    rule.remove();
                    result.warn(`${chalk.magenta(rule.selector)} cannot be atomised`, { node: rule });
                }
                return false;
            });
        }).process(rule.selector);
    });
};
