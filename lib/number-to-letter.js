// I have no idea how this actually works, but it does
// i got it off SO #toptier
const numberToLetter = i => (i >= 26 ? numberToLetter((i / 26 >> 0) - 1) : '') + 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRTUVWXYZ'[i % 26 >> 0];

export default numberToLetter;