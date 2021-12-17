//let RiTa = require('rita'); // npm
//let RiTa = require('../ritajs/src/rita').default; // src
//let MetaMarkov = require('./meta-markov').default;

import RiTa from '../ritajs/src/rita';
import MetaMarkov from './meta-markov';

//////////////////////////////////////////////////////////////////////

let poems = [].concat(
  require('./data/Penguin_Prose_Poems.json'),
  require('./data/Great_American_Prose_Poems.json'),
  require('./data/Short_An_International_Anthology.json')
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


function display(poem, format/* [md, html] */) {

  let raw = '', idx = 1, cursor = 0;
  for (let i = 0; i < poem.meta.length; i++) {
    let m = poem.meta[i];
    let pid = poem.id;
    let toks = m.tokens.slice(cursor - m.start);
    let src = poems.find(p => p.id === m.sourceId);
    //console.log(src);
    if (!src) throw Error('No source for sourceId #' + m.sourceId);
    let next = RiTa.untokenize(toks);
    if (raw.length && !RiTa.isPunct(next[0])) raw += ' ';
    if (format && format.toLowerCase() === 'md') {
      raw += `[${next}](/sources?id=${src.id}&idx=${m.start})`;
    }
    else if (format && format.toLowerCase() === 'html') {
      raw += `<a href class="meta">${next}<sup>${src.id}</sup></a>`;
    }
    else {
      raw += `${next}[#${src.id}]`;
    }
    cursor += toks.length;
  };

  return raw.trim();
}

let mm = new MetaMarkov(4, poems, { maxLengthMatch: 7, trace: 0 });
let poem = mm.generate(5, { minLength: 10 });
console.log('\n' + poem.text);
console.log('\n' + display(poem));