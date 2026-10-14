import { RiTa } from 'rita';

class Annogram {

  constructor(n, poems, opts = {}) {
    this.RiTa = opts.RiTa || RiTa;
    // The corpus carries mojibake (U+FFFD) from a bad encoding conversion — 1435
    // instances across 43 poems — which otherwise leaks straight into the output.
    // Sanitize once so the model and the source matched by _lookupSource agree.
    // Pass {sanitize:false} to keep the raw text.
    const { sanitize = true, ...modelOpts } = opts;
    // rita4 defaults temp to 1, which runs raw n-gram COUNTS through softmax as if
    // they were logits — exp(count) — so a token seen 5x gets ~148x the weight of
    // one seen once instead of 5x. That superlinear bias collapses generation onto
    // a few attractor sentences and amplifies rare mojibake tokens. temp 0 selects
    // plain count normalization, which is what rita 2.8.1 uses. Override via opts.
    modelOpts.temp ??= 0;
    const clean = sanitize === false ? poems : poems.map(p => Annogram.sanitize(p));
    this.source = clean;
    this.model = this.RiTa.markov(n, modelOpts);
    // Split each poem separately so every sentence is a substring of exactly one poem.text.
    // Joining with Annogram.lb first let the literal "<p>" leak into the sentence list,
    // producing ~806 sentences that match no source and crash annotate()/_lookupSource.
    let sentences = clean.flatMap(p => this.RiTa.sentences(p.text));
    this.model.addSentences(sentences);
    // sentenceStarts filtering is handled internally by rita4
  }

  // Replace runs of the Unicode replacement char (U+FFFD) with a single space,
  // then collapse any doubled spaces the removal may have created.
  static sanitize(poem) {
    return { ...poem, text: poem.text.replace(/\uFFFD+/g, ' ').replace(/  +/g, ' ') };
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

  generate(numSentences, opts) {
    let poem = this.model.generate({ numSentences, minLength: opts?.minLength || 10 });
    if (!poem || poem?.length !== numSentences) throw Error('bad poem generated: '+poem);
    
    return this.annotate(poem, { preserveSentenceBoundaries: true });
  }

  annotate(lines, { preserveSentenceBoundaries = false } = {}) {

    let n = this.model.n, dbug = true;
    let text = lines.join(' ');
    let words = preserveSentenceBoundaries
      ? lines.flatMap((line, i) => i
        ? [Annogram.lb, ...this.RiTa.tokenize(line)]
        : this.RiTa.tokenize(line))
      : this.RiTa.tokenize(text);
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
      let meta = poem.meta;
      if (meta.length === 0) return;
      if (meta.length === 1) {
        meta[0].end = meta[0].start + meta[0].tokens.length - 1;
        return;
      }
      let next;
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
        words.splice(i, 1); // delete LB instead of jumping over to calculate "start" correctly
        // Seed the window from the start of the new sentence, but stop at the next
        // boundary. A sentence shorter than n would otherwise pull the literal "<p>"
        // (or the following sentence) into the phrase we match against the source,
        // which can never match and crashes _lookupSource.
        let end = i;
        while (end < words.length && end - i < n && words[end] !== Annogram.lb) end++;
        tokens = words.slice(i, end);
        src = this._lookupSource(tokens, { text, index: i })[0];
        i = end - 1; // the loop's i++ lands on the first token not yet in the window
        continue;
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
      if (this.RiTa.isPunct(phrase[0])) {             // hide leading punct
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

      let thisSegment = document.createElement("span");
      thisSegment.classList.add("meta");
      //thisSegment.href = "javascript:void(0)";
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

  asLineAnimation(poem, opts = {}) {
    let targetDiv = document.createElement("div");
    targetDiv.classList.add("asLineAnimationContainer");
    let width = opts.width || 800;
    let height = opts.height || 250;
    targetDiv.style.width = width + "px";
    if (opts.autoScroll) {
      targetDiv.style.height = height + 'px';
    } else {
      targetDiv.style.minHeight = height + 'px';

    }
    opts.width = width;
    opts.height = height;
    this._animation(poem, targetDiv, opts);
    return targetDiv;
  }

  async _animation(poem, targetDiv, opts = {}) {
    let delayMs = opts.delayMs || 500;
    let fadeInMs = opts.fadeInMs || 100;
    let paragraphIndent = opts.paragraphIndent || 0;
    let warpIndent = opts.warpIndent || 8;
    let autoScroll = opts.autoScroll;
    let cleanLB = opts.cleanLB;
    const delay = function (n) {
      return new Promise(function (resolve) {
        setTimeout(resolve, n);
      });
    }

    const calculateMaxCharacterNoPerLine = function (font, w, debug) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext('2d');
      ctx.font = font;
      if (debug) console.log(ctx.font);
      let no = 1;
      while ((ctx.measureText(' '.repeat(no)).width) < w) {
        no++;
      }
      return no - 1;
    }

    const calculateMaxLineNo = function (firstLineSpan, h, debug) {
      let lineHeight = window.getComputedStyle(firstLineSpan).lineHeight;
      lineHeight = lineHeight.replace(/px/g, "");
      lineHeight = Math.ceil(parseFloat(lineHeight));
      let res = Math.floor(h / lineHeight);
      if (debug) console.log("Height: " + h + "; lineheihgt: " + lineHeight + "; Max Line no.: " + res);
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
    let displayedLineNo = 0;
    let currentCleanLBCursor = 0;

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
      //
      let line = lines[i];
      if (line[0] !== ' ') {
        currentWrapIndentCursor = 0;
        if (i > 0) {
          targetDiv.append(document.createElement("span"));
          targetDiv.append(document.createElement("br"));
          displayedLineNo++;
          if (autoScroll) {
            if (displayedLineNo > maxLineNo) {
              for (let idx = 0; idx < 2; idx++) {
                targetDiv.removeChild(targetDiv.firstChild);
              }
            }
          }
        }
        // clean LB
        if (/[^.?!]+[.!?][^.?!]+/.test(line.trim())) {
          let endPunctRE = /[.?!]/g;
          let arr;
          while ((arr = endPunctRE.exec(line)) !== null) {
            if (opts.debug) console.log("cleanLB: Found " + arr[0] + " at " + (endPunctRE.lastIndex - 1));
            currentCleanLBCursor = endPunctRE.lastIndex + 1;
          }
          if (opts.debug) console.log("CleanLB indent: " + currentCleanLBCursor + " units.");
        } else {
          currentCleanLBCursor = 0;
        }
      }

      // clean LB
      if (currentCleanLBCursor > 0) {
        line = line.substring(currentCleanLBCursor);
      }

      if (paragraphIndent > 0) {
        line = ' '.repeat(paragraphIndent) + line;
      }
      line = line.substring(currentWrapIndentCursor);
      if (line.length > characterPerLine) {
        let temArr = /^\s+/.exec(line);
        if (temArr) {
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
      let textDisplay = document.createElement('span');
      textDisplay.classList.add("meta");
      // textDisplay.href = "javascript:void(0)";
      let txt = line.replace(/^\s+/, "");

      let sourceDiv = this._createSourceDiv(txt, src);
      textDisplay.append(txt);
      textDisplay.append(sourceDiv);
      thisLineSpan.append(textDisplay);
      targetDiv.append(thisLineSpan);
      thisLineSpan.animate({ opacity: [0, 1] }, fadeInMs);
      if (i < lines.length - 1) targetDiv.append(document.createElement("br"));
      displayedLineNo++;
      if (autoScroll) {
        if (displayedLineNo > maxLineNo) {
          for (let idx = 0; idx < 2; idx++) {
            targetDiv.removeChild(targetDiv.firstChild);
          }
        }
      }
      await delay(delayMs);
    }
  }

  _lookupSource(tokens, dbugInfo) {
    let escapeForRegex = (str) => { // $& is entire match
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
    }
    let phrase = this.RiTa.untokenize(tokens);
    // Only require a word boundary on the edges when the phrase actually starts/
    // ends with a word char. A phrase ending in punctuation (e.g. "came from—")
    // is legitimately followed by a word char in the source ("from—in"), so
    // appending "(\\W|$)" there would reject a real match. This mirrors the
    // convention already used by _createSourceDiv.
    let rePre = this.RiTa.isPunct(phrase[0]) ? '' : '(^|\\W)';
    let rePost = this.RiTa.isPunct(phrase[phrase.length - 1]) ? '' : '(\\W|$)';
    let phraseRE = new RegExp(rePre + escapeForRegex(phrase) + rePost);
    let srcs = this.source.filter(p => phraseRE.test(p.text));
    if (!srcs || !srcs.length) throw Error("(" + dbugInfo.index
      + ") No source for \"" + phrase + "\"\nin\n" + dbugInfo.text);
    srcs.sort((a, b) => a.id - b.id);
    return srcs;
  }

  _createSourceDiv(txt, src, opts = {}) {
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
Annogram.VERSION = '0.16'//version; import {version} from './package.json';

export { Annogram };
