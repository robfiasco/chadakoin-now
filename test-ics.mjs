import fs from 'fs';

// Mock the parseIcsDate and parse logic from useCivicData.ts
function parseIcsDate(raw) {
  const clean = raw.replace(/.*:/,'').trim();
  if (clean.length >= 8) {
    const y = clean.slice(0,4), mo = clean.slice(4,6), d = clean.slice(6,8);
    const h = clean.slice(9,11)||'00', mi = clean.slice(11,13)||'00';
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:00`);
  }
  return null;
}

function parseRecyclingTitle(title, start, end) {
  const lower = title.toLowerCase();
  
  let material;
  if (lower.includes('cardboard') || lower.includes('corrugated') || lower.includes('box board')) {
    material = 'Corrugated Cardboard & Boxboard';
  } else if (lower.includes('plastic')) {
    material = 'Plastics (bottles, jugs, containers)';
  } else if (lower.includes('paper')) {
    material = 'Paper (newspaper, mail, magazines, office paper)';
  } else if (lower.includes('metal') || lower.includes('tin') || lower.includes('alumin')) {
    material = 'Metals & Cans (aluminum, tin)';
  } else if (lower.includes('glass')) {
    material = 'Glass';
  } else {
    const cut = title.match(/^(.+?)(?:\s+(?:week|only|recycling)\b|\s*[-:—–])/i);
    material = cut ? cut[1].trim() : title.replace(/,\s*$/, '').trim();
  }

  const startDate = start ? start.toISOString().split('T')[0] : '';
  return { material, startDate };
}

async function run() {
  const text = fs.readFileSync('CurrentEvents.ics', 'utf-8');
  
  const eventRx = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
  const fieldRx = /^([A-Z\-]+(?:;[^:]+)?):(.*)/;

  const recyclingWeeks = [];
  let m;
  while ((m = eventRx.exec(text)) !== null) {
    const block = m[1];
    const unfolded = block.replace(/\r?\n[ \t]/g, '');
    const lines = unfolded.split(/\r?\n/);

    let summary = '', dtstart = '', dtend = '', description = '';
    for (const line of lines) {
      const fm = fieldRx.exec(line);
      if (!fm) continue;
      const [, key, val] = fm;
      const k = key.split(';')[0].toUpperCase();
      if (k === 'SUMMARY')     summary     = val.replace(/\\,/g, ',').replace(/\\n/g, ' ').trim();
      if (k === 'DTSTART')     dtstart     = val.trim();
      if (k === 'DTEND')       dtend       = val.trim();
      if (k === 'DESCRIPTION') description = val.replace(/\\,/g, ',').replace(/\\n/g, ' ').trim();
    }

    if (!summary || !dtstart) continue;

    const lower = summary.toLowerCase();
    const start = parseIcsDate(dtstart);
    const end   = parseIcsDate(dtend);

    const isRecycling = [
      'cardboard', 'plastic', 'paper', 'metal', 'glass', 'recycling'
    ].some(kw => lower.includes(kw));
    if (!isRecycling || lower.includes('no garbage')) continue;

    const titleForParsing = summary.includes('No ') || summary.includes('no ') ? summary : description || summary;
    recyclingWeeks.push(parseRecyclingTitle(titleForParsing, start, end));
  }

  recyclingWeeks.sort((a, b) => a.startDate.localeCompare(b.startDate));
  
  console.log("ALL WEEKS:");
  recyclingWeeks.forEach(w => console.log(`${w.startDate}: ${w.material}`));

  const today = new Date().toISOString().split('T')[0];
  console.log("\\nTODAY IS:", today);
  
  let thisIdx = -1;
  for (let i = recyclingWeeks.length - 1; i >= 0; i--) {
    if (recyclingWeeks[i].startDate <= today) {
      thisIdx = i;
      break;
    }
  }
  
  if (thisIdx === -1 && recyclingWeeks.length > 0) thisIdx = 0;
  
  console.log("\\nMATCHED INDEX:", thisIdx);
  if (thisIdx >= 0) {
    console.log("THIS WEEK:", recyclingWeeks[thisIdx]);
    console.log("NEXT WEEK:", recyclingWeeks[thisIdx + 1]);
  }
}

run();
