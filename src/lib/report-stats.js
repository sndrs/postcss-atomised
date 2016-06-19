import chalk from 'chalk';
import prettyBytes from 'pretty-bytes';

export default (result, stats, colour, description) => {
    result.messages.push({
        type:    'atomised-src',
        plugin:  'postcss-atomised',
        text:     chalk[colour](`${description}${stats.declarations.total} declarations in ${prettyBytes(stats.gzipSize)}.`)
    });
}

