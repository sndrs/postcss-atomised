'use strict';

import {writeFileSync as save} from "fs";
import glob from 'glob-promise';
import mkdirp from 'mkdirp-promise';

// CSS stuff
import sass from 'node-sass';
import prettyBytes from 'pretty-bytes';
import gzipSize from 'gzip-size';

// our modules
import atomiciseCSS from './lib/atomicise-css';

const outDir = 'build';

// 1. parse the total generated CSS into an AST
glob('src/stylesheets/**/!(_)*.scss')
    .then(sassPaths => {
        // get the css for all modules
        return sassPaths.map(path => sass.renderSync({file: path}).css.toString('utf8')).join();
    })
    .then(atomiciseCSS)
    .then(({atomicCSS, atomicMap}) => {
        return mkdirp(outDir).then(function () {
            save(`${outDir}/class-map.json`, JSON.stringify(atomicMap, null, 4));
            save(`${outDir}/styles.css`, atomicCSS);
            console.log(`It's saved!`);
            console.log(`${atomicCSS.split('.').length - 1} classes, ${prettyBytes(gzipSize.sync(atomicCSS))} (gzipped).`);
        })
    })
    .catch(e => console.log(e));