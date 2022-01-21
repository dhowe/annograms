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

  asText(poem, addSources) {
    return poem.meta.reduce((acc, c, i, a) => {
      let toks = c.tokens.slice(0, c.end - c.start + 1);
      if (this.RiTa.isPunct(toks[0])) acc = acc.trim();
      return acc + this.RiTa.untokenize(toks)
        + (addSources ? '[#' + c.sourceId + ']' : '')
        + (i < a.length - 1 ? ' ' : '');
    }, '');
  }

  generate(num, opts = { minLength: 8, greedy: 0 }) {
    let poem = this.model.generate(num, opts);
    return this.annotate(poem, opts);
  }

  annotate(lines) {

    let n = this.model.n, dbug = true;
    let text = lines.join(' ');
    let words = this.RiTa.tokenize(text);
    let tokens = words.slice(0, n);
    let poem = { lines, text, tokens: words, meta: [] };
    let src = this._lookupSource(tokens, { text, index: 0 })[0];

    let addMeta = (idx) => {
      poem.meta.push({
        tokens,
        sourceId: src.id,
        start: (idx - tokens.length)
      });
      //console.log("g[#"+src.id+"]", this.RiTa.untokenize(tokens));
      tokens = [];
    }

    const appendEndMarkers = () => {
      let meta = poem.meta, next;
      for (let i = 0; i < meta.length - 1; i++) {
        let curr = meta[i];
        next = meta[i + 1];
        curr.end = next.start - 1;
      }
      next.end = next.start + next.tokens.length - 1;
    }

    for (let i = n; i < words.length; i++) {

      if (words[i] === Annogram.lb) {
        if (tokens.length) addMeta(i);
        words.splice(i,1); // delete LB instead of jumping over to calculate "start" correctly
        tokens = words.slice(i, i + n);
        src = this._lookupSource(tokens, { text, index: i })[0];
        i += n;
      }

      tokens.push(words[i]);
      if (!src.text.includes(this.RiTa.untokenize(tokens))) {
        let next = tokens.slice(-n);
        tokens.pop();
        addMeta(i);

        // find n-length source for the next phrase
        src = this._lookupSource(tokens = next, { text, index: i })[0];
      }
    }

    if (tokens.length) addMeta(words.length);

    appendEndMarkers();

    return poem;
  }

  asLines(poem, { addSources = false/*, maxLineLength = 60*/ } = {}) {
    let indent = 0, result = [], last, isNewline, isContline;
    for (let i = 0; i < poem.meta.length; i++) {
      let m = poem.meta[i];
      let phrase = this.RiTa.untokenize(m.tokens);
      if (/^[,;:.]/.test(phrase)) {             // hide leading punct
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

  asHtml(poem) { 
    let cursor = 0;
    let resultDiv = document.createElement("div");
    resultDiv.classList.add("display");
    let noBreakWrap;

    for (let i = 0; i < poem.meta.length; i++) {
      let m = poem.meta[i];

      // Note that some meta elements may have id = -1
      // which means they shouldn't get a highlight
      if (m.sourceId < 0) throw Error('TODO: handle sourceId == -1');

      let toks = m.tokens.slice(cursor - m.start);
      let src = this.source.find(p => p.id === m.sourceId);
      if (!src) throw Error('No source for sourceId #' + m.sourceId);

      let next = this.RiTa.untokenize(toks);
      let nextForSourceSearch = this.RiTa.untokenize(m.tokens);
      if (!this.RiTa.isPunct(next[0])) resultDiv.append(' ');

      let sourceDiv = this._createSourceDiv(nextForSourceSearch, src);

      let thisSegment = document.createElement("a");
      thisSegment.classList.add("meta");
      thisSegment.href = "javascript:void(0)";
      thisSegment.append(next);
      thisSegment.append(sourceDiv);
      //prevent lb on punctuations
      let nextToks = i < poem.meta.length - 1 ? poem.meta[i + 1].tokens.slice
        (cursor + toks.length - poem.meta[i + 1].start) : undefined;
      if (nextToks && this.RiTa.isPunct(this.RiTa.untokenize(nextToks)[0])) {
        if (typeof noBreakWrap === "undefined") {
          noBreakWrap = document.createElement("span");
          noBreakWrap.classList.add("noBreakWrap");
        }
        noBreakWrap.append(thisSegment);
      } else if (typeof noBreakWrap !== "undefined") {
        noBreakWrap.append(thisSegment);
        resultDiv.append(noBreakWrap);
        noBreakWrap = undefined;
      } else {
        resultDiv.append(thisSegment);
      }

      cursor += toks.length;
    }

    return resultDiv;
  }

  asLineAnimation(poem, opts={}){
    let targetDiv = document.createElement("div");
    targetDiv.classList.add("asLineAnimationContainer");
    let width = opts.width || 800;
    let height = opts.height || 400;
    targetDiv.style.height = height + 'px';
    targetDiv.style.width = width + "px";
    opts.width = width;
    opts.height = height;
    this._animation(poem, targetDiv, opts);
    return targetDiv;
  }

  async _animation(poem, targetDiv, opts={}) {
    let delayMs = opts.delayMs || 500;
    let fadeInMs = opts.fadeInMs || 100;
    let paragraphIndent = opts.paragraphIndent || 0;
    let warpIndent = opts.warpIndent || 8;
    let autoScroll = opts.autoScroll;
    const delay = function (n) {
      return new Promise(function (resolve) {
        setTimeout(resolve, n);
      });
    }

    const calculateMaxCharacterNoPerLine = function(font, w, debug) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext('2d');
      ctx.font = font;
      if (debug) console.log(ctx.font);
      let no = 1;
      while((ctx.measureText(' '.repeat(no)).width) < w ) {
        no ++;
      }
      return no - 1;
    }

    const calculateMaxLineNo = function(firstLineSpan, h, debug){
      let lineHeight = window.getComputedStyle(firstLineSpan).lineHeight;
      lineHeight = lineHeight.replace(/px/g, "");
      lineHeight = parseFloat(lineHeight);
      let res =  Math.floor(h/lineHeight);
      if (debug) console.log("Max Line no.: " + res);
      return res;
    }

    const lines = this.asLines(poem);
    if (lines.length !== poem.meta.length) throw Error("Invaild lines from poem")
    let targetFont;
    let characterPerLine = Number.MAX_SAFE_INTEGER;
    let maxLineNo = Number.MAX_SAFE_INTEGER;

    while (targetDiv.firstChild) {
      targetDiv.removeChild(targetDiv.firstChild);
    }

    let currentWrapIndentCursor = 0;

    for (let i = 0; i < lines.length; i++) {

      // wrap and indent
      if (i === 1) {
        let computedStyle = window.getComputedStyle(targetDiv.firstChild);
        targetFont = computedStyle.getPropertyValue("font-size") + " " + computedStyle.getPropertyValue("font-family");
        characterPerLine = calculateMaxCharacterNoPerLine(targetFont, opts.width, opts.debug);
        if (autoScroll) {
          maxLineNo = calculateMaxLineNo(targetDiv.firstChild, opts.height, opts.debug);
        }
      }
      let line = lines[i];
      if (line[0] !== ' ') {
        currentWrapIndentCursor = 0;
        if (i > 0) {
          targetDiv.append(document.createElement("br"));
        }
      }
      if (paragraphIndent > 0) {
        line = ' '.repeat(paragraphIndent) + line;
      }
      line = line.substring(currentWrapIndentCursor);
      if (line.length > characterPerLine) {
        let temArr = /^\s+/.exec(line);
        if (temArr){
          let totalSpaceLength = temArr[0].length;
          line = line.substring(totalSpaceLength - (paragraphIndent + warpIndent));
          currentWrapIndentCursor += totalSpaceLength - (paragraphIndent + warpIndent);
        }
      }

      const meta = poem.meta[i];
      if (meta.sourceId < 0) throw Error('TODO: handle sourceId == -1');
      let src = this.source.find(p => p.id === meta.sourceId);
      if (!src) throw Error('No source for sourceId #' + meta.sourceId);

      let thisLineSpan = document.createElement("span");
      thisLineSpan.classList.add("animatedLine");
      let execArr = /^\s+/.exec(line);
      if (execArr) thisLineSpan.append(execArr[0]);
      let textDisplay = document.createElement('a');
      textDisplay.classList.add("meta");
      textDisplay.href = "javascript:void(0)";
      let txt = line.replace(/^\s+/, "");

      let sourceDiv = this._createSourceDiv(txt,src);
      textDisplay.append(txt);
      textDisplay.append(sourceDiv);
      thisLineSpan.append(textDisplay);
      targetDiv.append(thisLineSpan);
      thisLineSpan.animate({ opacity: [0, 1] }, fadeInMs);
      if (i < lines.length - 1) targetDiv.append(document.createElement("br"));
      if (autoScroll) {
        if (i > maxLineNo - 1) {
          for (let index = 0; index <2; index++) {
            targetDiv.removeChild(targetDiv.firstChild);
          }
        }
      }
      await delay(delayMs);
    }
  }

  _lookupSource(tokens, dbugInfo) {
    let phrase = this.RiTa.untokenize(tokens);
    let srcs = this.source.filter(p => p.text.includes(phrase));
    if (!srcs || !srcs.length) throw Error("(" + dbugInfo.index +") No source for \"" + phrase + "\"\n\n" + dbugInfo.text);
    srcs.sort((a, b) => a.id - b.id);
    return srcs;
  }

  _createSourceDiv(txt, src, opts={}){
    let res = document.createElement("div");
    res.classList.add("source");
    let regexStr = txt.replace(/[.*+?^{}$()|[\]\\]/g, '\\$&');
    if (/[A-Za-z]/.test(txt[0])) regexStr = "(?<![A-Za-z])" + regexStr;
    if (/[A-Za-z]/.test(txt[txt.length - 1])) regexStr += "(?![A-Za-z])";

    const regex = new RegExp(regexStr);
    let inOriginIndexFrom = (regex.exec(src.text))
      ? (regex.exec(src.text)).index : src.text.indexOf(txt);
    let inOriginIndexTo = inOriginIndexFrom + txt.length;
    // 140 characters before and after
    const targetCharacterNo = 140;
    let before = "", beforeStartIndex = inOriginIndexFrom - 1, addedCharacterCount = 0;
    let after = "", afterStartIndex = inOriginIndexTo;
    while (addedCharacterCount < targetCharacterNo) {
      if (beforeStartIndex < 0 && afterStartIndex > src.text.length - 1) {
        break;
      }
      if (beforeStartIndex >= 0) {
        before = src.text[beforeStartIndex] + before;
        addedCharacterCount++;
        beforeStartIndex--;
      }
      if (addedCharacterCount >= targetCharacterNo) break;
      if (afterStartIndex <= src.text.length - 1) {
        after += src.text[afterStartIndex];
        afterStartIndex++;
        addedCharacterCount++;
      }
    }

    if (beforeStartIndex > 0) {
      before = before.replace(/^\S*\s/, "... ");
    } else if (beforeStartIndex === 0) {
      before = src.text[0] + before;
    }

    if (afterStartIndex < src.text.length - 1) {
      after = after.replace(/\s+\S*$/, " ...");
    } else if (afterStartIndex === src.text.length - 1) {
      after += src.text[src.text.length - 1];
    }

    let spans = [];
    let beforeSpan = document.createElement("span");
    beforeSpan.classList.add("sourceText");
    beforeSpan.append(before);
    spans.push(beforeSpan);
    let nextSpan = document.createElement("span");
    nextSpan.classList.add("sourceHighlight");
    nextSpan.append(txt);
    spans.push(nextSpan);
    let afterSpan = document.createElement("span");
    afterSpan.classList.add("sourceText");
    afterSpan.append(after);
    spans.push(afterSpan);

    res.append(...spans);

    // handle titles starting with 'from'
    let title = src.title.trim().replace(/^[Ff]rom /, '');
    let footnotePara = document.createElement("p");
    footnotePara.classList.add("sourceFootnote");
    let author = src.author;
    let sections = author.split(' ');
    for (let i = 0; i < sections.length; i++) {
      let word = sections[i];
      if (/^[A-Z\u00C0-\u00DC-’]+$/.test(word)) {
        sections[i] = word[0] + (word.substring(1)).toLowerCase();
      }
    }
    author = sections.join(' ');
    
    footnotePara.innerHTML = "from <i>" + title + "</i> by " + author;
    res.append(footnotePara);
    return res;
  }

}

Annogram.lb = '<p>';
Annogram.VERSION = '0.13'//version; import {version} from './package.json';

export { Annogram };
