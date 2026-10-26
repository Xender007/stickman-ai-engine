const fs = require('fs');
let s = fs.readFileSync('clips/store-ch1/doodle.tsx', 'utf8');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('missing: ' + a.slice(0, 60)); s = s.replace(a, b); };
rep("teal: '#1f7f7b', tealDark: '#175f5c'", "teal: '#6b3f86', tealDark: '#4d2c63'");
rep("const cloth = { hero: PAL.teal, dana: PAL.red, man: PAL.blue,", "const cloth = { hero: '#8a2f3d', dana: '#d4a22c', man: '#7a5a3a',");
// Rhea: dark bob hair instead of a bun
const bunStart = s.indexOf("{kind === 'dana' && <>");
const bunEnd = s.indexOf("</>}", bunStart) + 4;
s = s.slice(0, bunStart) + "{kind === 'dana' && <path d={`M ${hd[0] - HR - 3} ${hd[1] + 12} L ${hd[0] - HR - 3} ${hd[1] - 2} A ${HR + 3} ${HR + 3} 0 0 1 ${hd[0] + HR + 3} ${hd[1] - 2} L ${hd[0] + HR + 3} ${hd[1] + 12} Q ${hd[0] + HR - 2} ${hd[1] + 4} ${hd[0] + HR - 8} ${hd[1] - 6} Q ${hd[0]} ${hd[1] - 14} ${hd[0] - HR + 6} ${hd[1] - 6} Q ${hd[0] - HR + 2} ${hd[1] + 4} ${hd[0] - HR - 3} ${hd[1] + 12} Z`} fill=\"#2e2420\" stroke={INK} strokeWidth={3} strokeLinejoin=\"round\" />}" + s.slice(bunEnd);
// headgear: hero = grey-green beanie, man = short hair, no caps
const hgStart = s.indexOf("{(kind === 'hero' || kind === 'man') && (");
const hgEnd = s.indexOf(")}", s.indexOf('</g>', hgStart)) + 2;
s = s.slice(0, hgStart) + "{kind === 'hero' && (\n        <g>\n          <path d={`M ${hd[0] - HR - 1} ${hd[1] - 3} A ${HR + 1} ${HR + 4} 0 0 1 ${hd[0] + HR + 1} ${hd[1] - 3} Z`} fill=\"#4d6b57\" stroke={INK} strokeWidth={3} strokeLinejoin=\"round\" />\n          <rect x={hd[0] - HR - 2} y={hd[1] - 11} width={2 * HR + 4} height={10} rx={4} fill=\"#3a5242\" stroke={INK} strokeWidth={3} />\n          <circle cx={hd[0] + 1} cy={hd[1] - HR - 5} r={6} fill=\"#cbd5c6\" stroke={INK} strokeWidth={2.5} />\n        </g>\n      )}\n      {kind === 'man' && <path d={`M ${hd[0] - HR + 1} ${hd[1] - 2} A ${HR} ${HR} 0 0 1 ${hd[0] + HR - 1} ${hd[1] - 2} Q ${hd[0] + 4} ${hd[1] - 13} ${hd[0] - HR + 1} ${hd[1] - 2} Z`} fill=\"#2c211a\" stroke={INK} strokeWidth={3} strokeLinejoin=\"round\" />}" + s.slice(hgEnd);
// round glasses for Rhea (after the mouth line)
rep("{mouth === 'o' && <ellipse", "{kind === 'dana' && <g fill=\"none\" stroke={INK} strokeWidth={2.2}><circle cx={hd[0] + 7 + look} cy={hd[1] + 5} r={6.5} /><circle cx={hd[0] + 18 + look} cy={hd[1] + 5} r={6.5} /><line x1={hd[0] + 13.5 + look} y1={hd[1] + 5} x2={hd[0] + 11.5 + look} y2={hd[1] + 5} /></g>}\n          {mouth === 'o' && <ellipse");
fs.writeFileSync('clips/store-ch1/doodle.tsx', s);
console.log('doodle ok');
