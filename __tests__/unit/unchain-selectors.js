import postcss from 'postcss';
import perfectionist from 'perfectionist';

import unchainSelectors from '../../src/lib/unchain-selectors';

function parse(css) {
    const src = postcss().process(css).root;
    unchainSelectors(src);
    return perfectionist.process(src).css;
}

it('expands lists of selectors in a single rule to individual rules', () => {
    expect(parse(`
        .a {
            color: green;
        }
        .a, .b {
            color: red;
        }
        .b {
            color: blue
        }
    `)).toBe(parse(`
        .a {
            color: green;
        }
        .a {
            color: red;
        }
        .b {
            color: red;
        }
        .b {
            color: blue;
        }
    `));
});
