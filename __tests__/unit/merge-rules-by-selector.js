import postcss from 'postcss';
import perfectionist from 'perfectionist';

import mergeRulesBySelector from '../../src/lib/merge-rules-by-selector';

function parse(css) {
    const src = postcss().process(css).root;
    mergeRulesBySelector(src);
    return perfectionist.process(src).css;
}

it('merges rules with identical selectors', () => {
    expect(parse(`
        .a {
            color: red;
        }
        .a {
            font-size: 1rem;
        }
    `)).toBe(parse(`
        .a {
            color: red;
            font-size: 1rem
        }
    `));
});

it('does not merge rules with similar but non-identical selectors', () => {
    expect(parse(`
        body, .a {
            color: red;
        }
        .a {
            font-size: 1rem;
        }
    `)).toBe(parse(`
        body, .a {
            color: red;
        }
        .a {
            font-size: 1rem;
        }
    `));
});
