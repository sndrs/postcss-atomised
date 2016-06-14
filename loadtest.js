var postcss = require('postcss');
var atomised = require('./postcss-atomised');

var s = postcss([atomised()]).process(`
@media (min-wdith: 10px) {
    p {color:red}
}
p {color:blue}
`).css;

console.log("\n*********** output ***********");
console.log(s);
console.log("******************************\n");
