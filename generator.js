import RiTa from 'rita';
import sentences from './data/sentences.json';

console.log(`Loading ${sentences.length} sentences via rita@${RiTa.VERSION}`);

let model = RiTa.markov(4, { text: sentences, maxLengthMatch: 5 });
for (let i = 0; i < 3; i++) {
  let result = model.generate(4);
  console.log('\n',...result);
}


