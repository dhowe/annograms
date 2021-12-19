import assert from 'assert';
import Annogram from '../annograms';
import poems from '../poems.js';

describe('MetaMarkov', function () {
  describe('#annotate()', function () {

    this.timeout(5000);

    it('should generate correct annotations', function () {
      let mm = new Annogram(4, poems, { maxLengthMatch: 7, trace: 0 });
      let poem = mm.generate(5, { minLength: 10 });
      let poemText = mm.display(poem);
      //console.log('\n' + poem.text + '\n\n' + poemText + '\n\n' + mm.display(poem, 1));
      assert.equal(poem.text.startsWith(poem.meta[0].tokens[0]), true,
        'poem start: ' + poem.text.slice(0, 20) + ' != ' + poem.meta[0].tokens[0]);

    });

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
      console.log('\n' + poem.text + '\n' + poemText + '\n' + mm.display(poem, 1));
      mm.printLines(poem);
      assert.equal(poemText, poem.text.replace(/<p>/g, ''));
    });

    function metaMarkov() {
      return new Annogram(4, poems, { maxLengthMatch: 7, trace: 0 });
    }
  });
});