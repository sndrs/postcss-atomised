# Atomised CSS

PoC that creates an atomised stylesheet from a standard one, and provides a json map from the original classes to the atomic ones.

```CSS
.thing1 {
    background-color: red;
}
.thing2 {
    background-color: red;
    line-height: 0;
}
```
is turned into:
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
The idea is that you inline the atomic CSS on the page, and you then do the following in build step:
```HTML
<div class="thing1"></div>
<div class="thing2"></div>
```
with
```HTML
<div class="a"></div>
<div class="a b"></div>
```

### Node.js 0.10
It uses PostCSS, so [their caveat](https://github.com/postcss/postcss#nodejs-010-and-the-promise-api) about v0.10 applies.

## To do
- [ ] pseudo selectors
- [ ] media queries
- [ ] scoping classes?
- [ ] public classes?

## Tests

`npm test`
