import { Annogram } from './annogram.js';
import poems from './poems.js';
import {RiTa} from 'rita';

console.log("Annogram:" + Annogram.VERSION);
console.log("RiTa:" + RiTa.VERSION);

let mm = new Annogram(4, poems, { maxLengthMatch: 7, trace: 0, RiTa });
let poem = mm.generate(5, { minLength: 10 });

console.log('\n' + poem.text + '\n\n'  + mm.asText(poem, true));
//console.log(mm.asLines(poem));

