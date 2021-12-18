const lineReader = require('line-reader');
const linebreak = '\n', lbex = new RegExp('\w*' + linebreak + '\w*$');

// TODO: ellipses

const loadShortAnInternationalAnthology = function (log) {

  const source = 'Short_An_International_Anthology';
  const inpath = './text/Short_An_International_Anthology.txt';
  const outpath = './data/Short_An_International_Anthology.json';

  const authorRE = /^([A-Z\u00C0-\u00DC -]+) (\(.+\))/;
  const titleRE = /(.+(?:\b +.+)*)/;
  const closeRE = /^---$/;

  let text = '', current = { source }, records = [];
  lineReader.eachLine(inpath, (line, done) => {

    let hasAuthor = current.hasOwnProperty('author');
    let hasTitle = current.hasOwnProperty('title');

    // parse author / meta
    if (!hasAuthor) {
      let match = authorRE.exec(line);
      if (match) {
        current = { author: match[1], author_meta: match[2], source };
        hasAuthor = true;
      }
    }

    // parse title
    else if (hasAuthor && !hasTitle) {
      match = titleRE.exec(line);
      if (match) {
        let title = match[0];
        if (title !== 'NO_TITLE') current.title = title;
        hasTitle = true;
      }
    }

    // parse text
    else if (hasAuthor && hasTitle) {
      if (closeRE.test(line)) {
        current.text = cleanText(text);
        if (log) console.log(current);
        records.push(current);
        hasTitle = false;
        hasAuthor = false;
        current = {};
        text = '';
      }
      else if (line.length) { // add current line
        text += line;
      }
      else if (text.length && !text.endsWith(linebreak)) { // breaks
        text += linebreak;
      }
    }

    if (done) writeRecords(records, outpath);
  });
}

const loadGreatAmericanProsePoems = function (log) {

  const source = 'Great_American_Prose_Poems';
  const inpath = "./text/Great_American_Prose_Poems.txt";
  const outpath = "./data/Great_American_Prose_Poems.json";

  const authorRE = /^([A-Za-z\u00C0-\u00DC -’]+) (\((\d+|\?)\–?\d*\))/;
  const titleRE = /^ *(([\dA-Z][^ \n]*|with|without|a|an|as|the|for|from|and|nor|but|or|yet|so|at|around|by|in|on|after|along|for|from|of|to) *)+ *$/;
  const closeRE = /^\(([\w,]+ ?)\d+\)$/;
  const translateNoteRE = /Translated by[a-z ]+/;

  let text = "", current = { source: source }, records = [], last5Line = [], possibleTitle;
  lineReader.eachLine(inpath, (line, done) => {

    if (translateNoteRE.test(line)) { /* just ignore this line */ }

    else if (line.length === 0) {
      if (last5Line[0] !== undefined && last5Line[0].length === 0 && possibleTitle !== undefined) {
        current.title = possibleTitle;
        possibleTitle = undefined;
      }
    }

    else if (closeRE.test(line)) {
      current.text = cleanText(text);
      current.entry_meta = closeRE.exec(line)[0];
      records.push(current);
      if (log) console.log(current);
      if (!current.hasOwnProperty("title")) {
        if (possibleTitle) {
          current.text = possibleTitle + current.text;
          possibleTitle = undefined;
        }
        current.title = "UNTITLED";
      }
      bc_author = current.author;
      bc_author_meta = current.author_meta;
      current = { author: bc_author, author_meta: bc_author_meta, source: source };
      text = '';
      last5Line = [];
      possibleTitle = undefined;
    }

    else if (authorRE.test(line)) {
      let match = authorRE.exec(line);
      current.author = match[1];
      current.author_meta = match[2];
    }

    else if (titleRE.test(line)) {
      if (!current.hasOwnProperty("title") && !possibleTitle) {
        possibleTitle = titleRE.exec(line)[0];
      } else if (last5Line[0].length === 0 && last5Line[1].length === 0
        && last5Line[2].length === 0 && last5Line[3].length === 0
        && last5Line[4].length === 0) {

        current.text = cleanText(text);
        current.source = source;
        if (possibleTitle) {
          current.text = possibleTitle + current.text;
          possibleTitle = undefined;
        }
        if (!current.hasOwnProperty("title")) current.title = "UNTITLED";
        if (log) console.log(current);
        records.push(current);
        bc_author = current.author;
        bc_author_meta = current.author_meta;
        current = {
          author: bc_author,
          author_meta: bc_author_meta,
          title: titleRE.exec(line)[0],
          source: source
        };
        text = '';
      } else {
        text += line + linebreak;
      }
    }

    else if (line.length > 0) { // add current line
      if (!current.hasOwnProperty("title") && !possibleTitle) {
        possibleTitle = line;
      } else {
        text += line + linebreak;
      }
    }

    last5Line.unshift(line);
    if (last5Line.length > 5) last5Line.pop();

    if (done) writeRecords(records, outpath);
  });
}

const loadPenguinProsePoems = function (log) {

  const source = 'Penguin_Prose_Poems';
  const inpath = "./text/Penguin_Prose_Poems.txt";
  const outpath = "./data/Penguin_Prose_Poems.json";

  const wordRE = /\w+/;
  const capitalWordRE = /[A-Z][\w]*/;
  const authorRE = /(([A-Z]\w+ )+)(\(\d+\))/;

  let text = "", current = { source }, records = [];
  lineReader.eachLine(inpath, (line, done) => {
    let hasTitle = current.hasOwnProperty("title");

    if (line.length > 0) {
      if (!current.hasOwnProperty("title")) {
        if (capitalWordRE.test(line) || wordRE.test(line)) {
          current.title = line.trim();
          hasTitle = true;
        }

      } else if (authorRE.test(line)) {
        let match = authorRE.exec(line)
        current.text = cleanText(text);
        current.author = match[1].trim();
        current.entry_meta = match[3].trim();
        if (log) console.log(current);
        records.push(current);
        current = { source: source };
        hasTitle = false;
        text = "";

      } else {
        text += line + linebreak;
      }
    }

    if (done) writeRecords(records, outpath);
  });
}

function cleanText(txt) {
  return txt.replace(lbex, '').trim();
}

function validate(records) {
  let err = new Set();
  records.forEach(r => {
    ['author', 'title', 'text', 'source'].forEach(f => {
      if (!r.hasOwnProperty(f) || !r[f].length) err.add(r);
    });
  });
  return Array.from(err);
}

function writeRecords(records, file) {
  let errors = validate(records);
  if (errors.length) {
    //errors = errors.filter(e => e.text.length < 1);
    console.log(JSON.stringify(errors, 0, 2));
    console.log('Found ' + errors.length + '/' + records.length + ' bad records');
    return;
  }
  try {
    require('fs').writeFileSync(file, JSON.stringify(records, 0, 2));
  } catch (err) {
    console.error(err);
  }
}


loadShortAnInternationalAnthology(false);
loadGreatAmericanProsePoems(false);
loadPenguinProsePoems(false);

