//import RiTa from 'rita';
import RiTa from '../ritajs/dist/rita-micro';

let datadir = './data/gen-only/';

function clean(s) {
  return s
  .replace(/[”“()]/g, '')
  .replace(/((\r?\n)|<p>|[\s])+/g, ' ')
  .replace(/(^[`‘’']|[`‘’']\s|\s[`‘’'])/g, ' ')
  .replace(/[`‘’']([?.!])/g, '$1')
  .replace(/[`‘’']([!?.,:;])/g, '$1')
  .replace(/!/g, '.');
}

function loadPoems() {

  let data = [].concat(
    require(datadir+'Penguin_Prose_Poems.json'),
    // require('Great_American_Prose_Poems.json'),
    // require('Short_An_International_Anthology.json'),
    // require('Anthology_of_Australian_Prose_Poetry.json'),
    // require('Modern_Poetry.json'),
  ).map((p, i) => {

    let stop = 0;
    let text = clean(p.text);
    //let minSentenceLength = 7;
    let sents = RiTa.sentences(text);
    sents = sents.filter(s => s.split(' ').length > 2);
    sents = sents.map(s => {
      let words = RiTa.tokenize(s);
      words.map(w => w.startsWith('I') ? w : w.toLowerCase());
      return RiTa.capitalize(RiTa.untokenize(words));
    });
    console.log('-'.repeat(38)+' #'+i+' '+'-'.repeat(38));
    sents.forEach((s, k) => {
      if (!stop) console.log(k + ")", s);
      else if (k === stop) {
        console.log(k + ")", s);
        //console.log('\n\n' + origTxt);
        process.exit(1);
      }
    });

    //require('fs').writeFileSync('sentences.json', JSON.stringify(sents,0,2));
    p.id = i;
    p.text = sents.join(' ');
    return p;
  });
  return data;
}

let poems = loadPoems();
//console.log(clean('It was 19,700 square inches, the equivalent of 409 A5 pages.'));
if (0) {
  let fname = "poems-html.json";
  require('fs').writeFileSync(fname, JSON.stringify(poems));
  console.log('Wrote ' + poems.length + ' poems to ' + fname);
}

//export default poems;