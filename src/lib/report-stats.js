import chalk from 'chalk';
import prettyBytes from 'pretty-bytes';

const pluralise = (term, count) => count > 1 ? `${term}s` : term;

export default (result, stats, colour, description) => {
    result.messages.push({
        type:    'atomised-src',
        plugin:  'postcss-atomised',
        text:     chalk[colour](`${description}${stats.declarations.total} ${pluralise('declaration', stats.declarations.total)} in ${prettyBytes(stats.gzipSize)}.`)
    });
}

