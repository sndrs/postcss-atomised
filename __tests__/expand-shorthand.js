import postcss from 'postcss';
import perfectionist from 'perfectionist';

import expandShorthand from '../src/lib/expand-shorthand';

function parse(css) {
    const src = postcss().process(css).root;
    expandShorthand(src);
    return perfectionist.process(src).css;
}

it('expands `margin`', () => {
    expect(parse(`
        margin: 10px
    `)).toBe(parse(`
        margin-top: 10px;
        margin-right: 10px;
        margin-bottom: 10px;
        margin-left: 10px
    `));
});

it('expands `padding`', () => {
    expect(parse(`
        padding: 10px
    `)).toBe(parse(`
        padding-top: 10px;
        padding-right: 10px;
        padding-bottom: 10px;
        padding-left: 10px
    `));
});

it('does nothing with `padding-top`', () => {
    expect(parse('padding-top: 10px')).toBe(parse('padding-top: 10px'));
});

it('expands `font`', () => {
    expect(parse(`
        font: 1rem "Roboto Condensed", sans-serif;
    `)).toBe(parse(`
        font-style: normal;
        font-variant: normal;
        font-weight: normal;
        font-stretch: normal;
        font-size: 1rem;
        line-height: normal;
        font-family: Roboto Condensed, sans-serif;
    `));
});
