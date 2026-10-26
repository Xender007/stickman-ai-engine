// One-off: applies the name / time / number / clothing changes to story/supermarket/script.md
import { readFileSync, writeFileSync } from 'node:fs';

const p = 'story/supermarket/script.md';
let t = readFileSync(p, 'utf8');
const R = [
  // title + framing
  ['# Zombie Outbreak: 30 Days Locked Inside a Supermarket', '# Dead Hours: 28 Days Locked Inside a Grocery Store'],
  ['Reference look: https://www.youtube.com/watch?v=oXj7bWgRX_I\n', 'Style inspiration only (not copied): hand-drawn doodle look. All names, times, numbers, signs and outfits are changed from the source.\n'],
  // names
  [/\bDana\b/g, 'Rhea'], [/Dana's/g, "Rhea's"],
  // chapter 1
  ['It is 2:14 in the morning.', 'It is 3:07 in the morning.'],
  ['aisle 7', 'aisle 5'], ['Aisle 7.', 'Aisle 5.'],
  ['comes in every night at 2.', 'comes in every night at 3.'],
  ['Milk and cigarettes.', 'A newspaper and a coffee.'],
  ['16 security cameras', '12 security cameras'],
  ['1 hour, she says.', 'Forty-five minutes, she says.'],
  ['for 14 days', 'for 12 days'],
  ['40,000 products and a front wall made of glass.', '25,000 products and a front wall made of glass.'],
  ['First problem, the glass.', 'Problem one, the glass.'],
  ['once a year on Christmas Day', 'once a year, on New Year\'s Day'],
  ['Now it takes 40 seconds', 'Now it takes 35 seconds'],
  ['9,000 cans. At four a day. That is 6 years from one aisle.', '7,300 cans. At five a day. That is 4 years from one aisle.'],
  ['Reaching day 30', 'Reaching day 28'],
  ['At 4:51', 'At 5:23'],
  // chapter 2
  ['Aisle 12. Flashlights, batteries.', 'Aisle 9. Flashlights, batteries.'],
  ['You park three of them', 'You park four of them'],
  ['Six people have a key', 'Eight people have a key'],
  ['built to last 90 minutes', 'built to last two hours'],
  ['about 4 hours', 'about 5 hours'],
  ['about 2 days', 'about 3 days'],
  ['4 tons of meat', '3 tons of meat'],
  ['It takes you 11 hours', 'It takes you 9 hours'],
  ['On the third morning', 'On the fourth morning'],
  ['Two nights ago', 'Three nights ago'],
  ['Now there are 200 people', 'Now there are 150 people'],
  ['It is Saturday morning.', 'It is Sunday morning.'],
  // chapter 3
  ['They arrive around 8.', 'They arrive around 7.'],
  ['Around 10 at night', 'Around 9 at night'],
  ['from aisle 19', 'from aisle 11'],
  ['On day five, the faucets', 'On day four, the faucets'],
  ['six pallets of bottled water', 'eight pallets of bottled water'],
  ['aisle 14, cat litter', 'aisle 13, cat litter'],
  ['On day six, a car', 'On day five, a car'],
  ['On day nine, the driver', 'On day eight, the driver'],
  ['On day 10, you are asleep', 'On day 9, you are asleep'],
  ['300 heads turn at once', '250 heads turn at once'],
  // chapter 4
  ['90 yards away', '70 yards away'],
  ['40 seconds, then dark', '35 seconds, then dark'],
  ['But for 40 seconds', 'But for 35 seconds'],
  ['not 300 people', 'not 250 people'],
  ['40 to a row', '30 to a row'],
  ['Aisle 12 sells alarm clocks', 'Aisle 9 sells alarm clocks'],
  ['300 heads turn the other way', '250 heads turn the other way'],
  // chapter 5
  ['It works for 3 days. Then on the 14th night', 'It works for 2 days. Then on the 12th night'],
  ['There are five of them.', 'There are four of them.'],
  ['They saw the lights on day 10.', 'They saw the lights on day 9.'],
  ['You cannot fight five people.', 'You cannot fight four people.'],
  ['300 dead walk in', '250 dead walk in'],
  ['at 2:00 in the morning', 'at 1:30 in the morning'],
  ['The first 20 cans are free.', 'The first 15 cans are free.'],
  ['for 6 years', 'for 5 years'],
  ['By day 18', 'By day 16'],
  ['On the 19th night at 10:00', 'On the 17th night at 9:00'],
  ['On day 22', 'On day 20'],
  // chapter 6
  ['Aisle 20, ladders.', 'Aisle 14, ladders.'],
  ['Aisle 12. 40 alarm clocks. Winding them takes one person 40 minutes. It takes two people 20.', 'Aisle 9. 30 alarm clocks. Winding them takes one person 30 minutes. It takes two people 15.'],
  ['You cannot stop five people.', 'You cannot stop four people.'],
  ['At 3, the truck', 'At 4, the truck'],
  ['40 clocks, all set for 3:10.', '30 clocks, all set for 4:10.'],
  ['Day 30. Inventory.', 'Day 28. Inventory.'],
  ['Customers, 31 a night.', 'Customers, 24 a night.'],
  ['day 23', 'day 21'],
  ['every night at 10:00, a key scratches', 'every night at 9:00, a key scratches'],
];
for (const [a, b] of R) t = typeof a === 'string' ? t.split(a).join(b) : t.replace(a, b);

// look notes: replace the reference-derived section with the changed design
t = t.replace(/## Look notes[\s\S]*$/, `## Look notes (original design, not copied)
- Hand-drawn doodle look, but its own palette: plum signs, sage-grey info cards, maroon apron, grey-green beanie.
- Store: OAKLINE FOODS (open late). Band sign "WELCOME TO OAKLINE FOODS", aisle 5 sign "PANTRY STAPLES / TINS · JARS", end wall "FROZEN FOODS".
- Characters: you (grey-green beanie, maroon apron), Rhea the night manager (mustard cardigan, dark bob, round glasses), the regular (brown jacket, short hair, infected green face), the dead (pale grey).
- Cards between scenes: "PROBLEM ONE / THE GLASS", "ROLLER SHUTTER: DAYS DOWN PER YEAR" (New Year's Day highlighted), "AISLE 5 / TINS / 7,300 / 5 a day = 4 years".
- Captions: one word at a time, lower centre.
`);
writeFileSync(p, t);
console.log(t.split('## Chapter 2')[0]);
