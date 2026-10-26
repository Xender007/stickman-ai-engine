const fs = require('fs');
const edit = (file, fn) => { let s = fs.readFileSync(file, 'utf8'); s = fn(s); fs.writeFileSync(file, s); };
const need = (s, a) => { if (!s.includes(a)) throw new Error('missing: ' + String(a).slice(0, 70)); };
const rep = (s, a, b) => { need(s, a); return s.split(a).join(b); };
const D = 'clips/store-ch1/';

edit(D + 'scenesA.tsx', (s) => {
  s = rep(s, 'THANK YOU FOR SHOPPING WITH US', 'WELCOME TO OAKLINE FOODS');
  s = rep(s, '>SUPERMARKET</text>', '>OAKLINE FOODS</text>');
  s = rep(s, 'fontSize={50} fill="#f6f1e2" letterSpacing={4}', 'fontSize={46} fill="#f6f1e2" letterSpacing={3}');
  s = rep(s, '>24 HOURS</text>', '>LATE</text>');
  s = rep(s, '>2:14</text>', '>3:07</text>');
  s = rep(s, 'n="7"', 'n="5"');
  s = rep(s, "endLabel = 'DAIRY · CHILL'", "endLabel = 'FROZEN FOODS'");
  s = rep(s, "label = 'CANNED GOODS', sub = 'SOUP · BEANS'", "label = 'PANTRY STAPLES', sub = 'TINS · JARS'");
  // register panel
  s = rep(s, '>2 ITEMS</text>', '>TOTAL $4.50</text>');
  s = rep(s, '>02:00 AM</text>', '>03:00 AM</text>');
  s = rep(s, 'fontSize={54} fill="#dff7ec">TOTAL', 'fontSize={46} fill="#dff7ec">TOTAL');
  // newspaper + coffee instead of milk + cigarettes
  const a = s.indexOf('<g transform={`translate(200 ${lerp(300, 760, clamp(S.c4_milk))})`}');
  const b = s.indexOf('{[0, 1, 2].map((i) => <ellipse');
  const b2 = s.indexOf('\n', b);
  need(s, 'c4_cig');
  const repl = `<g transform={\`translate(210 \${lerp(300, 760, clamp(S.c4_milk))})\`} opacity={clamp(S.c4_milk * 3)}>
        <path d="M -55 -150 L 55 -150 L 44 0 L -44 0 Z" fill="#f4efe6" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <rect x={-50} y={-150} width={100} height={22} rx={6} fill="#4a4036" stroke={INK} strokeWidth={4} />
        <path d="M -52 -104 L 52 -104 L 47 -66 L -47 -66 Z" fill="#6b3f86" stroke={INK} strokeWidth={3.5} />
        <circle cx={0} cy={-85} r={14} fill="#f4efe6" stroke={INK} strokeWidth={3} />
        <path d="M -20 -176 q 10 -14 0 -28 M 6 -176 q 10 -14 0 -28 M 30 -176 q 10 -14 0 -28" fill="none" stroke="#f1ead6" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
      </g>
      <g transform={\`translate(450 \${lerp(300, 760, clamp(S.c4_cig))}) rotate(-4)\`} opacity={clamp(S.c4_cig * 3)}>
        <rect x={-85} y={-190} width={170} height={190} fill="#e9e4d4" stroke={INK} strokeWidth={5} />
        <rect x={-72} y={-176} width={144} height={30} fill="#2a2a2e" />
        <rect x={-72} y={-134} width={64} height={52} fill="#9aa7b4" stroke={INK} strokeWidth={2.5} />
        {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={0} y1={-132 + i * 11} x2={72} y2={-132 + i * 11} stroke={INK} strokeWidth={3} opacity={0.7} />)}
        {[0, 1, 2, 3, 4, 5].map((i) => <line key={\`l\${i}\`} x1={-72} y1={-70 + i * 11} x2={72 - (i % 3) * 18} y2={-70 + i * 11} stroke={INK} strokeWidth={2.6} opacity={0.55} />)}
      </g>
      `;
  return s.slice(0, a) + repl + s.slice(b, b2 + 1).replace(/.*/, '      {[0, 1, 2].map((i) => <ellipse key={i} cx={560 + i * 26} cy={790 - i * 4} rx={20} ry={7} fill="#d9a441" stroke={INK} strokeWidth={2.5} opacity={clamp(S.c4_milk * 3)} />)}') + s.slice(b2 + 1);
});

edit(D + 'scenesA.tsx', (s) => {
  // 12 cameras (4 x 3)
  s = rep(s, 'Array.from({ length: 16 }, (_, i) => {\n        const cx = 50 + (i % 4) * 160, cy = 180 + Math.floor(i / 4) * 188;\n        const vis = clamp(S.c7_show * 20 - i);', 'Array.from({ length: 12 }, (_, i) => {\n        const cx = 50 + (i % 4) * 160, cy = 190 + Math.floor(i / 4) * 250;\n        const vis = clamp(S.c7_show * 16 - i);');
  s = rep(s, '<rect x={cx} y={cy} width={150} height={176} fill="#41576d"', '<rect x={cx} y={cy} width={150} height={238} fill="#41576d"');
  s = rep(s, '<rect x={cx} y={cy + 120} width={150} height={56} fill="#364a5d" />', '<rect x={cx} y={cy + 170} width={150} height={68} fill="#364a5d" />');
  s = rep(s, '>CAM {String(i + 1)', '>CH {String(i + 1)');
  s = rep(s, 'translate(${x} ${cy + 150}) scale(0.9)', 'translate(${x} ${cy + 214}) scale(1.1)');
  s = rep(s, '<rect x={30} y={160} width={660} height={780} rx={12}', '<rect x={30} y={170} width={660} height={780} rx={12}');
  // staff room
  s = rep(s, '>ROTA</text>', '>SHIFTS</text>');
  s = rep(s, "fill=\"#3d63a8\" stroke={INK} strokeWidth={4} />)}\n        <rect x={60}", "fill=\"#6b3f86\" stroke={INK} strokeWidth={4} />)}\n        <rect x={60}");
  s = rep(s, '>1 HOUR.</text>', '>45 MIN.</text>');
  // card 10
  s = rep(s, '>PROBLEM 1</text>', '>PROBLEM ONE</text>');
  s = rep(s, 'fontSize={44} fill="#a39274" letterSpacing={8}', 'fontSize={44} fill="#6f7f6a" letterSpacing={8}');
  return s;
});

edit(D + 'scenesB.tsx', (s) => {
  s = rep(s, '>SHUTTER: DAYS USED</text>', '>ROLLER SHUTTER:</text>');
  s = rep(s, '>PER YEAR</text>', '>DAYS DOWN PER YEAR</text>');
  s = rep(s, 'const last = i === 358;', 'const last = i === 0;');
  s = rep(s, "fill={last && S.c11_red > 0 ? '#d9462a' : '#f6ecd3'} stroke={last && S.c11_red > 0 ? INK : '#8a7d62'}", "fill={last && S.c11_red > 0 ? '#d9462a' : '#f4f8f1'} stroke={last && S.c11_red > 0 ? INK : '#7f8f7a'}");
  s = rep(s, '>CHRISTMAS DAY</text>', ">NEW YEAR'S DAY</text>");
  s = rep(s, 'fontSize={30} fill="#7a6d52">1 day a year', 'fontSize={30} fill="#6f7f6a">1 day a year');
  s = rep(s, '>AISLE 7</text>', '>AISLE 5</text>');
  s = rep(s, 'fontSize={34} fill="#9c8d6d" opacity={clamp(S.c15_title)}>CANS</text>', 'fontSize={34} fill="#6f7f6a" opacity={clamp(S.c15_title)}>TINS</text>');
  s = rep(s, '>4 a day = 6 years</text>', '>5 a day = 4 years</text>');
  s = rep(s, 'fontSize={44} fill="#7a6d52">5 a day', 'fontSize={44} fill="#6f7f6a">5 a day');
  s = rep(s, '<AisleSign x={360} y={190} n="7"', '<AisleSign x={360} y={190} n="5"');
  s = rep(s, '>DAY 30</text>', '>DAY 28</text>');
  s = rep(s, '>4:51</text>', '>5:23</text>');
  s = rep(s, '>MAGNETIC LOCK</text>', '>ELECTRO-LOCK</text>');
  s = rep(s, '>29 DAYS TO GO</text>', '>27 DAYS TO GO</text>');
  return s;
});

edit(D + 'props.tsx', (s) => rep(s, 'export const CardBg: React.FC = () => <rect width={W} height={H} fill={PAL.paper} />;', "export const CardBg: React.FC = () => <rect width={W} height={H} fill=\"#dbe5d6\" />;"));
edit(D + 'choreo.ts', (s) => rep(s, "tw('c15_num', 0, 9000,", "tw('c15_num', 0, 7300,"));
edit(D + 'narration.mts', (s) => {
  s = rep(s, 'Twenty-nine days to go.', 'Twenty-seven days to go.');
  s = s.replace(/const spoken = \(t: string\) => t[\s\S]*?\.replace\(\/\\b1 hour\\b\/g, 'One hour'\);/, "const spoken = (t: string) => t\n  .replace(/\\b3:07\\b/g, 'three oh seven').replace(/\\b5:23\\b/g, 'five twenty-three').replace(/\\b25,000\\b/g, 'twenty-five thousand')\n  .replace(/\\b7,300\\b/g, 'seven thousand three hundred').replace(/\\baisle 5\\b/gi, 'aisle five').replace(/\\b12 security\\b/g, 'twelve security').replace(/\\b12 days\\b/g, 'twelve days')\n  .replace(/\\b35 seconds\\b/g, 'thirty-five seconds').replace(/\\b4 years\\b/g, 'four years').replace(/\\bday 28\\b/g, 'day twenty-eight').replace(/\\bat 3\\./g, 'at three.');");
  return s;
});
edit(D + 'build.mts', (s) => rep(s, 'Zombie Outbreak: 30 Days Locked Inside a Supermarket, Chapter 1', 'Dead Hours: 28 Days Locked Inside a Grocery Store, Chapter 1'));
console.log('rebrand ok');
