# Atomised CSS [![Build Status](https://travis-ci.org/sndrs/atomised-css.svg?branch=master)](https://travis-ci.org/sndrs/atomised-css)

PoC that creates an atomised stylesheet from a standard one, and provides a json map from the original classes to the atomic ones.

So this:
```CSS
.thing1 {
    background-color: red;
}
.thing2 {
    background-color: red;
    line-height: 0;
}
```
is turned into this:
```CSS
.a { background-color: red; }
.b { line-height: 0; }
```
```JSON
{
    "thing1": ["a"],
    "thing2": ["a", "b"]
}
```
The idea is that you would inline the atomic CSS on a page, and then do the following in a build step for production:
```HTML
<div class="thing1"></div>
<div class="thing2"></div>
```
with
```HTML
<div class="a"></div>
<div class="a b"></div>
```

This means you should end up with the smalled possible CSS while being able to write it as normal.

Note that elements must have only one class for it to work, and only class selectors can be used.

Currently, there is only a test suite, which you can run with the standard `npm test`.

### Node.js 0.10
It uses PostCSS, so [their caveat](https://github.com/postcss/postcss#nodejs-010-and-the-promise-api) about v0.10 applies.

## To do
- [ ] pseudo selectors
- [ ] media queries
- [ ] scoping classes?
- [ ] public classes?
