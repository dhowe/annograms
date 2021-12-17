import assert from 'assert';
import MetaMarkov from '../meta-markov';
import poems from '../poems.js';

describe('MetaMarkov', function () {
  describe('#annotate()', function () {

    it('should annotate across sources1', function () {
      let gen = [
        'I will step out of the city.',
        '<p>My wife',
      ];
      let mm = metaMarkov();
      let poem = mm._annotate(gen.join(' '));
      console.log(poem);
      mm.display(poem);
      assert.equal(typeof poem, 'object');
    });

    0&&it('should annotate across sources2', function () {
      let gen = [
        'He had been chasing the sound of the truck',
        '<p> A man and a woman, and the way it began.',
      ]
      let mm = metaMarkov();
      let poem = mm._annotate(gen.join(' '));
      mm.display(poem);
      assert.equal(typeof poem, 'object');
    });

    function metaMarkov() {
      return new MetaMarkov(4, poems, { maxLengthMatch: 7, trace: 0 });
    }
  });
});