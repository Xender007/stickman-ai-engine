import fs from 'node:fs';
import path from 'node:path';
import {Episode, EpisodeSchema, Series, SeriesSchema} from '../../src/episode/schema';

export const ROOT = 'series';
export type StoredSeries = Series & {slug: string; createdAt: string};

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'series';
const dir = (slug: string) => path.join(ROOT, slug);

export const listSeries = (): StoredSeries[] =>
  fs.existsSync(ROOT)
    ? fs.readdirSync(ROOT).filter((s) => fs.existsSync(path.join(dir(s), 'bible.json'))).map(readSeries)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    : [];

export const readSeries = (slug: string): StoredSeries => {
  const raw = JSON.parse(fs.readFileSync(path.join(dir(slug), 'bible.json'), 'utf8'));
  return {...SeriesSchema.parse(raw), slug, createdAt: raw.createdAt ?? ''};
};

export const createSeries = (bible: Series): StoredSeries => {
  let slug = slugify(bible.title);
  for (let n = 2; fs.existsSync(dir(slug)); n++) slug = `${slugify(bible.title)}-${n}`;
  const stored = {...bible, slug, createdAt: new Date().toISOString()};
  fs.mkdirSync(dir(slug), {recursive: true});
  fs.writeFileSync(path.join(dir(slug), 'bible.json'), JSON.stringify(stored, null, 2) + '\n');
  return stored;
};

export const partsDone = (slug: string): number[] =>
  fs.readdirSync(dir(slug)).map((f) => /^part-(\d+)\.json$/.exec(f)?.[1]).filter(Boolean).map(Number).sort((a, b) => a - b);

export const readEpisode = (slug: string, part: number): Episode =>
  EpisodeSchema.parse(JSON.parse(fs.readFileSync(path.join(dir(slug), `part-${part}.json`), 'utf8')));

export const writeJson = (slug: string, name: string, data: unknown) => {
  const file = path.join(dir(slug), name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  return file;
};
