import test from 'ava';
import atomiciseCSS from './lib/atomicise-css';
import postcss from "postcss";

const parseCSS = css => postcss().process(css).root.nodes.map(rule => {
    const {selector, nodes} = rule;
    const declarations = nodes.map(declaration => {
        const {prop, value} = declaration;
        return {prop, value};
    });
    return {selector, declarations};
})

test('dedupe styles', t => {
    return atomiciseCSS(`
        .x {
            color: red;
            color: red;
        }
    `).then(({atomicCSS, atomicMap}) => {
        t.deepEqual(atomicMap, {x: ['a']});
        t.deepEqual(parseCSS(atomicCSS), [{
            "selector": ".a",
            "declarations": [
                {
                    "prop": "color",
                    "value": "red"
                }
            ]
        }])
    });
});

test('expand chained selectors', t => {
    return atomiciseCSS(`
        .x, .y {
            color: red;
        }
        .y {
            height: 0;
        }
    `).then(({atomicCSS, atomicMap}) => {
        console.log(atomicMap);
        t.deepEqual(atomicMap, {
            x: ['a'],
            y: ['a', 'b']
        });
        t.deepEqual(parseCSS(atomicCSS), [{
            "selector": ".a",
            "declarations": [
                {
                    "prop": "color",
                    "value": "red"
                }
            ]
        }, {
            "selector": ".b",
            "declarations": [
                {
                    "prop": "height",
                    "value": "0"
                }
            ]
        }])
    });
});
