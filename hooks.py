# Sec-Notes build hooks.
#
# ---------------------------------------------------------------------------
# TOPICS — single source of truth
# ---------------------------------------------------------------------------
# A topic is just docs/topics/<slug>.md with front matter:
#   title, emoji, chip (peach|mint|lavender), tag, desc, order (optional)
# That ONE file is enough: on_config below reads every such file and
# auto-generates its left-nav entry AND its dashboard card data (SN_TOPICS).
# Adding a new topic = creating that one file. Nothing else to edit.
#
# ---------------------------------------------------------------------------
# ARTICLES — single source of truth
# ---------------------------------------------------------------------------
# Articles live under docs/topics/ in one of two shapes:
#   topics/<topic-slug>/<article-slug>/index.md                   (flat)
#   topics/<topic-slug>/<collection-slug>/<article-slug>/index.md (grouped,
#       e.g. a cert path like "cpts" holding several modules)
# The folder structure IS the source of truth for topic (and collection) —
# no need to repeat either in front matter. Reading time comes from each
# article's real word count, not a typed-in number.
#
# ---------------------------------------------------------------------------
# What each hook does
# ---------------------------------------------------------------------------
# on_config       — scans docs/topics/*.md, builds SN_TOPICS, inserts their
#                    nav entries into the "Library" section automatically.
# on_files        — scans the article folders, generates
#                    docs/javascripts/notes-data.js (SN_NOTES + SN_TOPICS)
#                    as a build-time-only file (never written into docs/,
#                    so it can't trigger mkdocs serve's watch-rebuild loop).
# on_page_markdown — derives a per-article description (front matter
#                    `description`/`excerpt`, else the first paragraph) and
#                    injects the "Published X ago · N min read" line under
#                    an article's H1, and the H1 itself for a topic page
#                    (so the page body never has to repeat its own title).
# on_post_page    — adds Open Graph / Twitter tags (the share preview) and
#                    loads the bundled Mermaid on pages that need it.
#
# SOCIAL CARDS: every article gets a 1200x630 PNG built from its title at
# build time (needs Pillow + a system font; otherwise the shared
# docs/assets/social-default.png is used). Set `site_url` in mkdocs.yml so the
# tags carry absolute URLs — WhatsApp/X/LinkedIn ignore relative ones.
# Per-article override: `cover_image:` in front matter.

import datetime
import html
import json
import re
import tempfile
from pathlib import Path

from mkdocs.structure.files import File
from mkdocs.utils import get_relative_url

FRONT_MATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.S)
CODE_FENCE_RE = re.compile(r"```.*?```", re.S)
HEADING_RE = re.compile(r"^#\s+.+$")

_FONTS_BOLD = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/noto/NotoSans-Bold.ttf",
    "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
]
_FONTS_REG = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/noto/NotoSans-Regular.ttf",
    "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf",
]
_ARABIC_RE = re.compile(r"[\u0600-\u06FF]")
_DEFAULT_CARD = "assets/social-default.png"
# src_uri -> card path (relative to site root), filled by on_files.
_CARDS = {}


def _first_font(paths):
    for f in paths:
        if Path(f).exists():
            return f
    return None


def _render_card(out_path, title, kicker="", foot=""):
    """1200x630 share card in the site's look. Returns True on success; any
    problem (no Pillow, no font) just means the default card is used."""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        return False
    bold, reg = _first_font(_FONTS_BOLD), _first_font(_FONTS_REG) or _first_font(_FONTS_BOLD)
    if not bold:
        return False
    W, H, PAD = 1200, 630, 80
    img = Image.new("RGB", (W, H), (247, 245, 240))
    d = ImageDraw.Draw(img)
    stops = [(217, 112, 47), (160, 79, 156), (74, 58, 143)]
    for x in range(W):  # brand gradient bar along the top
        t = x / (W - 1) * 2
        i = min(int(t), 1)
        f = t - i
        c = tuple(round(stops[i][k] + (stops[i + 1][k] - stops[i][k]) * f) for k in range(3))
        d.line([(x, 0), (x, 17)], fill=c)
    rtl = bool(_ARABIC_RE.search(title))

    def fnt(path, size):
        return ImageFont.truetype(path, size)

    def width(txt, font):
        return d.textlength(txt, font=font, direction="rtl" if rtl else None) if _raqm() else d.textlength(txt, font=font)

    size = 78
    while True:
        font = fnt(bold, size)
        lines, cur = [], ""
        for w in title.split():
            trial = (cur + " " + w).strip()
            if width(trial, font) <= W - 2 * PAD or not cur:
                cur = trial
            else:
                lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        if (len(lines) <= 3 and size * 1.25 * len(lines) <= 330) or size <= 44:
            break
        size -= 4
    lines = lines[:3]
    y = 175
    for ln in lines:
        x = W - PAD - width(ln, font) if rtl else PAD
        kw = {"direction": "rtl"} if rtl and _raqm() else {}
        d.text((x, y), ln, font=font, fill=(42, 38, 32), **kw)
        y += int(size * 1.25)
    small = fnt(bold, 28)
    if kicker:
        d.rounded_rectangle([PAD, 105, PAD + d.textlength(kicker.upper(), font=small) + 40, 153], 24, fill=(247, 221, 202))
        d.text((PAD + 20, 111), kicker.upper(), font=small, fill=(150, 80, 30))
    d.text((PAD, H - 96), "Sec-Notes", font=fnt(bold, 36), fill=(217, 112, 47))
    if foot:
        fsm = fnt(reg, 28)
        d.text((W - PAD - d.textlength(foot, font=fsm), H - 90), foot, font=fsm, fill=(107, 100, 89))
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, optimize=True)
    return True


def _raqm():
    try:
        from PIL import features
        return features.check("raqm")
    except Exception:
        return False


def _plain_description(markdown, limit=160):
    """First real paragraph of an article as plain text."""
    body = CODE_FENCE_RE.sub("\n", markdown)
    for block in re.split(r"\n\s*\n", body):
        b = block.strip()
        if b.startswith(">"):  # an intro quote is a fine description
            b = re.sub(r"(?m)^>\s?", "", b).strip()
        if not b or b[0] in "#|<!>-*+=:`" or re.match(r"^\d+[.)] ", b) or b.startswith(("---", "```")):
            continue
        b = re.sub(r"!?\[([^\]]*)\]\([^)]*\)", r"\1", b)
        b = re.sub(r"<[^>]+>|[*_`~]|\{:[^}]*\}", "", b)
        b = re.sub(r"\s+", " ", b).strip()
        if len(b) < 20:
            continue
        return b if len(b) <= limit else b[: limit - 1].rsplit(" ", 1)[0].rstrip(" ,.;:-") + "…"
    return ""


# Populated by on_config, read back by on_files (on_config always runs
# first in mkdocs's build lifecycle).
_TOPICS = []


def _parse_front_matter(text):
    m = FRONT_MATTER_RE.match(text)
    meta = {}
    if not m:
        return meta, text
    for line in m.group(1).splitlines():
        if ":" in line and not line.strip().startswith("-"):
            key, _, value = line.partition(":")
            meta[key.strip()] = value.strip().strip('"').strip("'")
    return meta, text[m.end():]


def _word_count(body):
    # Code blocks read faster than prose; weigh them at ~40% of a normal
    # word so a snippet-heavy note doesn't get an inflated read time.
    code_words = sum(len(block.split()) for block in CODE_FENCE_RE.findall(body))
    prose = CODE_FENCE_RE.sub(" ", body)
    prose_words = len(prose.split())
    return prose_words + round(code_words * 0.4)


def on_config(config, **kwargs):
    docs_dir = Path(config["docs_dir"])
    topics_dir = docs_dir / "topics"
    topics = []

    for md_file in sorted(topics_dir.glob("*.md")):
        meta, _ = _parse_front_matter(md_file.read_text(encoding="utf-8"))
        if not meta.get("title"):
            continue  # not a recognized topic page — skip rather than guess
        slug = md_file.stem
        try:
            order = int(meta.get("order", 999))
        except ValueError:
            order = 999
        topics.append({
            "slug": slug,
            "title": meta["title"],
            "icon": meta.get("emoji", "📄"),
            "chip": meta.get("chip", "peach"),
            "tag": meta.get("tag", slug.upper()[:3]),
            "desc": meta.get("desc", ""),
            "order": order,
            "url": f"topics/{slug}/",
        })

    topics.sort(key=lambda t: (t["order"], t["title"]))
    global _TOPICS
    _TOPICS = topics

    # Insert each topic's nav entry into the "Library" section, in the
    # order computed above — this is the only automatic part of nav;
    # mkdocs.yml itself only lists the fixed entries (Dashboard, All
    # Content, Progress) that aren't topics.
    for item in config.get("nav") or []:
        if isinstance(item, dict) and "Library" in item:
            library = item["Library"]
            for t in topics:
                library.append({t["title"]: f"topics/{t['slug']}.md"})
            break

    return config


def _article_info(src_uri):
    """(topic, collection, slug) for an article file, or None if it isn't one.

    Any markdown file nested at least one level under docs/topics/<topic>/
    is an article — whether it's .../<slug>/index.md or .../<slug>.md, flat
    or grouped in a collection. A topic's own landing page
    (topics/<topic>.md) and a topic folder's bare index.md are not.
    """
    parts = src_uri.replace("\\", "/").split("/")
    if len(parts) < 3 or parts[0] != "topics" or not parts[-1].endswith(".md"):
        return None
    name = parts[-1]
    dirs = parts[2:-1] if name == "index.md" else parts[2:-1] + [name[:-3]]
    if not dirs:
        return None
    return parts[1], (dirs[0] if len(dirs) >= 2 else None), dirs[-1]


def _note_date(meta, abs_path):
    """Front-matter `date`, else the file's last-modified day — so an article
    is never silently dropped (no prev/next, no related) just because the
    date line was forgotten."""
    if meta.get("date"):
        return str(meta["date"])
    try:
        return datetime.date.fromtimestamp(Path(abs_path).stat().st_mtime).isoformat()
    except OSError:
        return datetime.date.today().isoformat()


def _first_heading(body):
    for line in body.splitlines():
        if HEADING_RE.match(line):
            return line.lstrip("#").strip()
    return None


def _build_note(file, tag_map):
    info = _article_info(str(file.src_uri))
    if not info:
        return None
    topic_slug, collection, article_slug = info
    text = Path(file.abs_src_path).read_text(encoding="utf-8")
    meta, body = _parse_front_matter(text)
    words = _word_count(body)
    read_mins = max(1, round(words / 180))
    url = file.url
    note = {
        "title": meta.get("title") or _first_heading(body) or article_slug.replace("-", " ").title(),
        "url": url,
        "topic": topic_slug,
        "tag": meta.get("tag", tag_map.get(topic_slug, "WEB")),
        "date": _note_date(meta, file.abs_src_path),
        "readMins": read_mins,
    }
    if meta.get("excerpt"):
        note["excerpt"] = meta["excerpt"]
    if meta.get("cover_color"):
        note["coverColor"] = meta["cover_color"]
    if meta.get("cover_image"):
        note["coverImage"] = meta["cover_image"]
    if meta.get("cover_icon"):
        note["coverIcon"] = meta["cover_icon"]
    if meta.get("labels"):
        note["labels"] = [l.strip() for l in meta["labels"].split(",") if l.strip()]
    if meta.get("author"):
        note["author"] = meta["author"]
    if collection:
        note["collection"] = meta.get("collection_title", collection.replace("-", " ").upper())
    return note


def on_files(files, config, **kwargs):
    tag_map = {t["slug"]: t["tag"] for t in _TOPICS}
    notes = []

    # Every article is discovered from the files mkdocs itself found, so
    # the URL is always exactly the one mkdocs will serve — any depth, any
    # file name, with or without a `date` in its front matter.
    for f in sorted(files.documentation_pages(), key=lambda f: str(f.src_uri)):
        note = _build_note(f, tag_map)
        if note:
            notes.append(note)

    js = (
        "// AUTO-GENERATED at build time by hooks.py — do not edit by hand.\n"
        "// Notes: to change title/tag/date, edit that article's front matter —\n"
        "//   topic (+ collection, if any) and URL come from its folder path.\n"
        "// Topics: to add/edit one, edit docs/topics/<slug>.md's front matter —\n"
        "//   this list, its nav entry, and its dashboard card all come from there.\n"
        "var SN_NOTES = " + json.dumps(notes, ensure_ascii=False, indent=2) + ";\n"
        "var SN_TOPICS = " + json.dumps(_TOPICS, ensure_ascii=False, indent=2) + ";\n"
    )

    # IMPORTANT: this is written to a TEMP directory outside docs_dir, then
    # registered with mkdocs as a generated file. Writing it straight into
    # docs/javascripts/ would put it inside the folder `mkdocs serve`
    # watches for changes — every build would re-touch it, the watcher
    # would see "yet another edit", rebuild again, forever. A file mkdocs
    # generates itself is never watched, so that loop can't happen here.
    tmp_dir = Path(tempfile.mkdtemp(prefix="sn-notes-data-"))
    tmp_js_dir = tmp_dir / "javascripts"
    tmp_js_dir.mkdir(parents=True, exist_ok=True)
    (tmp_js_dir / "notes-data.js").write_text(js, encoding="utf-8")

    # Share cards, one per article, built into the same temp tree.
    _CARDS.clear()
    for n, f in ((n, f) for f in files.documentation_pages() for n in [_build_note(f, tag_map)] if n):
        if n.get("coverImage"):
            continue
        rel = "assets/social/" + re.sub(r"[^a-z0-9]+", "-", str(f.src_uri).lower()[:-3]).strip("-") + ".png"
        foot = f'{n["readMins"]} min read'
        if _render_card(tmp_dir / rel, n["title"], n["tag"], foot):
            _CARDS[str(f.src_uri)] = rel
            files.append(File(path=rel, src_dir=str(tmp_dir), dest_dir=config["site_dir"],
                              use_directory_urls=config["use_directory_urls"]))

    files.append(File(
        path="javascripts/notes-data.js",
        src_dir=str(tmp_dir),
        dest_dir=config["site_dir"],
        use_directory_urls=config["use_directory_urls"],
    ))
    return files


def on_page_markdown(markdown, page, config, files, **kwargs):
    meta = page.meta
    src = str(page.file.src_uri).replace("\\", "/")

    # A topic's own landing page (topics/<slug>.md, not nested deeper):
    # inject its H1 from front matter so the title never has to be typed
    # twice (once for the browser tab/nav, once in the body).
    is_topic_page = (
        src.startswith("topics/")
        and src.count("/") == 1
        and meta.get("title")
        and not meta.get("date")
    )
    if is_topic_page:
        slug = src.rsplit("/", 1)[-1][:-3]  # "topics/web-appsec.md" -> "web-appsec"
        if not HEADING_RE.match(markdown.lstrip().split("\n", 1)[0] or ""):
            markdown = f'# {meta["title"]}\n\n' + markdown
        if "sn-notes-list" not in markdown:
            desc = meta.get("desc", "")
            markdown += (
                f'\n\n{desc}\n\n'
                f'<div class="sn-notes-list" data-topic="{slug}"></div>\n\n'
                f'<div class="sn-empty-state" data-topic="{slug}" markdown>\n'
                f'!!! info "لسه فاضي"\n'
                f'    مفيش نوتس هنا لسه — أول ما تضيف فولدر مقال جوه '
                f'`docs/topics/{slug}/<اسم-المقال>/index.md` هيظهر هنا وفي الداشبورد أوتوماتيك.\n'
                f'</div>\n'
            )

    # Share/search description: explicit front matter wins, else the first
    # paragraph of the page. Material emits it as <meta name="description">.
    if not meta.get("description"):
        desc = meta.get("excerpt") or meta.get("desc") or _plain_description(markdown)
        if desc:
            meta["description"] = desc

    # Gate the published/read-time badge purely on having a `date` — true
    # for every real article, false for topic/aggregator pages — so it
    # works regardless of how deep the file sits or what it's named.
    if not _article_info(src):
        return markdown
    date = _note_date(meta, page.file.abs_src_path)
    author = str(meta.get("author", "")).replace('"', "").strip()
    author_attr = f' data-author="{author}"' if author else ""
    badge = (
        f'<p{author_attr}><span class="sn-pub-date" data-date="{date}"></span>'
        f' · <span class="sn-read-badge"></span></p>\n'
    )
    # An article with no H1 of its own gets one from its title.
    if meta.get("title") and not HEADING_RE.match(markdown.lstrip().split("\n", 1)[0] or ""):
        markdown = f'# {meta["title"]}\n\n' + markdown.lstrip()
    lines = markdown.split("\n", 1)
    if lines and HEADING_RE.match(lines[0]):
        rest = lines[1] if len(lines) > 1 else ""
        return lines[0] + "\n\n" + badge + "\n" + rest
    return badge + "\n" + markdown


def on_post_page(output, page, config, **kwargs):
    """Share-preview tags on every page, plus the bundled Mermaid on pages with a
    diagram (instead of Material's default of fetching it from unpkg.com, so
    diagrams and search work offline or when that CDN is blocked)."""
    if "</head>" in output:
        output = output.replace("</head>", _social_tags(page, config) + "</head>", 1)
    if 'class="mermaid"' not in output:
        return output
    src = get_relative_url("javascripts/vendor/mermaid.min.js", page.url)
    # Labels are measured when the diagram renders; if the web font isn't ready
    # yet the boxes come out too narrow and clip the text — so wait for fonts.
    tag = (
        f'<script src="{src}"></script>\n'
        "<script>(function(){var m=window.mermaid,f=document.fonts;if(!m||!f)return;"
        "['render','run'].forEach(function(k){var o=m[k];if(!o)return;"
        "m[k]=function(){var a=arguments,t=this;"
        "return Promise.all([f.load('16px \"IBM Plex Sans\"'),f.load('16px \"IBM Plex Sans Arabic\"')])"
        ".catch(function(){}).then(function(){return f.ready}).then(function(){return o.apply(t,a)})}})})();</script>\n"
    )
    marker = '<script id="__config"'
    return output.replace(marker, tag + marker, 1) if marker in output else output


def _social_tags(page, config):
    esc = lambda v: html.escape(str(v), quote=True)
    base = (config.get("site_url") or "").rstrip("/")
    meta = page.meta
    site = config.get("site_name", "")
    title = meta.get("title") or (page.title if page.title else site)
    full_title = title if title == site else f"{title} · {site}"
    desc = meta.get("description") or config.get("site_description") or ""
    is_article = bool(_article_info(str(page.file.src_uri).replace("\\", "/")))
    img = meta.get("cover_image") or _CARDS.get(str(page.file.src_uri)) or _DEFAULT_CARD
    img = img.lstrip("/")
    if base:
        url = base + "/" + page.url if page.url else base + "/"
        img_url = img if img.startswith("http") else f"{base}/{img}"
    else:
        url = ""
        img_url = img if img.startswith("http") else get_relative_url(img, page.url)
    tags = [
        ("property", "og:site_name", site),
        ("property", "og:type", "article" if is_article else "website"),
        ("property", "og:title", full_title),
        ("property", "og:description", desc),
        ("property", "og:image", img_url),
        ("property", "og:image:width", "1200"),
        ("property", "og:image:height", "630"),
        ("name", "twitter:card", "summary_large_image"),
        ("name", "twitter:title", full_title),
        ("name", "twitter:description", desc),
        ("name", "twitter:image", img_url),
    ]
    if url:
        tags.append(("property", "og:url", url))
    if is_article and meta.get("date"):
        tags.append(("property", "article:published_time", str(meta["date"])))
    if is_article and meta.get("author"):
        tags.append(("property", "article:author", str(meta["author"])))
    return "".join(f'<meta {a}="{b}" content="{esc(c)}">\n' for a, b, c in tags if c)
