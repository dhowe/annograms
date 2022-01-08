import { Annogram } from './annogram';
import poems from './poems';
import RiTa from 'rita';

let mm = new Annogram(4, poems, { maxLengthMatch: 7, trace: 0, RiTa });
let poem = mm.generate(5, { minLength: 10, greedy: true });
console.log(poem.lines);
console.log(mm.asLines(poem));
//console.log('\n' + poem.text + '\n\n' + poemText + '\n\n' + mm.display(poem, 1));
