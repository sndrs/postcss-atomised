# Atomised CSS [![Build Status](https://travis-ci.org/sndrs/postcss-atomised.svg?branch=master)](https://travis-ci.org/sndrs/postcss-atomised)

[PostCSS](http://postcss.org) plugin that creates an atomised stylesheet from a standard one, and provides a json map from the original classes to the atomic ones.

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

into this:

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

and this:

```JSON
{
  "one": ["a", "b", "c"," d", "e"],
  "two": ["a", "b", "f"]
}
```

The idea is that in development, you leave your big stylesheet alone, with sourcemaps etc all intact. In production though, you would inline the atomic CSS and then using the json map, transform the following:

```HTML
<div class="one"></div>
<div class="two"></div>
```

into:

```HTML
<div class="a b c d e f"></div>
<div class="a c g h"></div>
```

This means you should be able to write your CSS in a super-modular way, without worrying about the bloat.

### Selector requirements
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


All elements that you want to benefit from atomisation can only use one class from the original stylesheet. This means that those elements are completely isolated. And because it reduces a compatible stylesheet to only its resolved declarations, any duplication across atmomised rules will be eradicated.

## Usage

```javascript
import postcss from 'postcss';
import atomised from 'postcss-atomised';

const options = {
    json: path_to_where_the_json_should_go
};

postcss([atomised(options)]).process(css).then(result => {
    // do something with `result`
});
```

## Development
Run `npm start` to run the Ava test runner in watch mode, or `npm test` for a one-off.

## Node.js 0.10
As it's a PostCSS plugin, [their caveat](https://github.com/postcss/postcss#nodejs-010-and-the-promise-api) about v0.10 applies.
