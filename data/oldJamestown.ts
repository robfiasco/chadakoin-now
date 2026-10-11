// "From Jamestown's Archives" — offline fallback only.
//
// The live source of truth is GET /api/archives (see content/archives.js);
// the app fetches from there so a new story needs only a content change and
// a web deploy, never an App Store build. What's below is a snapshot of
// stories that had ALREADY been released as of the last build, kept purely
// so a cold start with no network still shows something.
//
// NEVER add an unreleased story here — that would ship its full text to
// every device ahead of its publish date, which is exactly what moving this
// server-side was meant to stop.

export interface OldJamestownStory {
  id: string;
  slug: string;
  title: string;
  publishDate: string; // 'YYYY-MM-DD' Eastern — the server gates on this
  year: number;
  // Home-card blurb only — written by hand per story, NOT auto-derived from
  // body[0]. Skip any leading full date ("On Friday, October 31, 1902,"):
  // the year is already in the title right above it, and the card has only
  // two lines before it truncates.
  teaser: string;
  body: string[]; // paragraphs, in order — the story itself, left verbatim
  // Sepia 1200×630 headline-only hero. A bundled fallback story stores a
  // bare filename; /api/archives returns an absolute URL. archiveHeaderSource()
  // in lib/oldJamestownImages.ts accepts either.
  headerImage: string;
  headerImageAlt: string;
  sourceLabel: string;
  sourceUrl: string;
  credit: string;
  tags: string[];
  // Supplied by the server so the "next week" teaser can name an unreleased
  // story without shipping its body. Absent on bundled fallback entries.
  next?: { year: number; title: string } | null;
}

export const OLD_JAMESTOWN_HEADER_ASPECT = 1200 / 630;

// The year should appear exactly once per card. Most titles already carry
// it ("...: Halloween 1902"), so the label stays plain; a future story
// whose title has no year gets it appended instead
// ("FROM JAMESTOWN'S ARCHIVES · 1884").
export function oldJamestownLabel(story: OldJamestownStory): string {
  const base = 'FROM JAMESTOWN’S ARCHIVES';
  return story.title.includes(String(story.year)) ? base : `${base} · ${story.year}`;
}

export const OLD_JAMESTOWN_STORIES: OldJamestownStory[] = [
  {
    id: 'halloween-1902',
    slug: '1902-halloween-pranks',
    title: 'Cabbages, Doorbells and Rolling Outhouses: Halloween 1902',
    publishDate: '2026-10-10',
    year: 1902,
    teaser: 'Jamestown got a warm, clear Halloween night, so clear the paper complained it was "almost too light to keep out of sight."',
    body: [
      'On Friday, October 31, 1902, Jamestown got a warm, clear Halloween night. It was so clear the Evening Journal complained it was "almost too light to keep out of sight."',
      'Kids hit the streets right after supper. Horns tooted and catcalls woke the "after supper sleepers." The paper said the only people spared were those "high up in flats." Everyone else got tick-tacks rattling on their windows, doorbells ringing nonstop, "salutes of cabbages," or found their sidewalks, signs and porch furniture had disappeared. By morning, chairs hung in the trees and some homeowners could barely get out the door past the loose boards and cabbage heads piled on the steps.',
      'At Main and Third, a gang of boys was caught turning their coats and hats inside out so nobody would recognize them.',
      'The best scene happened on Fairmount Avenue. One woman carried a chair onto her porch to catch the first boy who rang her bell. She got tired of waiting and went back in. Almost as soon as her door closed, the bell "rang like mad." She came back out and sat down again, and the kids heckled her from every corner until she gave up and went inside. Then the bell rang for ten straight minutes.',
      'Police added special officers for the night. The older boys’ favorite stunt was tipping outhouses near Hedges Avenue and watching them roll down the hill. One rolled right up to a waiting officer, and two boys went to court. The judge let them go on one condition: they had to put the outhouses back.',
      'The paper’s verdict was "lots of fun going on" but "no great damage was done." The same page also covered a run of house parties, including one on West Eighth Street that served Halloween supper inside hollowed-out pumpkins.',
    ],
    headerImage: '1902-halloween-pranks.jpg',
    headerImageAlt: '"Halloween Pranks — A Perfect Night for Outdoor Sports" headline, The Evening Journal, Nov. 1, 1902',
    sourceLabel: 'The Evening Journal (Jamestown), Nov. 1, 1902, p. 5',
    sourceUrl: 'https://www.nyshistoricnewspapers.org/?a=d&d=tej19021101-01.1.5',
    credit: 'NYS Historic Newspapers / Prendergast Library',
    tags: ['halloween'],
  },
];
