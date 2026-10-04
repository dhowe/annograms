import { RiTa } from 'rita';
import poems from './poems.js';

console.log('Testing sentence splitting and Markov generation...\n');

// Reproduce what happens in the constructor
const allSentences = poems.map(p => p.text).join('\n');
const sentences = RiTa.sentences(allSentences);

console.log('Total sentences:', sentences.length);
console.log('First 3 sentences:');
sentences.slice(0, 3).forEach((s, i) => {
  console.log(`  ${i+1}: ${JSON.stringify(s.substring(0, 80))}`);
});

// Check for em-dashes in sentences
const sentencesWithEmDash = sentences.filter(s => s.includes('—'));
console.log('\nSentences with em-dash:', sentencesWithEmDash.length);
if (sentencesWithEmDash.length > 0) {
  console.log('Example:', JSON.stringify(sentencesWithEmDash[0].substring(sentencesWithEmDash[0].indexOf('—') - 10, sentencesWithEmDash[0].indexOf('—') + 10)));
}

// Create Markov model
const model = RiTa.markov(2, { sentences });

// Generate some text
console.log('\nGenerating 5 sentences with minLength 10:');
for (let i = 0; i < 3; i++) {
  try {
    const generated = model.generate({ numSentences: 5, minLength: 10 });
    console.log(`\nGeneration ${i+1}:`);
    console.log('Type:', typeof generated);
    console.log('Length:', generated.length);
    console.log('Content:', JSON.stringify(generated));
    
    // Check each sentence for em-dashes
    generated.forEach((sent, j) => {
      if (typeof sent === 'string' && sent.includes('—')) {
        console.log(`  Sentence ${j} has em-dash:`, JSON.stringify(sent));
      }
    });
  } catch (err) {
    console.error('Generation error:', err.message);
  }
}
