import assert from 'assert';
import {Annogram} from '../annogram';
import poems from '../poems.js';
import RiTa from 'rita';

describe('Annograms', function () {
  this.timeout(20000);

  describe('#asLines()', function () {

    it('should handle lineation', function () {
      let gen = [
        'The ice-machine couldn’t keep up, and I was going to die.',
        'The result is not a planet, but a woman, and the daughter of the house.',
      ];
      let mm = annogram();
      let poem = mm.annotateGreedy(gen);
      let pl = mm.asLines(poem);
      //console.log(pl);
      let expected = [
        'The ice-machine couldn’t keep up',
        '                couldn’t keep up, and',
        '                              up, and I',
        '                                  and I was going to',
        '                                        was going to die',
        '                                            going to die.',
        'to die. The',
        '   die. The result is not a',
        '                   is not a planet, but a',
        '                                    but a woman',
        '                                    but a woman,',
        '                                        a woman, and',
        '                                          woman, and the',
        '                                                 and the daughter of',
        '                                                     the daughter of the house',
        '                                                                  of the house.'
      ];
      assert.deepEqual(pl, expected);
    });

    it('should handle punctuation', function () {
      let gen = ['The ice-machine couldn’t keep up, and I was going to die.'];
      let mm = annogram();
      let poem = mm.annotateGreedy(gen);
      let pl = mm.asLines(poem);
      //console.log(pl);
      let expected = [
        'The ice-machine couldn’t keep up',
        '                couldn’t keep up, and',
        '                              up, and I',
        '                                  and I was going to',
        '                                        was going to die',
        '                                            going to die.'
      ];
      assert.deepEqual(pl, expected);
    });
  });

  describe('#annotateGreedy()', function () {

    it('should handle greedy breaks', function () {
      let gen = [
        'Her arms moved up now, no one knows, perhaps not at all, but a dream of you.',
        '<p>I was sitting at the table, she told me that I should not know.',
      ];
      let mm = annogram();
      let poem = mm.annotate(gen, { greedy: true });
      //console.log('\n' + poem.text + '\n\n' + mm.display(poem) + '\n\n' + mm.display(poem, 1));
      let lines = mm.asLines(poem);
      //console.log(lines);

      let expected = [
        'Her arms moved up now,',
        '               up now, no one knows',
        '                       no one knows, perhaps not',
        '                                     perhaps not at all,',
        '                                                 at all, but a',
        '                                                         but a dream of',
        '                                                             a dream of you.',
        'I was sitting at the',
        '      sitting at the table,',
        '                 the table, she',
        '                     table, she told me',
        '                            she told me that',
        '                                told me that I should',
        '                                        that I should not',
        '                                             I should not know.'
      ];
      assert.deepEqual(lines, expected);
    });

    it('should handle greedy breaks with source', function () {
      let gen = [
        'Her arms moved up now, no one knows, perhaps not at all, but a dream of you.',
        '<p>I was sitting at the table, she told me that I should not know.',
      ];
      let mm = annogram();
      let poem = mm.annotate(gen, { greedy: true });
      let poemText = mm.display(poem);
      //console.log('\n' + poem.text + '\n\n' + poemText + '\n\n' + mm.display(poem, 1));
      let lines = mm.asLines(poem, { addSources: true });
      //console.log(lines);
      let expected = [
        'Her arms moved up now, [#95]',
        '               up now, no one knows [#484]',
        '                       no one knows, perhaps not [#491]',
        '                                     perhaps not at all, [#412]',
        '                                                 at all, but a [#192]',
        '                                                         but a dream of [#88]',
        '                                                             a dream of you. [#322]',
        'I was sitting at the [#396]',
        '      sitting at the table, [#17]',
        '                 the table, she [#456]',
        '                     table, she told me [#473]',
        '                            she told me that [#473]',
        '                                told me that I should [#356]',
        '                                        that I should not [#137]',
        '                                             I should not know. [#131]'
      ]
      assert.deepEqual(lines, expected);
    });

    it('should handle greedy annotations', function () {
      let mm = annogram();
      let poem = mm.generate(5, { minLength: 10, greedy: true });
      //console.log(poem.lines);
      //console.log('\n' + poem.text + '\n\n' + mm.display(poem) + '\n\n' + mm.display(poem, 1));
      mm.asLines(poem);
      assert.equal(poem.text.startsWith(poem.meta[0].tokens[0]), true,
        'poem start: ' + poem.text.slice(0, 20) + ' != ' + poem.meta[0].tokens[0]);
        // TODO: better tests
    });
  });

  describe('#annotate()', function () {

    it('should handle basic breaks', function () { // fails with extra space
      let gen = [
        'And when he was on the table, she told me that he had walked out on him, the news, which should not be here.',
        'I choose a piece of paper in the basket, but the dog wasn’t there.',
        'But I have to gather together all the things in the room, lock the door, halfway against the door, and the others too.',
        '<p>My wife and I have no way of knowing if they were in the woods that the man disappeared, and that was the end of a small loaf of bread.',
        'I was scared of the washing machine finished its work.'
      ];
      let mm = annogram();
      let poem = mm.annotate(gen, {});
      let poemText = mm.display(poem);
      //console.log('\n' + poem.text + '\n\n' + poemText + '\n\n' + mm.display(poem, 1));
      //mm.asLines(poem);
      assert.equal(poemText, poem.text.replace(/<p> ?/g, ''));
    });

    it('should generate correct annotations', function () {
      let mm = annogram();
      let poem = mm.generate(5, { minLength: 10 });
      //console.log(poem.lines);
      let poemText = mm.display(poem);
      //console.log('\n' + poem.text + '\n\n' + poemText + '\n\n' + mm.display(poem, 1));
      assert.equal(poem.text.startsWith(poem.meta[0].tokens[0]), true,
        'poem start: ' + poem.text.slice(0, 20) + ' != ' + poem.meta[0].tokens[0]);
      // TODO: better test
      //assert.equal(1,2);
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
      //mm.asLines(poem);
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
      //mm.asLines(poem);
      assert.equal(poemText, poem.text.replace(/<p>/g, ''));
    });

    it('should annotate across sources3', function () {
      let gen = ['It was not a sparrow, he was alive.', 'He took one of them'];
      let mm = annogram();
      let poem = mm.annotate(gen);
      let poemText = mm.display(poem);
      //console.log('\n' + poem.text + '\n\n' + poemText + '\n\n' + mm.display(poem, 1));
      //mm.asLines(poem);
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
      //mm.asLines(poem);
      assert.equal(poemText, poem.text.replace(/<p>/g, ''));
    });
  });
  function annogram() {
    return new Annogram(4, poems, { maxLengthMatch: 7, RiTa });
  }
});