import RiTa from 'rita';

const model = RiTa.markov(4, { text: 'One. Two. Three. Four. Five.' });
console.log('Generate 1:', model.generate({ numSentences: 1, minLength: 1 }));
console.log('Generate 3:', model.generate({ numSentences: 3, minLength: 1 }));
