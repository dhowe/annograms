import assert from 'assert';
import { loadPoems, RiTa, MetaMarkov } from '../index.js';

describe('MetaMarkov', function () {
  describe('#annotate()', function () {
    
    it('should annotate across sources', function () {
      let gen = [
        'A few drops if you will, it is the creation of the universe would have been what I will never finish the story.',
        'Now, I know, to find out that he had to do with you, the one with the brown, the same time, which is to say, I am here.',
        'I say, yes, and I’m not going to like this, not a freckle.',
        'She says, I will step out of the city.',
        '<p>My wife and I will tell you, you were an infant.',
      ];

      let res = metaMarkov()._annotate(gen.join(' '));
      assert.equal(typeof res, 'object');
    });

    function metaMarkov() {
      return new MetaMarkov(4, loadPoems(), { maxLengthMatch: 7, trace: 0 });
    }
  });
});