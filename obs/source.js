function _1(md) {
  return (
    md`# Annograms
N-gram generation from a small corpus of prose poems, with each generated phrase annotated with the extended context where it was found.
`
  )
}

function _2(html) {
  return (
    html`
<div class="rc">
<h3>&nbsp;&nbsp;&nbsp;Related Resources</h3>
<ul>
<li>Generating with <a href="./tut-rita-ngrams" target="new">RiTa n-grams</a></li>
<li>The <a href="./the-rita-reference">RiTa reference</a> in observable</li>
<li><a href="https://rednoise.org/rita" target="new">RiTa on the web</a>: examples, docs, gallery, etc.</li>
</div>
<style>
.rc {
  border-radius: 25px;
  border: 2px solid #000;
  padding: 20px 0px 10px 20px;
  width: 400px;
  font-size: .8em;
}
</style>

`
  )
}

function _genbutton(Inputs) {
  return (
    Inputs.button("regenerate")
  )
}

function _checkbox(Inputs) {
  return (
    Inputs.checkbox(["annotations"], { value: ["annotations"] })
  )
}

function _5(md) {
  return (
    md`<small>_mouse-over phrases to view annotations_</small>`
  )
}

function _6(annogram, poem) {
  return (
    annogram.asLineAnimation(poem, { autoScroll: true, cleanLB: true })
  )
}

function _7(md) {
  return (
    md`----------`
  )
}

function _8(annogram, poem) {
  return (
    annogram.asHtml(poem)
  )
}

function _poem(genbutton, annogram) {
  genbutton;
  let result;
  while (!result) {
    try {
      result = annogram.generate(5);
    }
    catch (e) {
      console.warn('[FAIL] ' + e);
    }
  }
  return result;
}


function _annogram(Annogram, data, RiTa) {
  return (
    new Annogram(4, data, { maxLengthMatch: 7, trace: 0, RiTa })
  )
}

function _11(md) {
  return (
    md`---

## Appendix`
  )
}

function _12(Annogram) {
  return (
    Annogram.VERSION
  )
}

async function _Annogram() {
  const res = await fetch("https://raw.githubusercontent.com/dhowe/annograms/main/annogram.js");
  const newBlob = new Blob([(await res.text())], { type: 'text/javascript' });
  let Annogram = (await import(URL.createObjectURL(newBlob))).Annogram;

  Annogram.lb = '<p>';
  return Annogram;
}


async function _14(checkbox, html) {
  const res = await fetch("https://raw.githubusercontent.com/dhowe/annograms/main/example.css");
  let text = await res.text();
  if (checkbox.length < 1) {
    text += ".source {display:none}";
  } else {
    text += ".meta:hover {text-decoration: underline; cursor:pointer}"
  }
  return html`<style>${text}</style>`
}


function _data(raw, RiTa) {
  return (
    raw.flat().map((p, i) => {
      let text = p.text
        .replace(/[”“()]/g, '')
        .replace(/((\r?\n)|<p>|[\s])+/g, ' ')
        .replace(/(^[`‘’']|[`‘’']\s|\s[`‘’'])/g, ' ')
        .replace(/[`‘’']([!?.])$/, '$1')
        .replace(/!/, '.')
        .replace(/:/, ',');

      //let minSentenceLength = 7;
      let sents = RiTa.sentences(text);
      sents.map(s => {
        let words = RiTa.tokenize(s);
        words.map(w => (w.startsWith('I') ? w : w.toLowerCase()));
        return RiTa.capitalize(RiTa.untokenize(words));
      });
      p.id = i;
      p.text = sents.join(' ');
      return p;
    })
  )
}

function _raw(d3) {
  return (
    Promise.all(
      [
        'https://raw.githubusercontent.com/dhowe/annograms/main/data/Penguin_Prose_Poems.json',
        'https://raw.githubusercontent.com/dhowe/annograms/main/data/Great_American_Prose_Poems.json',
        'https://raw.githubusercontent.com/dhowe/annograms/main/data/Short_An_International_Anthology.json',
        'https://raw.githubusercontent.com/dhowe/annograms/main/data/Anthology_of_Australian_Prose_Poetry.json'
      ].map(url => d3.json(url))
    )
  )
}

function _RiTa(require) {
  return (
    require('rita@2.8.31')
  )
}

function _18(RiTa) {
  return (
    RiTa.VERSION
  )
}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["html"], _2);
  main.variable(observer("viewof genbutton")).define("viewof genbutton", ["Inputs"], _genbutton);
  main.variable(observer("genbutton")).define("genbutton", ["Generators", "viewof genbutton"], (G, _) => G.input(_));
  main.variable(observer("viewof checkbox")).define("viewof checkbox", ["Inputs"], _checkbox);
  main.variable(observer("checkbox")).define("checkbox", ["Generators", "viewof checkbox"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _5);
  main.variable(observer()).define(["annogram", "poem"], _6);
  main.variable(observer()).define(["md"], _7);
  main.variable(observer()).define(["annogram", "poem"], _8);
  main.define("initial poem", ["genbutton", "annogram"], _poem);
  main.variable(observer("mutable poem")).define("mutable poem", ["Mutable", "initial poem"], (M, _) => new M(_));
  main.variable(observer("poem")).define("poem", ["mutable poem"], _ => _.generator);
  main.variable(observer("annogram")).define("annogram", ["Annogram", "data", "RiTa"], _annogram);
  main.variable(observer()).define(["md"], _11);
  main.variable(observer()).define(["Annogram"], _12);
  main.variable(observer("Annogram")).define("Annogram", _Annogram);
  main.variable(observer()).define(["checkbox", "html"], _14);
  main.variable(observer("data")).define("data", ["raw", "RiTa"], _data);
  main.variable(observer("raw")).define("raw", ["d3"], _raw);
  main.variable(observer("RiTa")).define("RiTa", ["require"], _RiTa);
  main.variable(observer()).define(["RiTa"], _18);
  return main;
}
