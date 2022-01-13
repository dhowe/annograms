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
        i++; // skip the LB
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

      let sourceDiv = document.createElement("div");
      sourceDiv.classList.add("source");
      sourceDiv.id = "source" + i;
      let regexStr = nextForSourceSearch.replace(/[.*+?^{}$()|[\]\\]/g, '\\$&');
      if (/[A-Za-z]/.test(nextForSourceSearch[0])) regexStr = "(?<![A-Za-z])" + regexStr;
      if (/[A-Za-z]/.test(nextForSourceSearch[nextForSourceSearch.length - 1])) regexStr += "(?![A-Za-z])";

      const regex = new RegExp(regexStr);
      let inOriginIndexFrom = (regex.exec(src.text)) ? (regex.exec(src.text)).index : src.text.indexOf(nextForSourceSearch);
      let inOriginIndexTo = inOriginIndexFrom + nextForSourceSearch.length;
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
      nextSpan.append(nextForSourceSearch);
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
    targetDiv.style.height = height + "px";
    targetDiv.style.maxHeight = height + 'px';
    targetDiv.style.width = width + "px";
    targetDiv.style.maxWidth = width + 'px';
    opts.width = width;
    this._animation(poem, targetDiv, opts);
    return targetDiv;
  }

  // TODO: re-implement with new annotations, remove styling, add options parameter
  async _animation(poem, targetDiv, opts={}) {
    let delayMs = opts.delayMs || 500;
    let fadeInMs = opts.fadeInMs || 100;
    let paragraphIndent = opts.paragraphIndent || 0;
    let warpIndent = opts.warpIndent || 8;
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
      while((ctx.measureText(' '.repeat(no)).width) < w * 0.8 ) {
        //if (debug) console.log("textW: " + ctx.measureText(' '.repeat(no)).width + ", divWidth: " + w);
        no ++;
      }
      return no;
    }
    const lines = this.asLines(poem);
    if (lines.length !== poem.meta.length) throw Error("Invaild lines from poem")
    let targetFont;
    let temElement = document.createElement("span");
    temElement.classList.add("animatedLine");
    temElement.append("Test");
    targetDiv.append(temElement);
    targetFont = window.getComputedStyle(temElement).getPropertyValue("font-size") + " " + window.getComputedStyle(temElement).getPropertyValue("font-family"); 
    const characterPerLine = calculateMaxCharacterNoPerLine(targetFont, opts.width, opts.debug);
    if (opts.debug) console.log("characterPerLine: " + characterPerLine);

    while (targetDiv.firstChild) {
      targetDiv.removeChild(targetDiv.firstChild);
    }

    let currentWrapIndentCursor = 0;

    for (let i = 0; i < lines.length; i++) {

      // wrap and indent
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

      let sourceDiv = document.createElement("div");
      sourceDiv.classList.add("source");
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

      sourceDiv.append(...spans);

      // handle titles starting with 'from'
      let title = src.title.trim().replace(/^[Ff]rom /, '');
      let footnotePara = document.createElement("p");
      footnotePara.classList.add("sourceFootnote");
      footnotePara.innerHTML = "from <i>" + title + "</i> by " + src.author;
      sourceDiv.append(footnotePara);

      textDisplay.append(txt);
      textDisplay.append(sourceDiv);
      thisLineSpan.append(textDisplay);
      targetDiv.append(thisLineSpan);
      thisLineSpan.animate({ opacity: [0, 1] }, fadeInMs);
      if (i < lines.length - 1) targetDiv.append(document.createElement("br"));
      //TODO: auto scroll?
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

}

Annogram.lb = '<p>';
Annogram.VERSION = '0.12'//version; import {version} from './package.json';

export { Annogram };
