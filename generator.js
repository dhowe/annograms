import { RiTa } from 'rita';
import sentences from './data/sentences.json' with { type: 'json' };

console.log(`Loading ${sentences.length} sentences via rita@${RiTa.VERSION}`);

let model = RiTa.markov(4, { sentences, maxLengthMatch: 5 });
for (let i = 0; i < 3; i++) {
  let result = model.generate({ numSentences: 4 });
  result.forEach((s, i) => console.log(`${i}) ${s}`));
  //console.log('\n', ...result);
}


