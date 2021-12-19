import assert from 'assert';
import Annogram from '../annogram';
import poems from '../poems.js';
import RiTa from 'rita';

describe('Annograms', function () {
  describe('#annotate()', function () {

    this.timeout(20000);

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
      let mm = annogram();
      let poem = mm.annotate(gen);
      let poemText = mm.display(poem);
      //console.log('\n' + poem.text + '\n\n' + poemText + '\n\n' + mm.display(poem, 1));
      //mm.printLines(poem);
      assert.equal(poemText, poem.text.replace(/<p>/g, ''));
    });

    it('should annotate across sources2', function () {
      let gen = [
        'He had been chasing the sound of the truck',
        '<p>A man and a woman, and the way it began.',
      ]
      let mm = annogram();
      let poem = mm.annotate(gen);
      let poemText = mm.display(poem);
      //console.log('\n' + poem.text + '\n\n' + poemText + '\n\n' + mm.display(poem, 1));
      //mm.printLines(poem);
      assert.equal(poemText, poem.text.replace(/<p>/g, ''));
    });

    it('should annotate across sources3', function () {
      let gen = ['It was not a sparrow, he was alive.', 'He took one of them'];
      let mm = annogram();
      let poem = mm.annotate(gen);
      let poemText = mm.display(poem);
      //console.log('\n' + poem.text + '\n\n' + poemText + '\n\n' + mm.display(poem, 1));
      //mm.printLines(poem);
      assert.equal(poemText, poem.text.replace(/<p>/g, ''));
    });

    it('should annotate across sources4', function () {
      let gen = [
        'There is no plan in the future; I see he has to love you.',
        'I look at his ass his old man ass look at his face.',
        'He is the old witch in the woods behind us.',
        'We were at the window, all the people on the street outside the window, but it seemed to me, but, I think, the ones made of words.',
        'I was hungry and I wanted to tell her you have an appointment?'
      ];
      let mm = annogram();
      let poem = mm.annotate(gen);
      let poemText = mm.display(poem);
      //console.log(poem.meta);
      //console.log('\n' + poem.text + '\n\n' + poemText + '\n\n' + mm.display(poem, 1));
      //mm.printLines(poem);
      assert.equal(poemText, poem.text.replace(/<p>/g, ''));
    });

    function annogram() {
      return new Annogram(4, poems, { maxLengthMatch: 7, trace: 0 });
    }
  });
});


/*function annotate(output, n = 4) {
  
  let tlen = n - 1, tokens = [];
  let words = RiTa.tokenize(output);
  let poem = { text: output, tokens: words, meta: [] };

  for (let i = 0; i < words.length; i++) {
    tokens.push(words[i]);
    if (tokens.length === tlen) {
      let src = lookupSource(tokens, { output, index: 0 })[0];
      poem.meta.push({
        tokens: tokens,
        sourceId: src.id,
        start: (i - tokens.length)
      });
      tokens = [];
    }
  }
  return poem;
}

function lookupSource(tokens, dbugInfo) {
  let phrase = RiTa.untokenize(tokens);
  let srcs = poems.filter(p => p.text.includes(phrase));
  if (!srcs || !srcs.length) throw Error(`(${dbugInfo.index}) `
    + `No source for "${phrase}"\n\n${dbugInfo.output}`);
  srcs.sort((a, b) => a.id - b.id);
  return srcs;
}*/