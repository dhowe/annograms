import RiTa from 'rita';

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

  printLines(poem) {
    let indent = 0, last;
    for (let i = 0; i < poem.meta.length; i++) {
      let m = poem.meta[i];
      let str = RiTa.untokenize(m.tokens);
      if (i > 0) {
        let sliceAt = m.start - last.start;
        if (sliceAt < this.model.n) {
          let indentSlice = last.tokens.slice(0, sliceAt);
          indent += 1 + RiTa.untokenize(indentSlice).length;
          for (let i = 0; i < indent; i++) str = ' ' + str;
        }
        else {
          indent = 0;
        }
      }
      if (!indent) console.log();
      console.log(str);
      last = m;
    }
  }

  display(poem, addSources) {
    let str = '';
    for (let i = 0; i < poem.meta.length; i++) {
      let m = poem.meta[i];
      let diff = m.tokens.length;
      if (i < poem.meta.length - 1) {
        let nextStart = poem.meta[i+1].start;
        diff = nextStart - m.start;
      }
      let toks = m.tokens.slice(0, diff);
      let next = RiTa.untokenize(toks);
      if (str.length && !RiTa.isPunct(next[0])) str += ' ';
      str += next + (addSources ? `[#${ m.sourceId }]`: '');
    }
    return str;
  }



  generate(num, gopts = { minLength: 8 }) {
    let gen = this.model.generate(num, gopts);
    gen.forEach((g, i) => console.log(i + ") " + g));
    if (Array.isArray(gen)) gen = gen.join(' ');
    return this._annotate(gen);//.replace(/<p>/g, '\n'));
  }

  _annotate(output) {

    let afterBreak = false;
    let n = this.model.n, i = n;
    let words = RiTa.tokenize(output);

    // start with first n tokens, find source
    let tokens = words.slice(0, n);
    let src = this._lookupSource(RiTa.untokenize(tokens), { output, index: 0 });
    let poem = { text: output, tokens: words, meta: [] };

    let addMeta = () => {
      //console.log(`"${p}" -> {pid: ${src.id}, tokens: ${len}}`);// '${src.title}' by ${src.author}`);
      let meta = {
        tokens: tokens,
        sourceId: src.id,
        start: (i - tokens.length)// + (afterBreak ? -1 : 0)
      };
      poem.meta.push(meta);
      afterBreak = false;
    };

    for (; i < words.length; i++) {
      if (words[i] === lb) {
        //this._addMeta(poem, tokens, src, i);
        addMeta(poem, tokens, src, i);
        tokens = words.slice(i + 1, i + 1 + n);
        src = this._lookupSource(RiTa.untokenize(tokens), { output, index: 0 });
        //console.log('hit', RiTa.untokenize(tokens));
        afterBreak = true;
        i += n + 1;
      }
      tokens.push(words[i]); // add next word

      // check if still the same src
      if (!src.text.includes(RiTa.untokenize(tokens))) {

        // if not we annotate with current src
        let next = tokens.slice(-n);
        tokens.pop();
        //this._addMeta(poem, tokens, src, i);
        addMeta();

        // find source for the next phrase
        src = this._lookupSource(RiTa.untokenize(tokens = next), { output, index: i });
      }
      //console.log('                 ' + tokens.length 
      //+ '   ' + RiTa.untokenize(tokens) + ' -> ' + src.id);
    }

    //this._addMeta(poem, tokens, src, i); // last phrase
    addMeta();

    return poem;
  }


  _lookupSource(phrase, dbugInfo) {
    // could be multiple sources, picking 1st for now
    let src = this.source.find(p => p.text.includes(phrase));
    if (!src) throw Error(`(${dbugInfo.index}) `
      + `No source for "${phrase}"\n\n${dbugInfo.output}`);
    //console.log('_lookupSource: ' + dbugInfo.index + '-' 
    //+ (dbugInfo.index + this.model.n - 1), phrase, '-> ' + source.id);
    return src;
  }
}

export default MetaMarkov;
