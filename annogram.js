import RiTa from 'rita';

class Annogram {

  constructor(n, poems, opts = {}) {
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

  generate(num, gopts = { minLength: 8 }) {
    let gen = this.model.generate(num, gopts);
    //gen.forEach((g, i) => console.log(i + ") " + g));
    return this.annotate(gen);
  }

  annotate(lines) {

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
      //console.log(`[#${meta.sourceId}]`, RiTa.untokenize(tokens));
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


  lookupSource(tokens, dbugInfo) {
    let phrase = RiTa.untokenize(tokens);
    let srcs = this.source.filter(p => p.text.includes(phrase));
    if (!srcs || !srcs.length) throw Error(`(${dbugInfo.index}) `
      + `No source for "${phrase}"\n\n${dbugInfo.text}`);
    srcs.sort((a, b) => a.id - b.id);
    return srcs;
  }

  printLines(poem) { // TODO: redo with original meta format
    let indent = 0, last, raw = '';
    for (let i = 0; i < poem.meta.length; i++) {
      let m = poem.meta[i];
      let str = RiTa.untokenize(m.tokens);
      if (i > 0) {
        let sliceAt = m.start - last.start;
        if (sliceAt < this.model.n) {// && !/[!.;:?]$/.test(str)) {
          let indentSlice = last.tokens.slice(0, sliceAt);
          indent += 1 + RiTa.untokenize(indentSlice).length;
          for (let i = 0; i < indent; i++) str = ' ' + str;
        }
        else {
          indent = 0;
        }
      }
      raw += (indent ? '' : '\n') + str + '\n';
      last = m;
    }
    console.log(raw);
    return raw;
  }
}

Annogram.lb = '<p>';

export default Annogram;
