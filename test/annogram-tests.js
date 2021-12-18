import assert from 'assert';
import MetaMarkov from '../meta-markov';
import poems from '../poems.js';

describe('MetaMarkov', function () {
  describe('#annotate()', function () {

    it('should annotate across sources1', function () {
      let gen = [
        'I will step out of the city.',
        '<p>My wife came in from the kitchen.',
      ];
      let mm = metaMarkov();
      let poem = mm._annotate(gen.join(' '));
      let poemText = mm.display(poem);
      console.log('\n' + poem.text + '\n' + poemText + '\n' + mm.display(poem, 1));
      mm.printLines(poem);
      assert.equal(poemText, poem.text.replace(/<p>/g, ''));
    });

    it('should annotate across sources2', function () {
      let gen = [
        'He had been chasing the sound of the truck',
        '<p>A man and a woman, and the way it began.',
      ]
      let mm = metaMarkov();
      let poem = mm._annotate(gen.join(' '));
      let poemText = mm.display(poem);
      console.log('\n' + poem.text + '\n' + poemText + '\n' + mm.display(poem, 1))
      assert.equal(poemText, poem.text.replace(/<p>/g, ''));
    });

    function metaMarkov() {
      return new MetaMarkov(4, poems, { maxLengthMatch: 7, trace: 0 });
    }
  });
});