# Atomised CSS

PoC that creates an atomised stylesheet from a standard one, and provides a json map from the original classes to the atomic ones.

### Node.js 0.10
Uses PostCSS so users of 0.10 will need to [polyfill `Promise`](https://github.com/postcss/postcss#nodejs-010-and-the-promise-api).

## To do
- [ ] pseudo selectors
- [ ] media queries
- [ ] scoping classes?
- [ ] public classes?

## Usage

`npm start`

## Tests

`npm test`
