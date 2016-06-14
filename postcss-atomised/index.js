'use strict';

var postcss = require('postcss');

var getRulesForAtRules = function getRulesForAtRules(atRule) {
    var rules = [];
    atRule.walkRules(function (rule) {
        rules.push(rule);
    });
    return rules;
};

module.exports = postcss.plugin('atomised', function () {
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    return function (css, result) {
        var x = { all: [] };
        css.walkAtRules(function (atRule) {
            console.log('@' + atRule.name + ' ' + atRule.params);
        });
    };
});
