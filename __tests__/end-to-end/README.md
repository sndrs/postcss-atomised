# End-to-end tests

These compare the input and output of atomisation for a set of test cases (the `*.html` files).

Original and atomised versions of each test html file are rendered in [phantom](http://phantomjs.org).

The result of calling `getComputedStyle()` for each DOM element in the body of both versions is then compared.

If the final atomised DOM renders with precisely the same `getComputedStyle()` output, the test passes.
