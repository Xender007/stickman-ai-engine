import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Bundled locally so renders never depend on a font CDN.
export const ANTON = 'Anton';
export const MONTSERRAT = 'Montserrat';

loadFont({family: ANTON, url: staticFile('fonts/Anton-Regular.ttf'), weight: '400'});
loadFont({family: MONTSERRAT, url: staticFile('fonts/Montserrat.ttf'), weight: '100 900'});
