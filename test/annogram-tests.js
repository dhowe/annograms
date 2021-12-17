import assert from 'assert';
import RiTa from '../../ritajs/src/rita';
import MetaMarkov from '../meta-markov';

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
      let poems = [].concat(
        require('../data/Penguin_Prose_Poems.json'),
        require('../data/Great_American_Prose_Poems.json'),
        require('../data/Short_An_International_Anthology.json')
      ).map((p, i) => {

        let text = p.text
          .replace(/[”“()]/g, '')
          .replace(/((\r?\n)|<p>|[\s])+/g, ' ')
          .replace(/(^[`‘’']|[`‘’']\s|\s[`‘’'])/g, ' ')
          .replace(/[`‘’']([!?.])$/, '$1')
          .replace(/!/, '.')
          .replace(/:/, ',');

        //let minSentenceLength = 7;
        let sents = RiTa.sentences(text);
        sents.map(s => {
          let words = RiTa.tokenize(s);
          words.map(w => w.startsWith('I') ? w : w.toLowerCase());
          return RiTa.capitalize(RiTa.untokenize(words));
        });
        p.id = i;
        p.text = sents.join(' ');
        return p;
      });
      return new MetaMarkov(4, poems, { maxLengthMatch: 7, trace: 0 });
    }
  });
});