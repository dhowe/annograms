import { Annogram } from './annogram.js';
import poems from './poems.js';
import { RiTa } from 'rita';

let mm = new Annogram(4, poems, { maxLengthMatch: 15, trace: 0, RiTa });
console.log('Model created');
console.log('Model n:', mm.model.n);
console.log('Model size:', mm.model.size());

try {
  let result = mm.model.generate({ numSentences: 3, minLength: 5 });
  console.log('Generate result type:', typeof result);
  console.log('Is array:', Array.isArray(result));
  console.log('Result:', Array.isArray(result) ? `Array[${result.length}]` : result);
  if (Array.isArray(result)) {
    result.forEach((s, i) => console.log(`  [${i}]: ${s}`));
  }
} catch (e) {
  console.log('Error:', e.message);
}
