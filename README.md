# postcss-atomised
[![npm version](https://badge.fury.io/js/postcss-atomised.svg)](https://badge.fury.io/js/postcss-atomised) [![Build Status](https://travis-ci.org/atomised-css/postcss-atomised.svg?branch=master)](https://travis-ci.org/atomised-css/postcss-atomised) [![Coverage Status](https://coveralls.io/repos/github/atomised-css/postcss-atomised/badge.svg?branch=master)](https://coveralls.io/github/atomised-css/postcss-atomised?branch=master)  [![Dependency Status](https://dependencyci.com/github/atomised-css/postcss-atomised/badge)](https://dependencyci.com/github/atomised-css/postcss-atomised) [![Dependency Status](https://david-dm.org/atomised-css/postcss-atomised.svg)](https://david-dm.org/atomised-css/postcss-atomised) [![devDependency Status](https://david-dm.org/atomised-css/postcss-atomised/dev-status.svg)](https://david-dm.org/atomised-css/postcss-atomised#info=devDependencies)

 _This is probably not stable. It was initially developed for use on [the Guardian website](https://github.com/guardian/frontend), but it feels like it's the wrong solution to the problem of `bloat + complexity`. Leaving it here in case anyone finds it useful or we pick it up again._

---

[PostCSS](http://postcss.org) plugin that [atomises](http://www.creativebloq.com/css3/atomic-css-11619006) a standard set of CSS, and provides a json map from the original classes to the atomised ones.

Enables you to write CSS in an insolated, super-modular fashion without worrying about the bloat of duplication (the only way you could serve a smaller stylesheet would be to use fewer styles).

## Example
Take your stylesheet…

```css
/* original.css */
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
Pass it through the plugin…

```javascript
// load the original CSS file and atomise it

import {readFileSync} from 'fs';

import postcss from 'postcss';
import atomised from 'postcss-atomised';

const css = readFileSync('./original.css', 'utf8');
const options = {};

postcss([atomised(options)]).process(css).then(result => {
    // do something with `result`
});
```

`result.css` is a String containing the atomised CSS:

```css
.a { background-color: red; }
.b { margin-top: 1rem; }
.c { margin-right: 1rem; }
.d { margin-bottom: 1rem; }
.e { margin-left: 1rem; }
@media (min-width: 100px) {
    .f:hover { background-color: hotpink; }
}
```

You now also have a file called `atomised-map.json` in `cwd`.

```javascript
// atomised-map.json
{
  "one": ["a", "b", "c"," d", "e"],
  "two": ["a", "b", "f"]
}
```

This can be used to transform your templates.

```html
<div class="one"></div>
<div class="two"></div>
```

into…

```html
<div class="a b c d e f"></div>
<div class="a c g h"></div>
```

## Options
Type: `Object` | `Null`

No options are required. By default, a file called `atomised-map.json` will be written to `cwd` containing the atomised JSON map.

### `options.mapPath`
Type: (`String` | `Null`) _optional_


Alternative location for the atomised JSON map to be saved. `null` will prevent the output being written to disk.

### `options.mapHandler`
Type: (`Function`) _optional_

Callback function that receives one arguement – the JSON map object.

## Restrictions
- only single class selectors can be atomised (other selectors will pass straight through)
- multiple/duplicate and pseudo selectors/elements are fine

| Selector  | Ok |
|---|---|
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
| `.a:b { }`  | :white_check_mark: |
| `.a, .b { }`  | :white_check_mark:  |
| `.a { } .a { }`  | :white_check_mark:  |
| `.a:hover { }`  | :white_check_mark:  |

## Development
Run `npm start` to run the test runner in watch mode, or `npm test` for a one-off.
Node 6 or greater is needed for development.

## Node.js 0.*
Node 4 or greater is needed to use the plugin.
