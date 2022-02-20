import RiTa from 'rita';

function loadPoems() {
  let data = [].concat(
    require('./data/Penguin_Prose_Poems.json'),
    require('./data/Great_American_Prose_Poems.json'),
    require('./data/Short_An_International_Anthology.json'),
    require('./data/Anthology_of_Australian_Prose_Poetry.json'),
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
  return data;
}

let poems = loadPoems();
export default poems;