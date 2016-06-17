import postcss from 'postcss';
import parseFont from 'parse-css-font';
import shorthandExpand from 'css-shorthand-expand';
import parseValue from 'postcss-value-parser';

// expand shorthand rules
export default postcss.plugin('expand-shorthand', (opts = {}) => css => {
    const autoProps = [
        "background",
        "font",
        "padding",
        "margin",
        "outline"
    ];
    const borderProps = ['border-width', 'border-style', 'border-color'];
    css.walkDecls(decl => {
        if (autoProps.indexOf(decl.prop) !== -1) {
            const decls = shorthandExpand(decl.prop, decl.value);
            decl.replaceWith(Object.keys(decls).map(prop => {
                return postcss.decl({prop, value: decls[prop]});
            }));
        };
        if (decl.prop === 'border') {
            const values = parseValue(decl.value).nodes;
            decl.replaceWith(values.filter(value => value.type === 'word').map((value, i) => {
                return postcss.decl({prop: borderProps[i], value: value.value});
            }));
        };
    });
});
