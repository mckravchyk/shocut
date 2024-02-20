import { checkContext } from 'src/functions';

describe('Context Checker', () => {
  describe('OR', () => {
    it('matches any context', () => {
      expect(checkContext([], [])).toBe(true);
      expect(checkContext(['a', 'b'], [])).toBe(true);
    });

    it('matches one of the specified contexts', () => {
      expect(checkContext(['a', 'b', 'c'], ['a'])).toBe(true);
      expect(checkContext(['a', 'b', 'c'], ['b'])).toBe(true);
      expect(checkContext(['a', 'b', 'c'], ['a', 'b'])).toBe(true);
    });

    it('does not match if none of the contexts are active', () => {
      expect(checkContext(['a', 'b', 'c'], ['d'])).toBe(false);
    });

    it('matches any but one of the specified contexts', () => {
      expect(checkContext([], ['!a'])).toBe(true);
      expect(checkContext(['a', 'b', 'c'], ['!d'])).toBe(true);
      expect(checkContext(['a'], ['a', '!b'])).toBe(true);
    });

    it('does not match if a negation matches', () => {
      expect(checkContext(['a', 'b', 'c'], ['!a'])).toBe(false);

      // Note that the negations are subject to AND logic (since the negation of an OR statement
      // is equal to an AND of individual negations). In order for it to be a match there must be
      // neither b nor d.
      expect(checkContext(['a', 'b', 'c'], ['!b', '!d'])).toBe(false);
    });

    it('does not match if multiple negations match', () => {
      expect(checkContext(['a', 'b', 'c'], ['!b', '!c'])).toBe(false);
    });

    it('does not match if affirmations and negations do not match', () => {
      expect(checkContext([], ['a', '!b'])).toBe(false);
      expect(checkContext(['c'], ['a', '!b'])).toBe(false);
      expect(checkContext(['c'], ['a', 'e', '!b', '!f'])).toBe(false);
    });
  });

  describe('AND', () => {
    it('matches if all of the specified contexts are present', () => {
      expect(checkContext(['a', 'b', 'c'], [['a', 'b', 'c']])).toBe(true);
      expect(checkContext(['a', 'b', 'c', 'd'], [['a', 'b', 'c']])).toBe(true);
    });

    it('does not match if one of the contexts is not active', () => {
      expect(checkContext(['a', 'c'], [['a', 'b']])).toBe(false);
      expect(checkContext(['a', 'c'], [['a', 'b', '!c']])).toBe(false);
    });

    it('does not match if a negation matches', () => {
      expect(checkContext(['a', 'b', 'c'], [['a', 'b', '!c']])).toBe(false);
    });

    it('does not match if at least one negation matches', () => {
      // The condition is a AND b AND not-c AND not-d. Since c is present the statement must be
      // false.
      expect(checkContext(['a', 'b', 'c'], [['a', 'b', '!c', '!d']])).toBe(false);
    });

    it('does not match if multiple negations match', () => {
      expect(checkContext(['a', 'b', 'c'], [['a', '!b', '!c']])).toBe(false);
    });

    it('does not match if both an affirmation and a negation does not match', () => {
      expect(checkContext(['a', 'b', 'c'], [['d', 'e', '!f', '!g']])).toBe(false);
    });
  });

  describe('OR + AND', () => {
    it('matches if both conditions match', () => {
      expect(checkContext(['a', 'b', 'c'], ['a', ['a', 'b', 'c']])).toBe(true);
    });

    it('matches if either of the conditions matches', () => {
      expect(checkContext(['a', 'b', 'c'], ['d', ['a', 'b', 'c']])).toBe(true);
      expect(checkContext(['a', 'b', 'c'], [['a', 'b'], ['a', 'b', 'd']])).toBe(true);
      expect(checkContext(['a', 'b', 'c'], [[], ['a', 'b', 'd']])).toBe(true);
    });

    it('does not match if neither condition matches', () => {
      expect(checkContext(['a', 'b', 'c'], [['d', 'e'], ['a', 'b', 'd']])).toBe(false);
    });
  });
});
