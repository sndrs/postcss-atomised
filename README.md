# postcss-atomised
[![npm version](https://badge.fury.io/js/postcss-atomised.svg)](https://badge.fury.io/js/postcss-atomised) [![Build Status](https://travis-ci.org/atomised-css/postcss-atomised.svg?branch=master)](https://travis-ci.org/atomised-css/postcss-atomised) [![Coverage Status](https://coveralls.io/repos/github/atomised-css/postcss-atomised/badge.svg?branch=master)](https://coveralls.io/github/atomised-css/postcss-atomised?branch=master)  [![Dependency Status](https://dependencyci.com/github/atomised-css/postcss-atomised/badge)](https://dependencyci.com/github/atomised-css/postcss-atomised) [![Dependency Status](https://david-dm.org/atomised-css/postcss-atomised.svg)](https://david-dm.org/atomised-css/postcss-atomised) [![devDependency Status](https://david-dm.org/atomised-css/postcss-atomised/dev-status.svg)](https://david-dm.org/atomised-css/postcss-atomised#info=devDependencies)

 _“This is under active, initial developement for use on https://github.com/guardian/frontend and is not yet stable. It will get a proper 1.0.0 release when it is.”_ – :construction_worker:

---

[PostCSS](http://postcss.org) plugin that [atomises](http://www.creativebloq.com/css3/atomic-css-11619006) a standard set of CSS, and provides a json map from the original classes to the atomic ones.

It will turn this:

```CSS
.one {
    background-color: red;
    margin: 1rem;
}
.two {
    background-color: red;
    margin-top: 1rem;
}
@media (min-width: 100px) {
    .two:hover {
        background-color: hotpink;
    }
}
```

into this atomised `css`:

```CSS
.a { background-color: red; }
.b { margin-top: 1rem; }
.c { margin-right: 1rem; }
.d { margin-bottom: 1rem; }
.e { margin-left: 1rem; }
@media (min-width: 100px) {
 .f:hover { background-color: hotpink; }
}
```

and this json map:

```JSON
{
  "one": ["a", "b", "c"," d", "e"],
  "two": ["a", "b", "f"]
}
```

The idea is that in development, you leave your big stylesheet alone, with sourcemaps etc all intact. In production though, you could inline the atomic CSS and then using the json map, transform the following:

```HTML
<div class="one"></div>
<div class="two"></div>
```

into:

```HTML
<div class="a b c d e f"></div>
<div class="a c g h"></div>
```

This should mean you can the get benefit of writing CSS in an insolated, super-modular fashion without worrying about the bloat of duplication (the only way you could serve a smaller stylesheet would be to use fewer styles).

### Restrictions
- only single class selectors can be atomised (other selectors will pass straight through)
- pseudo selectors/elements are fine
- multiple/duplicate selectors are fine

| Selector  | Ok |
|---|---|
| `.a:b { }`  | :white_check_mark: |
| `.a, .b { }`  | :white_check_mark:  |
| `.a { }; .a { }`  | :white_check_mark:  |
| `.a .b { }`  | :x: |
| `.a.b { }`  | :x:  |
| `a { }`  | :x:  |
| `a b { }`  | :x:  |
|  `#a { }` | :x:  |
| `a[b] { }`  | :x:  |
| `a > b { }`  | :x:  |
| `a + b { }`  | :x:  |
| `a ~ b { }`  | :x:  |
| `*`  | :x:  |

## Usage

```javascript
import postcss from 'postcss';
import atomised from 'postcss-atomised';

const options = {
    jsonPath: 'path/to/json' // atomic map is written to path/to/json.json
};

postcss([atomised(options)]).process(css).then(result => {
    // result.css => atomised css
});
```

## Development
Run `npm start` to run the Ava test runner in watch mode, or `npm test` for a one-off.

## Node.js 0.10
As it's a PostCSS plugin, [their caveat](https://github.com/postcss/postcss#nodejs-010-and-the-promise-api) about v0.10 applies.
