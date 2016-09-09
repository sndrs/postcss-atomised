import postcss from 'postcss';
import perfectionist from 'perfectionist';

import resolveDeclarations from '../src/lib/resolve-declarations';

function parse(css) {
    const src = postcss().process(css).root;
    resolveDeclarations(src);
    return perfectionist.process(src).css;
}

it('resolves duplicate declarations in single individual rules', () => {
    expect(parse(`
        .a {
            color: red;
            color: blue
        }
        .a {
            color: red;
        }
    `)).toBe(parse(`
        .a {
            color: blue;
        }
        .a {
            color: red;
        }
    `));
});
