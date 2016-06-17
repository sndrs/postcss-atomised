import postcss from 'postcss';
import parseFont from 'parse-css-font';
import shorthandExpand from 'css-shorthand-expand';
import parseValue from 'postcss-value-parser';

// expand shorthand rules
export default postcss.plugin('expand-shorthand', (opts = {}) => css => {
    const generalProps = ["background", "font", "padding", "margin", "outline"];

    const borderProps = ["border", "border-top", "border-right", "border-bottom", "border-left"];
    const borderVariants = ['width', 'style', 'color'];
    css.walkDecls(decl => {
        if (generalProps.indexOf(decl.prop) !== -1) {
            const decls = shorthandExpand(decl.prop, decl.value);
            decl.replaceWith(Object.keys(decls).map(prop => {
                return postcss.decl({prop, value: decls[prop]});
            }));
        };
        if (borderProps.indexOf(decl.prop) !== -1) {
            const values = parseValue(decl.value).nodes;
            decl.replaceWith(values.filter(value => value.type === 'word').map((value, i) => {
                return postcss.decl({prop: `${decl.prop}-${borderVariants[i]}`, value: value.value});
            }));
        };
    });
});
