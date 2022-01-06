//import RiTa from 'rita';

class Annogram {

  constructor(n, poems, opts = {}) {

    this.source = poems;
    this.RiTa = opts.RiTa || RiTa;
    opts.text = poems.map(p => p.text).join(Annogram.lb);
    //require('fs').writeFileSync('text.txt', opts.text); // tmp
    this.model = this.RiTa.markov(n, opts);
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
      let next = this.RiTa.untokenize(toks);
      if (str.length && !this.RiTa.isPunct(next[0])) str += ' ';
      str += next + (addSources ? `[#${m.sourceId}]` : '');
    }
    return str;
  }

  generate(num, opts = { minLength: 8, greedy: 0 }) {
    let gen = this.model.generate(num, opts);
    //gen.forEach((g, i) => console.log(i + ") " + g));
    return this.annotate(gen, opts);
  }

  annotate(lines, opts = {}) {
    if (opts.greedy && opts.lazy) return {
      greedy: this.annotateGreedy(lines), lazy: this.annotateLazy(lines)
    };
    return opts.greedy ? this.annotateGreedy(lines) : this.annotateLazy(lines);
  }

  annotateLazy(lines) {

    let text = lines.join(' ');
    let words = this.RiTa.tokenize(text);
    let poem = { lines, text, tokens: words, meta: [] };
    let tlen = this.model.n - 1, tokens = [];

    let addMeta = (idx) => {
      let sourceId = -1;
      // skip if we have a single punct token
      if (idx === words.length - 1 || tokens.length > 1 || !this.RiTa.isPunct(tokens[0])) {
        sourceId = this.lookupSource(tokens, { text, index: 0 })[0].id;
        poem.meta.push({ sourceId, tokens, start: (idx - tokens.length) + 1 });
        tokens = [];
      }
      //console.log(`[#${meta.sourceId}]`, this.RiTa.untokenize(tokens));
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
    let words = this.RiTa.tokenize(text);
    let tokens = words.slice(0, n);
    let poem = { lines, text, tokens: words, meta: [] };
    let src = this.lookupSource(tokens, { text, index: 0 })[0];

    let addMeta = (idx) => {
      poem.meta.push({
        tokens,
        sourceId: src.id,
        start: (idx - tokens.length)
      });
      //console.log(`g[#${src.id}]`, this.RiTa.untokenize(tokens));
      tokens = [];
    }

    for (let i = n; i < words.length; i++) {

      if (words[i] === Annogram.lb) {
        if (tokens.length) addMeta(i);
        i++; // skip the LB
        tokens = words.slice(i, i + n);
        src = this.lookupSource(tokens, { text, index: i })[0];
        i += n;
      }

      tokens.push(words[i]);
      if (!src.text.includes(this.RiTa.untokenize(tokens))) {
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
    let phrase = this.RiTa.untokenize(tokens);
    let srcs = this.source.filter(p => p.text.includes(phrase));
    if (!srcs || !srcs.length) throw Error(`(${dbugInfo.index}) `
      + `No source for "${phrase}"\n\n${dbugInfo.text}`);
    srcs.sort((a, b) => a.id - b.id);
    return srcs;
  }

  asLines(poem, { addSources = false/*, maxLineLength = 60*/ } = {}) {
    let indent = 0, result = [], last, isNewline, isContline;
    for (let i = 0; i < poem.meta.length; i++) {
      let m = poem.meta[i];
      let phrase = this.RiTa.untokenize(m.tokens);
      if (/^[,;:]/.test(phrase)) {             // hide leading punct
        phrase = ' ' + phrase.slice(1);
        indent -= 1;
      }
      if (i > 0 && !isNewline && !isContline) { // calculate indent
        let sliceAt = m.start - last.start;
        let indentSlice = last.tokens.slice(0, sliceAt);
        let slice = this.RiTa.untokenize(indentSlice);
        indent += slice.length + 1;
        phrase = ' '.repeat(indent) + phrase;   // apply indent
      }
      else {
        indent = 0;
        if (isContline && !phrase.startsWith('  ')) phrase = '  ' + phrase;
      }
      isNewline = /[.!?]$/.test(phrase); // at line-end, break
      //isContline =/*  /[,;:]$/.test(phrase) && */ phrase.length > maxLineLength; 
      result.push(phrase);
      last = m;
    }

    if (addSources) result = result.map((r, i) => r = r + ' [#' + poem.meta[i].sourceId + ']')

    return result;
  }

  displayHtml(poem) {
    let cursor = 0, maxLineWidth = 70;
    let resultDiv = document.createElement("div");
    resultDiv.classList.add("display");

    for (let i = 0; i < poem.meta.length; i++) {
      let m = poem.meta[i];

      // Note that some meta elements may have id = -1
      // which means they shouldn't get a highlight
      if (m.sourceId < 0) throw Error('TODO: handle sourceId == -1');

      let toks = m.tokens.slice(cursor - m.start);
      let src = this.source.find(p => p.id === m.sourceId);
      if (!src) throw Error('No source for sourceId #' + m.sourceId);

      let next = this.RiTa.untokenize(toks);
      if (!this.RiTa.isPunct(next[0])) resultDiv.append(' ');

      let sourceDiv = document.createElement("div");
      sourceDiv.classList.add("source");
      sourceDiv.id = "source" + i;
      let regexStr = next.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (/[A-Za-z]/.test(next[0])) regexStr = "(?<![A-Za-z])" + regexStr;
      if (/[A-Za-z]/.test(next[next.length - 1])) regexStr += "(?![A-Za-z])";

      const regex = new RegExp(regexStr);
      let inOriginIndexFrom = (regex.exec(src.text)) ? (regex.exec(src.text)).index : src.text.indexOf(next);
      let inOriginIndexTo = inOriginIndexFrom + next.length;
      let before = "", beforeStartIndex = inOriginIndexFrom - 1;

      while (beforeStartIndex >= 0 && !/[.?!]/.test(src.text[beforeStartIndex])) {
        if (src.text[beforeStartIndex] === ' ' && before.length > maxLineWidth) {
          before = "... " + before;
          break;
        }
        before = src.text[beforeStartIndex] + before;
        beforeStartIndex--;
      }

      let after = "", afterStartIndex = inOriginIndexTo;
      while (src.text[afterStartIndex] && !/[.?!]/.test(src.text[afterStartIndex])) {
        if (src.text[afterStartIndex] === ' ' && after.length > maxLineWidth) {
          break;
        }
        after += src.text[afterStartIndex];
        afterStartIndex++;
      }
      after += after.length > 70 ? " ..." : src.text[afterStartIndex];

      let spans = [];
      let beforeSpan = document.createElement("span");
      beforeSpan.classList.add("sourceText");
      beforeSpan.append(before);
      spans.push(beforeSpan);
      let nextSpan = document.createElement("span");
      nextSpan.classList.add("sourceHighlight");
      nextSpan.append(next);
      spans.push(nextSpan);
      let afterSpan = document.createElement("span");
      afterSpan.classList.add("sourceText");
      afterSpan.append(after);
      spans.push(afterSpan);

      sourceDiv.append(...spans);

      // handle titles starting with 'from'
      let title = src.title.trim().replace(/^[Ff]rom /, '');
      let footnotePara = document.createElement("p");
      footnotePara.classList.add("sourceFootnote");
      footnotePara.innerHTML = "from <i>" + title + "</i> by " + src.author;
      sourceDiv.append(footnotePara);

      let thisSegment = document.createElement("a");
      thisSegment.classList.add("meta");
      thisSegment.href = "javascript:void(0)";
      thisSegment.append(next);
      thisSegment.append(sourceDiv);
      resultDiv.append(thisSegment);

      cursor += toks.length;
    }

    return resultDiv;
  }
}

Annogram.lb = '<p>';

export { Annogram };
