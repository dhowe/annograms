import assert from 'assert';
import { Annogram } from '../annogram';
import poems from '../poems.js';
import RiTa from 'rita';

describe('Annograms', function () {
  this.timeout(20000);
  this.slow(2000);


  describe('#annotate()', function () {

    it('should handle basic breaks', function () {
      let gen = [
        'And when he was on the table, she told me that he had walked out on him, the news, which should not be here.',
        'I choose a piece of paper in the basket, but the dog wasn’t there.',
        'But I have to gather together all the things in the room, lock the door, halfway against the door, and the others too.',
        '<p>My wife and I have no way of knowing if they were in the woods that the man disappeared, and that was the end of a small loaf of bread.',
        'I was scared of the washing machine finished its work' // issue #18 here, should be as below
        // 'I was scared of the washing machine finished its work.'
      ];
      let mm = annogram();
      let poem = mm.annotate(gen, {});
      let poemText = mm.asText(poem);
      //mm.asLines(poem);
      assert.equal(poemText, poem.text.replace('<p>', ''));
    });

    it('should use correct RE in lookupSource', function () {
      let phrase, phraseRE, tests, matching;
      
      let rePre = '(^|\\W)', rePost = '(\\W|$)';
      phrase = ", the last,";
      if (RiTa.isPunct(phrase[0])) rePre = '';
      phraseRE = new RegExp(rePre+phrase+rePost);
      tests = [
        "My father died at the age, eighty. One, the last, things he did.",
        "One, the last, things he did.",
        "One, the last,, he did.",
        "One, the last,: he did.",
        "One, the last,; he did.",
        "It was One, the last,",
        "It was One, the last, things",
        "One, the last,.",
        "One, the last,,",
        "One, the last,:",
        "One, the last,;",
        "One, the last,!",
        "One, the last,?",
        "One, the last,-",
        "One, the last,",
        //////////////////////////////////////////
        "One, the last,ing", // false
        "", // false
        "blah", // false
        "ne of the last" // false
      ];

      matching = tests.filter(p => phraseRE.test(p));
      //matching.forEach((s,i) => console.log(i,s));
      assert.equal(matching.length, tests.length-4);

      rePre = '(^|\\W)';
      rePost = '(\\W|$)';
      phrase = ", the last";
      if (RiTa.isPunct(phrase[0])) rePre = '';
      phraseRE = new RegExp(rePre+phrase+rePost);
      tests = [
        "My father died at the age, eighty. One, the last things he did.",
        "One, the last things he did.",
        "One, the last, he did.",
        "One, the last: he did.",
        "One, the last; he did.",
        "It was One, the last",
        "It was One, the last things",
        "One, the last.",
        "One, the last,",
        "One, the last:",
        "One, the last;",
        "One, the last!",
        "One, the last?",
        "One, the last-",
        "One, the last",
        //////////////////////////////////////////
        "One, the lasting", // false
        "", // false
        "blah", // false
        "ne of the last" // false
      ];

      matching = tests.filter(p => phraseRE.test(p));
      assert.equal(matching.length, tests.length-4);


      phrase = "One of the last";
      phraseRE = new RegExp(rePre+phrase+rePost);
      tests = [
        "My father died at the age of eighty. One of the last things he did.",
        "One of the last things he did.",
        "One of the last, he did.",
        "One of the last: he did.",
        "One of the last; he did.",
        "It was One of the last",
        "It was One of the last things",
        "One of the last.",
        "One of the last,",
        "One of the last:",
        "One of the last;",
        "One of the last!",
        "One of the last?",
        "One of the last-",
        "One of the last",
        //////////////////////////////////////////
        "One of the lasting", // false
        "", // false
        "blah", // false
        "ne of the last" // false
      ];

      matching = tests.filter(p => phraseRE.test(p));
      assert.equal(matching.length, tests.length-4);

      phrase = "of the last,";
      phraseRE = new RegExp(rePre+phrase+rePost);
      tests = [
        " One of the last, things he did.",
        "One of the last, things he did.",
        "One of the last,, he did.",
        "One of the last,: he did.",
        "One of the last,; he did.",
        "It was One of the last,",
        "It was One of the last, things",
        "One of the last,.",
        "One of the last,,",
        "One of the last,:",
        "One of the last,;",
        "One of the last,!",
        "One of the last,?",
        "One of the last,-",
        "One of the last,",
        //////////////////////////////////////////
        "One of the lasting", // false
        "", // false
        "blah", // false
        "Of the last" // false
      ];

      matching = tests.filter(p => phraseRE.test(p));
      assert.equal(matching.length, tests.length-4);
    });


    it('should annotate ending punctuation', function () {
      let gen = [
        'Her arms moved up now, no one knows, perhaps not at all, but a dream of you.',
        '<p>I was sitting at the table, she told me that I should not know.',
      ];
      let mm = annogram();
      let poem = mm.annotate(gen);
      //console.log(poem.meta);
      //assert.equal(1,2);
      let expected = [
        {
          "tokens": ["Her", "arms", "moved", "up", "now", ","],
          "sourceId": 95,
          "start": 0,
          "end": 2
        },
        {
          "tokens": ["up", "now", ",", "no", "one", "knows"],
          "sourceId": 484,
          "start": 3,
          "end": 5
        },
        {
          "tokens": [ "no", "one", "knows", ",", "perhaps", "not"],
          "sourceId": 491,
          "start": 6,
          "end": 8
        },
        {
          "tokens": [ ",", "perhaps", "not", "at", "all", ","],
          "sourceId": 412,
          "start": 9,
          "end": 11
        },
        {
          "tokens": [ "at", "all", ",", "but", "a"],
          "sourceId": 192,
          "start": 12,
          "end": 13
        },
        {
          "tokens": [ ",", "but", "a", "dream", "of"],
          "sourceId": 88,
          "start": 14,
          "end": 15
        },
        {
          "tokens": ["a", "dream", "of", "you", "."],
          "sourceId": 322,
          "start": 16,
          "end": 20
        },
        {
          "tokens": ["I", "was", "sitting", "at", "the"],
          "sourceId": 396,
          "start": 21,
          "end": 22
        },
        {
          "tokens": ["sitting","at", "the", "table", ","],
          "sourceId": 17,
          "start": 23,
          "end": 24
        },
        {
          "tokens": ["the","table",",","she"],
          "sourceId": 456,
          "start": 25,
          "end": 25
        },
        {
          "tokens": ["table", ",", "she", "told", "me"],
          "sourceId": 473,
          "start": 26,
          "end": 27
        },
        {
          "tokens": ["she", "told", "me", "that"],
          "sourceId": 473,
          "start": 28,
          "end": 28
        },
        {
          "tokens": ["told", "me", "that", "I", "should"],
          "sourceId": 356,
          "start": 29,
          "end": 30
        },
        {
          "tokens": ["that", "I", "should", "not"],
          "sourceId": 137,
          "start": 31,
          "end": 31
        },
        {
          "tokens": ["I", "should", "not", "know", "."],
          "sourceId": 131,
          "start": 32,
          "end": 36
        }
      ];
      // for (let i = 0; i < expected.length; i++) {
      //   console.log('checking '+i+' ---------------------');
      //   assert.deepEqual(poem.meta[i],expected[i]);
      // }
      assert.deepEqual(expected, poem.meta);
    });

    it('should annotate across sources1', function () {
      let gen = [
        'I will step out of the city.',
        '<p>My wife came in from the kitchen.',
      ];
      let mm = annogram();
      let poem = mm.annotate(gen);
      let poemText = mm.asText(poem);
      //console.log('\n' + poem.text + '\n\n' + poemText + '\n\n' + mm.asText(poem, 1));
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
      let poemText = mm.asText(poem);
      //console.log('\n' + poem.text + '\n\n' + poemText + '\n\n' + mm.asText(poem, 1));
      //mm.asLines(poem);
      assert.equal(poemText, poem.text.replace(/<p>/g, ''));
    });

    it('should annotate across sources3', function () {
      let gen = ['It was not a sparrow, he was alive.', 'He took one of them'];
      let mm = annogram();
      let poem = mm.annotate(gen);
      let poemText = mm.asText(poem);
      //console.log('\n' + poem.text + '\n\n' + poemText + '\n\n' + mm.asText(poem, 1));
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
      let poemText = mm.asText(poem);
      //console.log(poem.meta);
      //console.log('\n' + poem.text + '\n\n' + poemText + '\n\n' + mm.asText(poem, 1));
      //mm.asLines(poem);
      assert.equal(poemText, poem.text.replace(/<p>/g, ''));
    });
  });

  describe('#asText()', function () {

    it('should match provided poem text', function () {
      let gen = [
        'Her arms moved up now, no one knows, perhaps not at all, but a dream of you.',
        '<p>I was sitting at the table, she told me that I should not know.',
      ];
      let mm = annogram();
      let poem = mm.annotate(gen);
      let poemText = mm.asText(poem);
      assert.equal(poemText, poem.text.replace('<p>', ''));
    });

    it('should match generated poem text', function () {
      let mm = annogram();
      let poem = mm.generate(5, { minLength: 10 });
      assert.equal(mm.asText(poem), poem.text.replace('<p>', ''));
    });
  });

  describe('#asLines()', function () {

    it('should compute lines for poem', function () {
      let gen = [
        'The ice-machine couldn’t keep up, and I was going to die.',
        'The result is not a planet, but a woman, and the daughter of the house.',
      ];
      let mm = annogram();
      let poem = mm.annotate(gen);
      let pl = mm.asLines(poem);

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
      //console.log(poem.meta.length, expected.length);
      assert.deepEqual(pl, expected);
    });
    it('should handle line breaks without sources', function () {
      let gen = [
        'Her arms moved up now, no one knows, perhaps not at all, but a dream of you.',
        '<p>I was sitting at the table, she told me that I should not know.',
      ];
      let mm = annogram();
      let poem = mm.annotate(gen);
      let lines = mm.asLines(poem);
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


    it('should handle line breaks with sources', function () {
      let gen = [
        'Her arms moved up now, no one knows, perhaps not at all, but a dream of you.',
        '<p>I was sitting at the table, she told me that I should not know.',
      ];
      let mm = annogram();
      let poem = mm.annotate(gen);
      let lines = mm.asLines(poem, { addSources: true });
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
    it('should handle punctuation', function () {
      let gen = ['The ice-machine couldn’t keep up, and I was going to die.'];
      let mm = annogram();
      let poem = mm.annotate(gen);
      let pl = mm.asLines(poem);
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

  function annogram() {
    return new Annogram(4, poems, { maxLengthMatch: 7, RiTa });
  }
});