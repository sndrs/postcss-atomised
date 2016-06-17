import postcss from 'postcss';
import parseSides from 'parse-css-sides';
import parseFont from 'parse-css-font';
import shorthandExpand from 'css-shorthand-expand';

// expand shorthand rules
export default postcss.plugin('expand-shorthand', (opts = {}) => css => {
    const props = [
        "background",
        "font",
        "padding",
        "margin",
        "border",
        "border-width",
        "border-style",
        "border-color",
        "border-top",
        "border-right",
        "border-bottom",
        "border-left",
        "outline"
    ];
    css.walkDecls(decl => {
        if (props.indexOf(decl.prop) !== -1) {
            const decls = shorthandExpand(decl.prop, decl.value);
            decl.replaceWith(Object.keys(decls).map(prop => {
                return postcss.decl({prop, value: decls[prop]});
            }));
        };
    });
});
