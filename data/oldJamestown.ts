// "Old Jamestown" — recurring local-history feature sourced from
// public-domain 1800s/early-1900s Jamestown newspapers (NYS Historic
// Newspapers / Prendergast Library). Hand-curated like CURATED_EVENTS in
// hooks/useCivicData.ts — new stories ship via editing this file + a web
// deploy, no app rebuild required. Story text is reproduced exactly as
// transcribed from the page scans; only paragraph breaks are formatting.

export interface OldJamestownStory {
  id: string;
  slug: string;
  title: string;
  publishDate: string; // 'YYYY-MM-DD', local/ET — story hidden until this date
  year: number;
  teaser: string;
  body: string[]; // paragraphs, in order
  // Sepia 1200×630 headline-only hero — used on the Home card and atop the
  // detail screen. Same fixed aspect ratio for all stories (OLD_JAMESTOWN_HEADER_ASPECT
  // below), so no per-story width/height needed the way the clipping has.
  headerImage: string; // filename in assets/old-jamestown/headers/ and public/old-jamestown/headers/
  headerImageAlt: string;
  // Full original clipping — secondary now, shown further down the detail
  // screen as "See the original page," not the hero.
  image: string;  // filename in assets/old-jamestown/ and public/old-jamestown/
  imageWidth: number;  // native pixel dimensions — lets the "original page"
  imageHeight: number; // tile crop to the image's actual top (via aspectRatio)
                        // instead of resizeMode="cover" center-cropping a
                        // hardcoded box height, which showed body text instead
                        // of the headline for the extreme-aspect-ratio 1902 scan.
  imageAlt: string;
  sourceLabel: string;
  sourceUrl: string;
  credit: string;
  tags: string[];
}

export const OLD_JAMESTOWN_HEADER_ASPECT = 1200 / 630;

export const OLD_JAMESTOWN_STORIES: OldJamestownStory[] = [
  {
    id: 'halloween-1902',
    slug: '1902-halloween-pranks',
    title: 'Cabbages, Doorbells and Rolling Outhouses: Halloween 1902',
    publishDate: '2026-10-10',
    year: 1902,
    teaser: 'On Friday, October 31, 1902, Jamestown got a warm, clear Halloween night. It was so clear the Evening Journal complained it was "almost too light to keep out of sight."',
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
    image: '1902-halloween-pranks.jpg',
    imageWidth: 492,
    imageHeight: 2042,
    imageAlt: '"Halloween" headline, The Evening Journal, Nov. 1, 1902',
    sourceLabel: 'The Evening Journal (Jamestown), Nov. 1, 1902, p. 5',
    sourceUrl: 'https://www.nyshistoricnewspapers.org/?a=d&d=tej19021101-01.1.5',
    credit: 'NYS Historic Newspapers / Prendergast Library',
    tags: ['halloween'],
  },
  {
    id: 'halloween-1900',
    slug: '1900-halloween-pranks',
    title: 'Beer Casks on Cherry Street and Ghosts in Pillowcases: Halloween 1900',
    publishDate: '2026-10-17',
    year: 1900,
    teaser: 'Jamestown woke up on November 1, 1900, to the usual Halloween cleanup, the kind that starts with looking for your front steps. According to The Evening Journal, the town’s imps, ghosts and witches turned out Wednesday night right on schedule, "but a good many of them quit work at a quarter of nine."',
    body: [
      'Jamestown woke up on November 1, 1900, to the usual Halloween cleanup, the kind that starts with looking for your front steps. According to The Evening Journal, the town’s imps, ghosts and witches turned out Wednesday night right on schedule, "but a good many of them quit work at a quarter of nine."',
      'The night owls kept going until morning, and the paper’s list of their work reads like a to-do list for chaos: overturned steps, swiped signs, cabbages on porches and tick-tacked windows. On Institute Street, somebody left a buggy minus one wheel parked across the sidewalk. Several shop signs had to be tracked down before business opened.',
      'The showstopper was on Cherry Street below Sixth. An old wagon turned up in the middle of the sidewalk, loaded with beer casks and oil barrels, with "appropriate legends" posted on the barrels. What did the signs say? The Journal didn’t print them, so we’ll never know, and that may be for the best. Nobody owned up to it, either. The paper chalked it up to more witches or imps.',
      'Not every witch got away clean. A flock of young ones was said to have romped across a freshly graded lawn on Winsor Street, and one of them "materialized sufficiently to be served with a severe shaking." Over on Lake View Avenue, a big section of Mrs. Crosby’s fence was found lying on the ground, and the reporter doubted the wind did it.',
      'Meanwhile, the well-behaved crowd was partying. Genevieve Aldrich and 20 friends gathered at her parents’ Allen Street home in sheets and pillowcases, and nobody knew who was who until a supper of pumpkin pie, doughnuts and cider around 10:30. The Luther League of the English Lutheran church held its annual social at 38 Harrison Street, with jack-o’-lanterns everywhere and a witch telling fortunes from a dark corner under the stairs. And in Falconer, the young women of the American Aristotype office surprised their hostess, Miss Fenton, by showing up in costume, fortune teller included.',
      'So enjoy the parties, Jamestown. Then check your fence in the morning.',
    ],
    headerImage: '1900-halloween-pranks.jpg',
    headerImageAlt: '"Halloween Pranks — The Usual Number of Annoying Mischief-Making Escapades Are Reported Today" headline, The Evening Journal, Nov. 1, 1900',
    image: '1900-halloween-pranks.jpg',
    imageWidth: 700,
    imageHeight: 850,
    imageAlt: '"Halloween Pranks" headline, The Evening Journal, Nov. 1, 1900',
    sourceLabel: 'The Evening Journal (Jamestown), Nov. 1, 1900, p. 5',
    sourceUrl: 'https://www.nyshistoricnewspapers.org/?a=d&d=tej19001101-01.1.5',
    credit: 'NYS Historic Newspapers / Prendergast Library',
    tags: ['halloween'],
  },
  {
    id: 'halloween-1896-falconer',
    slug: '1896-falconer-mischief',
    title: 'The Night Falconer Tied a Streetcar to a Telegraph Pole (1896)',
    publishDate: '2026-10-24',
    year: 1896,
    teaser: 'If you think of Falconer as a quiet village, you weren’t there for Halloween 1896. On Monday, November 2, The Evening Journal ran a short special dispatch from Falconer that opened with a warning.',
    body: [
      'If you think of Falconer as a quiet village, you weren’t there for Halloween 1896.',
      'On Monday, November 2, The Evening Journal ran a short special dispatch from Falconer that opened with a warning. The people who celebrated Halloween there "did so in a way that is likely to cause them trouble." Then it listed the damage.',
      'First came the bonfire. Two barber poles, several store signs, an outhouse and some street stands were thrown into a pile and burned. Two barber poles! Somewhere in Falconer, two barbers spent that Monday telling customers that yes, they were still open, and no, the stripes weren’t coming back. And somebody in the village had to come up with a new plan for the outhouse.',
      'Next came the rearranging. Sidewalks were flipped over and fence gates were taken off their posts. In the paper’s words, "nearly every object that was not securely anchored was misplaced." If it wasn’t nailed down, it ended up somewhere else.',
      'The big finish was at the D. A. V. & P. station, the stop on the Dunkirk, Allegheny Valley & Pittsburgh railroad that ran through Falconer. Somebody carefully wired an electric car to a telegraph pole. (In 1896, "electric car" meant a streetcar, not anything with a charging port.) Nobody caught it in time. As the Journal put it, when the car started, "it nearly pulled out one end of itself."',
      'And that’s where the story ends. The paper doesn’t say who did it, whether the trouble it predicted ever showed up, or what the motorman said when the car jerked to a stop. We can guess that last part wasn’t printable. The whole report is barely a paragraph, but it packs in a bonfire, a missing outhouse, a village full of misplaced belongings and one very confused streetcar.',
      'So this Halloween, Falconer, keep the shed locked and the barber pole bolted down. And before you pull out of the driveway on November 1, take a quick look and make sure nobody tied your bumper to the mailbox.',
    ],
    headerImage: '1896-falconer-mischief.jpg',
    headerImageAlt: '"Halloween Mischief at Falconer" dispatch, The Evening Journal, Nov. 2, 1896',
    image: '1896-falconer-mischief.jpg',
    imageWidth: 648,
    imageHeight: 720,
    imageAlt: '"Halloween Mischief at Falconer" dispatch, The Evening Journal, Nov. 2, 1896',
    sourceLabel: 'The Evening Journal (Jamestown), Nov. 2, 1896, p. 7',
    sourceUrl: 'https://www.nyshistoricnewspapers.org/?a=d&d=tej18961102-01.1.7',
    credit: 'NYS Historic Newspapers / Prendergast Library',
    tags: ['halloween'],
  },
  {
    id: 'halloween-1891-letter',
    slug: '1891-disgraceful-observance',
    title: 'Jamestown’s Great Halloween Argument of 1891',
    publishDate: '2026-10-30',
    year: 1891,
    teaser: 'Think arguing about Halloween is a modern thing? Jamestown was at it 135 years ago. On October 28, 1891, three days before Halloween, The Evening Journal printed a letter to the editor signed only "A. S. D."',
    body: [
      'Think arguing about Halloween is a modern thing? Jamestown was at it 135 years ago.',
      'On October 28, 1891, three days before Halloween, The Evening Journal printed a letter to the editor signed only "A. S. D." Word was out that a large force of special policemen would be hired to keep order on Halloween night, and A. S. D. was not happy. The problem wasn’t the cost. It was that anyone thought they were needed at all. The writer called that a disgrace, then suggested something better: if parents taught their kids what the holiday actually means, it would do more for public order and decency than "the clubs of a hundred ‘specials.’"',
      'Then came a short history lesson. Halloween, A. S. D. explained, is the eve of All Saints’ Day, and it should be spent in quiet, solemn preparation for the holy day. The writer was fine with most of the old superstitions that had attached themselves to the night and called them mostly harmless and innocent. What wasn’t fine was celebrating with hoots and yells, pulling gates off fences and wrecking other people’s property. That, the letter said, was "utterly irrational, stupid and brutish."',
      'To be fair, A. S. D. wasn’t anti-fun. The letter claimed great sympathy for the sports of youth, as long as they were reasonable. It hoped common decency would keep the peace that Saturday night better than any army of special constables. It ended with a pointed question: was the noise and disorder seen on Halloween in this city sport, reasonable, or fitting for the time?',
      'We don’t know who A. S. D. was, or whether the gate-lifters of 1891 were reading the letters page. (Probably not.) But the argument sounds pretty familiar: tradition versus rowdiness, police versus parenting.',
      'Two years later, on Halloween 1893, the Journal skipped the lecture and offered a better way to spend the evening: "Russet cider and doughnuts are very suitable refreshments for the occasion." Jamestown, that one still holds up.',
    ],
    headerImage: '1891-disgraceful-observance.jpg',
    headerImageAlt: '"A Disgraceful Observance" letter to the editor, The Evening Journal, Oct. 28, 1891',
    image: '1891-disgraceful-observance.jpg',
    imageWidth: 580,
    imageHeight: 715,
    imageAlt: '"A Disgraceful Observance" letter, The Evening Journal, Oct. 28, 1891',
    sourceLabel: 'The Evening Journal (Jamestown), Oct. 28, 1891, p. 4',
    sourceUrl: 'https://www.nyshistoricnewspapers.org/?a=d&d=tej18911028-01.1.4',
    credit: 'NYS Historic Newspapers / Prendergast Library',
    tags: ['halloween'],
  },
];
