// I have no idea how this actually works, but it does
// I got it off SO #toptier
// http://stackoverflow.com/a/32007970
export default function numberToLetter(i) {
    return (i >= 52 ? numberToLetter((i / 52 >> 0) - 1) : '') + 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'[i % 52 >> 0]; // eslint-disable-line no-bitwise
}
