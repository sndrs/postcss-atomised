# Atomised CSS [![Build Status](https://travis-ci.org/sndrs/postcss-atomised.svg?branch=master)](https://travis-ci.org/sndrs/postcss-atomised)

[PostCSS](http://postcss.org) plugin that creates an atomised stylesheet from a standard one, and provides a json map from the original classes to the atomic ones.

It will turn this:

```CSS
.one {
    background-color: red;
    color: limegreen;
    margin: 1rem;
}
.two {
    background-color: red;
    margin-top: 1rem;
}
.two:hover {
    background-color: hotpink;
}
@media (min-width: 100px) {
    .two:hover {
        background-color: brown;
    }
}
```

into this:

```CSS
.a { background-color: red; }
.b { color: limegreen; }
.c { margin-top: 1rem; }
.d { margin-right: 1rem; }
.e { margin-bottom: 1rem; }
.f { margin-left: 1rem; }
.g:hover { background-color: hotpink; }
@media (min-width: 100px) {
    .h:hover { background-color: brown; }
}
```

and this:

```JSON
{
    "one": [ "a", "b", "c", "d", "e", "f" ],
    "two": [ "a", "c", "g", "h" ]
}
```

The idea is that in production, you would inline the atomic CSS and then transform the following:

```HTML
<div class="one"></div>
<div class="two"></div>
```

into:

```HTML
<div class="a b c d e f"></div>
<div class="a c g h"></div>
```

This means you should get the benefits of atomic CSS file size, while being able to write CSS however you like (Sass, PostCSS etc) and without needing to learn an atomic library.

## Usage

Note that elements must have only one class for it to work, and only class selectors can be used.

```javascript
import postcss from 'postcss';
import atomised from 'postcss-atomised';
postcss([atomised({json: path_to_where_the_json_should_go)})]).process(css).then(result => {
    // do something with `result.css`
});
```

## Development
Run `npm start` to run the Ava test runner in watch mode, or `npm test` for a one-off.

## Node.js 0.10
As it's a PostCSS plugin, [their caveat](https://github.com/postcss/postcss#nodejs-010-and-the-promise-api) about v0.10 applies.
