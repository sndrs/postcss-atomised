import postcss from 'postcss';
import parseSides from 'parse-css-sides';
import parseFont from 'parse-css-font';

// expand shorthand rules
export default postcss.plugin('expand-shorthand', (opts = {}) => css => {
    css.walkDecls(decl => {
        ['margin', 'padding'].forEach(prop => {
            if (decl.prop === prop) {
                const sides = parseSides(decl.value);
                decl.replaceWith(Object.keys(sides).map(key => {
                    return postcss.decl({prop: `${prop}-${key}`, value: sides[key]});
                }));
            }
        })
        if (decl.prop === 'font') {
            const fontProps = parseFont(decl.value);
            decl.replaceWith(Object.keys(fontProps).map(key => {
                if (key === 'lineHeight') {
                    return postcss.decl({prop: 'line-height', value: fontProps[key]});
                }
                return postcss.decl({prop: `font-${key}`, value: fontProps[key].toString()});
            }))
        }
    });
});
