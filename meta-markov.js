let RiTa = require('../ritajs/src/rita').default; // src
let lb = '<p>';
class MetaMarkov {

  constructor(n, poems, opts = {}) {
    this.source = poems;
    opts.text = poems.map(p => p.text).join(lb);
    //require('fs').writeFileSync('text.txt', opts.text); // tmp
    this.model = RiTa.markov(n, opts);
    this.model.sentenceStarts = this.model.sentenceStarts
      .filter(s => /^[A-Z]/.test(s));
  }

  generate(num, gopts = { minLength: 8 }) {
    let gen = this.model.generate(num, gopts);
    gen.forEach((g, i) => console.log(i + ") " + g));
    if (Array.isArray(gen)) gen = gen.join(' ');
    return this._annotate(gen);//.replace(/<p>/g, '\n'));
  }

  _annotate(output) {
    let n = this.model.n;
    let words = RiTa.tokenize(output);

    // start with first n tokens, find source
    let tokens = words.slice(0, n);
    let src = this._lookupSource(RiTa.untokenize(tokens), { output, index: 0 });
    let result = { text: output, tokens: words, meta: [] };

    let i = n;
    for (; i < words.length; i++) {
      if (words[i] === lb) {
        this._addMeta(result, tokens, src, i);
        tokens = words.slice(i + 1, i + 1 + n);
        src = this._lookupSource(RiTa.untokenize(tokens), { output, index: 0 });
        //console.log('hit', RiTa.untokenize(tokens));
        i += n + 1;
      }
      tokens.push(words[i]); // add next word
      
      // check if still the same src
      if (!src.text.includes(RiTa.untokenize(tokens))) {

        // if not we annotate with current src
        let next = tokens.slice(-n);
        tokens.pop();
        this._addMeta(result, tokens, src, i);

        // find source for the next phrase
        src = this._lookupSource(RiTa.untokenize(tokens = next), { output, index: i });
      }
      //console.log('                 ' + tokens.length + '   ' + RiTa.untokenize(tokens) + ' -> ' + src.id);
    }

    this._addMeta(result, tokens, src, i); // last phrase

    return result;
  }

  _addMeta(data, toks, src, index) {
    //console.log(`"${p}" -> {pid: ${src.id}, tokens: ${len}}`);// '${src.title}' by ${src.author}`);
    data.meta.push({
      tokens: toks,
      sourceId: src.id,
      start: index - toks.length
    });
  }

  _lookupSource(phrase, dbugInfo) {
    // could be multiple sources, picking 1st for now
    //if (phrase.endsWith('<p>')) {
    //phrase = phrase.replace(/<p>/, '');
    //console.log('stripped: ' + phrase);
    //}
    let source = this.source.find(p => p.text.includes(phrase));
    if (!source) throw Error(`(${dbugInfo.index}) `
      + `No source for "${phrase}"\n\n${dbugInfo.output}`);
    //console.log('_lookupSource: ' + dbugInfo.index + '-' 
    //+ (dbugInfo.index + this.model.n - 1), phrase, '-> ' + source.id);
    return source;
  }
}

export default MetaMarkov;
