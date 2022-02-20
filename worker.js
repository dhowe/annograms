
importScripts('node_modules/rita/dist/rita.js');
importScripts('annogram-html.js');

let annogram;
this.onmessage = function (e) {
  let { poems, consOpts, genOpts } = e.data;
  annogram = annogram || new Annogram(4, poems, consOpts);
  let poem;
  while (!poem) {
    try {
      poem = annogram.generate(5, genOpts);
    }
    catch(e) {
      console.warn('[FAIL] '+e);
    }
  }
  //console.log('post: ', poem);
  this.postMessage({ poem });
};
