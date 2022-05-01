import RiTa from 'rita';
//import RiTa from '../ritajs/dist/rita-micro';

let datadir = './data/gen-only/';
let files = [
  datadir + 'Penguin_Prose_Poems.json',
  datadir + 'Great_American_Prose_Poems.json',
  datadir + 'Short_An_International_Anthology.json',
  datadir + 'Anthology_of_Australian_Prose_Poetry.json',
  datadir + 'Modern_Poetry.json'
];

if (0) { // dbug;
  console.log(clean('‘Sort of fresh?’'));
  process.exit(1);
}

function clean(s) {
  return s
    .replace(/\.+/g, '.')
    .replace(/[”“()]/g, '')
    .replace(/(^|\s)+['`‘’]+/g, '$1')
    .replace(/[`'‘’]+($|\s)+/g, '$1')
    .replace(/((\r?\n)|<p>|\s+)+/g, ' ')
    .replace(/!/g, '.')
    .replace(/([A-Z]+)/g, '$1'.toLowerCase()); //?
}

function loadPoems() {
  let sentences = [], poems = [];
  files.forEach(f => poems.push(...require(f)));
  poems.filter(p => p.author !== 'Walt Whitman')
    .forEach(p => {
      let sents = RiTa.sentences(clean(p.text)).map(s => {
        let words = RiTa.tokenize(s);
        words.map(w => w.startsWith('I') ? w : w.toLowerCase());
        return RiTa.capitalize(RiTa.untokenize(words));
      });
      sentences.push(...sents);
    });
  return sentences.filter(s => s.split(' ').length > 2);
}

let sentences = loadPoems();
let fname = './data/sentences.json';
require('fs').writeFileSync(fname, JSON.stringify(sentences, 0, 2));
console.log('wrote ' + sentences.length + ' to ' + fname);