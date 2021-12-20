import RiTa from 'rita';

class Annogram {

  constructor(n, poems, opts = { trace: 0 }) {
    this.source = poems;
    opts.text = poems.map(p => p.text).join(Annogram.lb);
    //require('fs').writeFileSync('text.txt', opts.text); // tmp
    this.model = RiTa.markov(n, opts);
    this.model.sentenceStarts = this.model.sentenceStarts
      .filter(s => /^[A-Z]/.test(s));
  }

  display(poem, addSources) {
    let str = '';
    for (let i = 0; i < poem.meta.length; i++) {
      let m = poem.meta[i];
      let diff = m.tokens.length;
      if (i < poem.meta.length - 1) {
        let nextStart = poem.meta[i + 1].start;
        diff = nextStart - m.start;
      }
      let toks = m.tokens.slice(0, diff);
      let next = RiTa.untokenize(toks);
      if (str.length && !RiTa.isPunct(next[0])) str += ' ';
      str += next + (addSources ? `[#${m.sourceId}]` : '');
    }
    return str;
  }

  generate(num, gopts = { minLength: 8, greedy: 0 }) {
//this.trace = true;
    let gen = this.model.generate(num, gopts);
    //if (this.trace)
    gen.forEach((g, i) => console.log(i + ") " + g));
    return gopts.greedy ? this.annotateGreedy(gen) : this.annotate(gen);
  }

  annotate(lines, gopts) {

    let text = lines.join(' ');
    let words = RiTa.tokenize(text);
    let poem = { lines, text, tokens: words, meta: [] };
    let tlen = this.model.n - 1, tokens = [];

    let addMeta = (idx) => {
      let sourceId = -1;
      if (tokens.length > 1 || !RiTa.isPunct(tokens[0])) {
        sourceId = this.lookupSource(tokens, { text, index: 0 })[0].id;
      }
      poem.meta.push({ sourceId, tokens, start: (idx - tokens.length) + 1 });
      //if (this.trace) console.log(`[#${meta.sourceId}]`, RiTa.untokenize(tokens));
      tokens = [];
    }

    for (let i = 0; i < words.length; i++) {
      if (words[i] === Annogram.lb) {
        if (tokens.length) addMeta(i);
      }
      else {
        tokens.push(words[i]);
        if (tokens.length === tlen) addMeta(i);
      }
    }

    if (tokens.length) addMeta(words.length - 1); // last phrase
    return poem;
  }

  annotateGreedy(lines) {

    let n = this.model.n, dbug = true;
    let text = lines.join(' ');
    let words = RiTa.tokenize(text);
    let tokens = words.slice(0, n);
    let poem = { lines, text, tokens: words, meta: [] };
    let src = this.lookupSource(tokens, { text, index: 0 })[0];

    let addMeta = (idx) => {
      poem.meta.push({
        tokens,
        sourceId: src.id, 
        start: (idx - tokens.length)
      });
      if (this.trace) console.log(`g[#${src.id}]`, RiTa.untokenize(tokens));
      tokens = [];
    }

    for (let i = n; i < words.length; i++) {

      if (words[i] === Annogram.lb) {
        //if (tokens.length) addMeta(i);
        throw Error('TODO: handle line breaks')
      }

      tokens.push(words[i]);
      if (!src.text.includes(RiTa.untokenize(tokens))) {
        let next = tokens.slice(-n);
        tokens.pop();
        addMeta(i);

        // find n-length source for the next phrase
        src = this.lookupSource(tokens = next, { text, index: i })[0];
      }
    }

    if (tokens.length) addMeta(words.length);

    return poem;
  }

  lookupSource(tokens, dbugInfo) {
    let phrase = RiTa.untokenize(tokens);
    let srcs = this.source.filter(p => p.text.includes(phrase));
    if (!srcs || !srcs.length) throw Error(`(${dbugInfo.index}) `
      + `No source for "${phrase}"\n\n${dbugInfo.text}`);
    srcs.sort((a, b) => a.id - b.id);
    return srcs;
  }

  asLines(poem) {
    let indent = 0, result = [], last;
    for (let i = 0; i < poem.meta.length; i++) {
      let m = poem.meta[i];
      let phrase = RiTa.untokenize(m.tokens);
      if (i > 0) {
        let sliceAt = m.start - last.start;
        if (sliceAt < this.model.n) {
          let indentSlice = last.tokens.slice(0, sliceAt);
          let slice = RiTa.untokenize(indentSlice);
          indent += slice.length + 1;
          if (/^[',;:']/.test(phrase)) { // hide leading punctuation
            phrase = ' '+ phrase.slice(1);
            indent -= 1;
          } 
          for (let j = 0; j < indent; j++) phrase = ' ' + phrase;
        }
        else {
          indent = 0;
        }
      }
      result.push(phrase);
      last = m;
    }
    
    return result;
  }

}

Annogram.lb = '<p>';

export default Annogram;
