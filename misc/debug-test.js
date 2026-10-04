import { RiTa } from 'rita';
import { Annogram } from './annogram.js';
import poems from './poems.js';

console.log('Testing tokenization issue...\n');

// Create annogram instance
const annogram = new Annogram(2, poems);

// Try to generate a poem multiple times to catch the error
for (let i = 0; i < 10; i++) {
  try {
    console.log(`\n--- Attempt ${i + 1} ---`);
    const poem = annogram.generate(5, { minLength: 10 });
    console.log('Poem generated successfully');
    console.log('Poem text:', poem.text);
    console.log('Poem meta:', JSON.stringify(poem.meta, null, 2));
    
    // Check the asText output
    const asText = annogram.asText(poem);
    console.log('asText output:', asText);
    console.log('Match:', asText === poem.text.replace('<p>', ''));
    
    break; // Success, exit loop
  } catch (err) {
    console.error('Error:', err.message);
    
    // Extract the problematic phrase from error message
    const match = err.message.match(/No source for "([^"]+)"/);
    if (match) {
      const problematicPhrase = match[1];
      console.log('\nProblematic phrase:', problematicPhrase);
      console.log('Phrase tokens:', RiTa.tokenize(problematicPhrase));
      
      // Check if this phrase exists in any source
      const found = poems.find(p => p.text.includes(problematicPhrase));
      console.log('Found in source?', found ? 'YES' : 'NO');
      
      // Try to find similar phrases
      const normalized = problematicPhrase.replace(/[—–]/g, '-').replace(/"/g, '"');
      console.log('Normalized phrase:', normalized);
      const foundNormalized = poems.find(p => p.text.includes(normalized));
      console.log('Found normalized?', foundNormalized ? 'YES' : 'NO');
    }
    
    // Try next iteration
  }
}
