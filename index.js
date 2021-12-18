import RiTa from 'rita';//'../ritajs/src/rita';
import MetaMarkov from './meta-markov';
import poems from './poems';

/* TODO: display line-by-line

         He had been chasing the 
                     chasing the sound of
                             the sound of the
                                 sound of the truck
*/
let mm = new MetaMarkov(4, poems, { maxLengthMatch: 7, trace: 0 });
let poem = mm.generate(5, { minLength: 10 });
mm.display(poem);
