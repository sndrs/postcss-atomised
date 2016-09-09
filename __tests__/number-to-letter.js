import numberToLetter from '../src/lib/number-to-letter';

it('returns values for any number', () => {
    expect(numberToLetter(0)).toBe('a');
    expect(numberToLetter(52)).toBe('aa');
    expect(numberToLetter(2756)).toBe('aaa');
    expect(numberToLetter(1000000000)).toBe('bFMXym');
});
