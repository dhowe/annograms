import { RiTa } from 'rita';
import poems from './poems.js';

const tokens = ['keeps', 'coming', '.', '—', 'I'];
const phrase = RiTa.untokenize(tokens);

console.log('Phrase:', JSON.stringify(phrase));
console.log('Phrase length:', phrase.length);
console.log('First char:', JSON.stringify(phrase[0]));
console.log('First char is punct:', RiTa.isPunct(phrase[0]));

const rePre = RiTa.isPunct(phrase[0]) ? '' : '(^|\\W)';
const rePost = '(\\W|$)';

// Escape the phrase for regex
const escapeForRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const escapedPhrase = escapeForRegex(phrase);

const phraseRE = new RegExp(rePre + escapedPhrase + rePost);

console.log('Regex pattern:', phraseRE);

// Test with a string that should match
const test1 = 'The little dog keeps coming. —I will not think';
console.log('\nTest 1:', JSON.stringify(test1));
console.log('Matches:', phraseRE.test(test1));

// Find actual sources
console.log('\nSearching in poems...');
const matches = poems.filter(p => phraseRE.test(p.text));
console.log('Found', matches.length, 'matches');

if (matches.length > 0) {
  console.log('First match:', JSON.stringify(matches[0].text.substring(matches[0].text.indexOf('keeps') - 5, matches[0].text.indexOf('keeps') + 50)));
} else {
  // Try without the em-dash space issue
  const phrase2 = 'keeps coming. —I';
  const phraseRE2 = new RegExp(rePre + escapeForRegex(phrase2) + rePost);
  console.log('\nTrying alternative phrase:', JSON.stringify(phrase2));
  const matches2 = poems.filter(p => phraseRE2.test(p.text));
  console.log('Found', matches2.length, 'matches with alternative');
  if (matches2.length > 0) {
    console.log('First match:', JSON.stringify(matches2[0].text.substring(matches2[0].text.indexOf('keeps') - 5, matches2[0].text.indexOf('keeps') + 50)));
  }
}
