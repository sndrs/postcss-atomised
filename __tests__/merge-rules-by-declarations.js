import postcss from 'postcss';
import perfectionist from 'perfectionist';

import mergeRulesByDeclarations from '../src/lib/merge-rules-by-declarations';

function parse(css) {
    const src = postcss().process(css).root;
    mergeRulesByDeclarations(src);
    return perfectionist.process(src).css;
}

it('combines rules with identical declarations', () => {
    expect(parse(`
        body {
            color: red;
            font-size: 1rem
        }
        .a {
            color: red;
            font-size: 1rem
        }
    `)).toBe(parse(`
        body, .a {
            color: red;
            font-size: 1rem
        }
    `));
});
