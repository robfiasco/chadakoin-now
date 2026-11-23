#!/usr/bin/env python3
"""BPU feed relay — runs on the chadakoindigital.com server via cron.

jamestownnybpu.gov drops connections from Vercel's IP ranges, so the app's
/api/proxy can't reach it. This server can. Every 10 min we fetch both feeds
and publish them as static files nginx serves at
https://chadakoindigital.com/feeds/.

A failed or malformed fetch never replaces the last good copy: each feed is
written to a temp file and only renamed into place after it returned 200 and
parsed as RSS. bpu-status.json records the last successful fetch per feed so
the app can tell how old the relay copy is.

Deployed copy: /usr/local/bin/bpu-relay.py (cron: /etc/cron.d/bpu-relay).
"""
import json
import os
import sys
import tempfile
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

OUT_DIR = '/var/www/feeds'
STATUS_FILE = os.path.join(OUT_DIR, 'bpu-status.json')
TIMEOUT_S = 15
USER_AGENT = 'ChadakoinNow/1.0 (+https://now.chadakoindigital.com)'

FEEDS = {
    'alerts': ('bpu-alerts.xml',
               'https://www.jamestownnybpu.gov/RSSFeed.aspx?ModID=63&CID=Alerts-11'),
    'meetings': ('bpu-meetings.xml',
                 'https://www.jamestownnybpu.gov/RSSFeed.aspx?ModID=58&CID=Jamestown-Board-Meeting-Calendar-23'),
}


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')


def fetch(url):
    req = urllib.request.Request(url, headers={
        'User-Agent': USER_AGENT,
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    })
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as res:
        if res.status != 200:
            raise RuntimeError(f'HTTP {res.status}')
        return res.read()


def validate_rss(body):
    # An empty feed (no <item>) is still valid — BPU often has no alerts.
    # What we reject is anything that isn't an RSS document: HTML error
    # pages, truncated bodies, captcha interstitials.
    root = ET.fromstring(body)
    if root.tag != 'rss' or root.find('channel') is None:
        raise ValueError(f'not RSS (root <{root.tag}>)')


def write_atomic(path, data):
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(path), prefix='.tmp-')
    try:
        with os.fdopen(fd, 'wb') as f:
            f.write(data)
        os.chmod(tmp, 0o644)
        os.replace(tmp, path)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def load_status():
    try:
        with open(STATUS_FILE) as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    status = load_status()
    failures = 0

    for key, (filename, url) in FEEDS.items():
        entry = status.get(key, {})
        entry['source'] = url
        entry['lastAttempt'] = now_iso()
        try:
            body = fetch(url)
            validate_rss(body)
            write_atomic(os.path.join(OUT_DIR, filename), body)
            entry['lastSuccess'] = entry['lastAttempt']
            entry['lastSuccessMs'] = int(time.time() * 1000)
            entry['lastError'] = None
        except Exception as e:  # noqa: BLE001 — any failure keeps the old copy
            failures += 1
            entry['lastError'] = f'{type(e).__name__}: {e}'[:300]
            print(f'[bpu-relay] {key} failed: {entry["lastError"]}', file=sys.stderr)
        status[key] = entry

    status['updated'] = now_iso()
    write_atomic(STATUS_FILE, json.dumps(status, indent=2).encode())
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main())
