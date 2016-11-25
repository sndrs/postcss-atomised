import postcss from 'postcss';
import perfectionist from 'perfectionist';

import passthruUnatomisable from '../../src/lib/passthru-unatomisable';

function parse(css) {
    const src = postcss().process(css);
    passthruUnatomisable(src.root, [], src.result);
    return perfectionist.process(src).css.trim();
}

it('removes ID selectors', () => {
    expect(parse(`
        #a {
            font-size: 1rem;
        }
    `)).toBe('');
});

it('removes Type selectors', () => {
    expect(parse(`
        body {
            font-size: 1rem;
        }
    `)).toBe('');
});

it('removes Universal selectors', () => {
    expect(parse(`
        * {
            font-size: 1rem;
        }
    `)).toBe('');
});

it('removes Attribute selectors', () => {
    expect(parse(`
        [class] {
            font-size: 1rem;
        }
    `)).toBe('');
});

it('removes combinator selectors', () => {
    expect(parse(`
        .a + .b {
            font-size: 1rem;
        }
    `)).toBe('');

    expect(parse(`
        .a ~ .b {
            font-size: 1rem;
        }
    `)).toBe('');

    expect(parse(`
        .a > .b {
            font-size: 1rem;
        }
    `)).toBe('');

    expect(parse(`
        .a .b {
            font-size: 1rem;
        }
    `)).toBe('');
});

it('keeps single Classes', () => {
    expect(parse(`
        .a {
            font-size: 1rem;
        }
    `)).toBe(parse(`
        .a {
            font-size: 1rem;
        }
    `));
});

it('keeps pseudo-classes', () => {
    expect(parse(`
        .a {
            font-size: 2rem;
        }
        .a:hover {
            font-size: 1rem;
        }
    `)).toBe(parse(`
        .a {
            font-size: 2rem;
        }
        .a:hover {
            font-size: 1rem;
        }
    `));
});

it('keeps pseudo-elements', () => {
    expect(parse(`
        .a {
            font-size: 2rem;
        }
        .a::after {
            font-size: 1rem;
        }
    `)).toBe(parse(`
        .a {
            font-size: 2rem;
        }
        .a::after {
            font-size: 1rem;
        }
    `));
});
