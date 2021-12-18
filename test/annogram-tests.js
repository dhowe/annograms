import assert from 'assert';
import MetaMarkov from '../meta-markov';
import poems from '../poems.js';

describe('MetaMarkov', function () {
  describe('#annotate()', function () {

    // WORKING HERE
    it('should annotate across sources1', function () {
      let gen = [
        'I will step out of the city.',
        '<p>My wife came in from the kitchen.',
      ];
      let mm = metaMarkov();
      let poem = mm._annotate(gen.join(' '));
      assert.equal(typeof poem, 'object');
      let lastMeta = poem.meta[poem.meta.length-1];
      let lastSource = poems.find(p => p.id === lastMeta.sourceId);
      //console.log(lastMeta);
      let annotated = mm.display(poem);
      assert.equal(annotated.replace(/\[#[0-9]+\]/g, ''), poem.text.replace(/<p> */g, ''));
    });

    it('should annotate across sources2', function () {
      let gen = [
        'He had been chasing the sound of the truck',
        '<p>A man and a woman, and the way it began.',
      ]
      let mm = metaMarkov();
      let poem = mm._annotate(gen.join(' '));
      //console.log(poem.meta)
      let annotated = mm.displayLines(poem);
      assert.equal(annotated.replace(/\[#[0-9]+\]/g, ''), poem.text.replace(/<p> */g, ''));

    });

    function metaMarkov() {
      return new MetaMarkov(4, poems, { maxLengthMatch: 7, trace: 0 });
    }
  });
});