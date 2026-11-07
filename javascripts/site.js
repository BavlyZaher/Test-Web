// ==========================================================================
// Sec-Notes — dynamic dashboard/topic rendering.
// Neither SN_NOTES nor SN_TOPICS is defined in this file — both come from
// docs/javascripts/notes-data.js, generated at build time by hooks.py:
//   - SN_NOTES from each article's front matter + real word count
//   - SN_TOPICS from each docs/topics/<slug>.md's own front matter
// This file only holds the rendering logic that consumes them. Adding a
// new topic or note is a one-file change — see hooks.py's header comment.
// ==========================================================================

if (typeof SN_NOTES === "undefined") { var SN_NOTES = []; }   // defensive fallback
if (typeof SN_TOPICS === "undefined") { var SN_TOPICS = []; } // defensive fallback

// ---- Site-root resolution --------------------------------------------------
// MkDocs writes THIS SAME file's own <script src> with the correct relative
// prefix for whatever depth the page sits at (e.g. "../../javascripts/site.js"
// two levels down). We read that prefix back, ONCE, and turn it into an
// absolute path from the domain root — so every link we build afterwards
// works from any page, at any depth, instead of being naively concatenated
// onto whatever page happens to be open when the click happens.
var SN_SITE_ROOT = (function () {
  try {
    var scripts = document.getElementsByTagName("script");
    var src = null;
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i].getAttribute("src") || "";
      if (s.indexOf("javascripts/site.js") !== -1) { src = s; break; }
    }
    if (!src) return "/";
    var prefix = src.slice(0, src.indexOf("javascripts/site.js"));
    return new URL(prefix || "./", window.location.href).pathname;
  } catch (e) {
    return "/";
  }
})();

function snUrl(path) {
  return SN_SITE_ROOT.replace(/\/$/, "") + "/" + String(path).replace(/^\//, "");
}

// ---- Helpers -------------------------------------------------------------

function snTopicCount(slug) {
  return SN_NOTES.filter(function (n) { return n.topic === slug; }).length;
}

function snNoteWord(count) {
  return count === 1 ? "note" : "notes";
}

function snRelativeTime(dateStr) {
  var then = new Date(dateStr + "T00:00:00");
  var now = new Date();
  var diffDays = Math.floor((now - then) / 86400000);
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return diffDays + " days ago";
  var weeks = Math.floor(diffDays / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return weeks + " weeks ago";
  var months = Math.floor(diffDays / 30);
  return months <= 1 ? "1 month ago" : months + " months ago";
}

function snIsNew(dateStr) {
  var then = new Date(dateStr + "T00:00:00");
  return (new Date() - then) / 86400000 <= 3;
}

function snIsWithinWeek(dateStr) {
  var then = new Date(dateStr + "T00:00:00");
  return (new Date() - then) / 86400000 <= 7;
}

function snTagClass(tag) {
  var map = { WEB: "web", NET: "net", AI: "ai", API: "api", DEV: "dev", HTB: "htb", WU: "wu" };
  return map[tag] || "web";
}

function snFormatDate(dateStr) {
  var months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  var d = new Date(dateStr + "T00:00:00");
  return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
}

// A single full-width, stacked "note row" card used both in "Recently
// added" and on each topic page — same component, so the site stays
// visually consistent everywhere a note is listed.
function snNoteRowHtml(note) {
  var badge = snIsNew(note.date) ? '<span class="sn-new-badge">NEW</span>' : "";
  var url = snUrl(note.url);
  var labels = note.labels || [];
  var labelsAttr = labels.join(",");
  var labelsHtml = labels.map(function (l) { return '<span class="note-label">' + l + '</span>'; }).join("");
  return (
    '<div class="note-row" data-tag="' + note.tag + '" data-labels="' + labelsAttr + '">' +
      '<a class="note-row-link" href="' + url + '">' +
        '<span class="recent-tag ' + snTagClass(note.tag) + '">' + note.tag + '</span>' +
        '<span class="note-row-title">' + note.title + badge + labelsHtml + '</span>' +
        '<span class="note-row-meta">' + note.readMins + ' min read · ' + snRelativeTime(note.date) + '</span>' +
      '</a>' +
    '</div>'
  );
}

// A magazine-style card, used only where a topic list opts in via
// data-view="cards" (currently just Write-ups) — a full technical note
// listing stays as the compact stacked rows above.
function snResolveCoverImage(note) {
  var img = note.coverImage;
  if (!img) return null;
  if (/^https?:\/\//.test(img) || img.charAt(0) === "/") return img;
  // A bare filename is resolved relative to the ARTICLE's own folder
  // (where it's expected to actually live), not the page showing the
  // card — same site-root-aware resolution as every other link here.
  return snUrl(note.url) + img;
}

function snBlogCardHtml(note) {
  var topic = SN_TOPICS.filter(function (t) { return t.slug === note.topic; })[0] || {};
  var icon = note.coverIcon || topic.icon || "📝";
  var coverImg = snResolveCoverImage(note);
  var coverStyle = "background-color:" + (note.coverColor || "#2a2620") + ";";
  if (coverImg) {
    coverStyle += "background-image:url('" + coverImg + "');background-size:cover;background-position:center;";
  }
  return (
    '<a class="blog-card" href="' + snUrl(note.url) + '">' +
      '<div class="blog-card-cover' + (coverImg ? ' has-image' : '') + '" style="' + coverStyle + '">' +
        '<span class="blog-card-cover-label">' + note.tag + '</span>' +
        '<span class="blog-card-cover-icon">' + icon + '</span>' +
      '</div>' +
      '<div class="blog-card-body">' +
        '<div class="blog-card-date">' + snFormatDate(note.date) + '</div>' +
        '<div class="blog-card-title">' + note.title + '</div>' +
        (note.excerpt ? '<div class="blog-card-excerpt">' + note.excerpt + '</div>' : '') +
        '<span class="blog-card-more">View more →</span>' +
      '</div>' +
    '</a>'
  );
}

// ---- Dashboard: topic grid + recently added ------------------------------

function snRenderDashboard() {
  var grid = document.getElementById("sn-topic-grid");
  if (grid && !grid.dataset.rendered) {
    grid.dataset.rendered = "1";
    grid.innerHTML = SN_TOPICS.map(function (t) {
      var count = snTopicCount(t.slug);
      return (
        '<div class="topic-card" data-href="' + snUrl(t.url) + '">' +
          '<div class="topic-icon ' + t.chip + '">' + t.icon + '</div>' +
          '<span class="topic-title">' + t.title + '</span>' +
          '<div class="topic-desc">' + t.desc + '</div>' +
          '<div class="topic-count">' + count + ' ' + snNoteWord(count) + '</div>' +
        '</div>'
      );
    }).join("");
  }

  var recent = document.getElementById("sn-recent-list");
  if (recent && !recent.dataset.rendered) {
    recent.dataset.rendered = "1";
    var sorted = SN_NOTES.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
    recent.innerHTML = sorted.slice(0, 5).map(snNoteRowHtml).join("");
  }

  var stats = document.getElementById("sn-stats");
  if (stats && !stats.dataset.rendered) {
    stats.dataset.rendered = "1";
    var weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    var newThisWeek = SN_NOTES.filter(function (n) {
      return new Date(n.date + "T00:00:00") >= weekAgo;
    }).length;
    var totalMins = SN_NOTES.reduce(function (sum, n) { return sum + n.readMins; }, 0);
    stats.innerHTML =
      '<span><strong>' + SN_TOPICS.length + '</strong> topics</span>' +
      '<span><strong>' + SN_NOTES.length + '</strong> notes so far</span>' +
      '<span><strong>' + newThisWeek + '</strong> new this week</span>' +
      '<span><strong>' + totalMins + '</strong> min of reading total</span>';
  }
}

// ---- Topic + Write-ups pages: full-width stacked note list, with an
// optional tag filter row on pages that list more than one tag. --------

// ---- Topic pages + All Content: full-width stacked note list, with a
// filter row. On "All Content" it filters by topic tag (WEB/NET/AI/...).
// On a single topic's own page it filters by that topic's finer-grained
// labels instead (XSS/SQLi/BAC/...), since every note there already
// shares the same topic tag — filtering by it would be pointless. -------

function snRenderTopicNotes() {
  document.querySelectorAll(".sn-notes-list[data-topic]").forEach(function (el) {
    if (el.dataset.rendered) return;
    el.dataset.rendered = "1";
    var slug = el.getAttribute("data-topic");
    var notes;
    var filterMode = null; // "tag" | "label" | null (no filter row)
    if (slug === "all") {
      notes = SN_NOTES.slice();
      filterMode = "tag";
    } else if (slug === "this-week") {
      notes = SN_NOTES.filter(function (n) { return snIsWithinWeek(n.date); });
    } else {
      notes = SN_NOTES.filter(function (n) { return n.topic === slug; });
      filterMode = "label";
    }
    notes.sort(function (a, b) { return b.date.localeCompare(a.date); });

    var empty = document.querySelector(".sn-empty-state[data-topic='" + slug + "']");
    if (notes.length === 0) {
      if (empty) empty.style.display = "";
      el.innerHTML = "";
      return;
    }
    if (empty) empty.style.display = "none";

    if (el.getAttribute("data-view") === "cards") {
      el.innerHTML = '<div class="blog-grid">' + notes.map(snBlogCardHtml).join("") + '</div>';
      return;
    }

    var filterHtml = "";
    if (filterMode === "tag") {
      var tags = [];
      notes.forEach(function (n) { if (tags.indexOf(n.tag) === -1) tags.push(n.tag); });
      if (tags.length > 1) {
        filterHtml =
          '<div class="sn-tag-filter" data-mode="tag">' +
            '<button class="sn-tag-pill active" data-filter="all">All</button>' +
            tags.map(function (t) {
              return '<button class="sn-tag-pill" data-filter="' + t + '">' + t + '</button>';
            }).join("") +
          '</div>';
      }
    } else if (filterMode === "label") {
      var labels = [];
      notes.forEach(function (n) {
        (n.labels || []).forEach(function (l) { if (labels.indexOf(l) === -1) labels.push(l); });
      });
      if (labels.length > 1) {
        filterHtml =
          '<div class="sn-tag-filter" data-mode="label">' +
            '<button class="sn-tag-pill active" data-filter="all">All</button>' +
            labels.map(function (l) {
              return '<button class="sn-tag-pill" data-filter="' + l + '">' + l + '</button>';
            }).join("") +
          '</div>';
      }
    }

    // Group by collection when any note declares one (e.g. a cert path
    // like "cpts" holding several modules); otherwise render as one flat
    // stacked list, same as before.
    var hasCollections = notes.some(function (n) { return n.collection; });
    var listHtml;
    if (hasCollections) {
      var groups = {};
      var order = [];
      notes.forEach(function (n) {
        var key = n.collection || "General";
        if (!groups[key]) { groups[key] = []; order.push(key); }
        groups[key].push(n);
      });
      listHtml = order.map(function (key) {
        return (
          '<div class="sn-group-title">📂 ' + key + '</div>' +
          '<div class="sn-notes-list-inner">' + groups[key].map(snNoteRowHtml).join("") + '</div>'
        );
      }).join("");
    } else {
      listHtml = '<div class="sn-notes-list-inner">' + notes.map(snNoteRowHtml).join("") + '</div>';
    }

    el.innerHTML = filterHtml + listHtml;

    el.querySelectorAll(".sn-tag-pill").forEach(function (pill) {
      pill.addEventListener("click", function () {
        el.querySelectorAll(".sn-tag-pill").forEach(function (p) { p.classList.remove("active"); });
        pill.classList.add("active");
        var filter = pill.getAttribute("data-filter");
        var mode = pill.closest(".sn-tag-filter").getAttribute("data-mode");
        el.querySelectorAll(".note-row").forEach(function (row) {
          if (filter === "all") { row.style.display = ""; return; }
          if (mode === "tag") {
            row.style.display = (row.getAttribute("data-tag") === filter) ? "" : "none";
          } else {
            var rowLabels = (row.getAttribute("data-labels") || "").split(",");
            row.style.display = (rowLabels.indexOf(filter) !== -1) ? "" : "none";
          }
        });
      });
    });
  });
}

// ---- Published date + live reading time on a note's own page -------------

function snRenderPublishedDates() {
  document.querySelectorAll(".sn-pub-date[data-date]").forEach(function (el) {
    el.textContent = "Published " + snRelativeTime(el.getAttribute("data-date"));
  });
}

function snRenderReadingTime() {
  var badge = document.querySelector(".sn-read-badge");
  if (!badge) return;
  var article = document.querySelector(".md-content__inner");
  if (!article) return;
  var text = article.textContent || "";
  var words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return;
  var mins = Math.max(1, Math.round(words / 180));
  badge.textContent = mins + " min read";
}

// ---- About page: two profile cards rendered from config -------------------
// Edit SN_ABOUT below to personalize (or delete the second entry if this
// is a solo project — the grid adapts to however many entries exist).

var SN_ABOUT = [
  {
    id: "your-name",   // used in an article's front matter:  author: your-name
    name: "Your Name",
    role: "Security Researcher",
    bio: "شغوف بأمن المعلومات ومكافآت الثغرات. بحط هنا كل حاجة بتعلمها وbug bounty write-ups.",
    avatarInitial: "Y",
    avatarImage: "",
    // any of: website, email, linkedin, twitter, facebook, github, youtube, telegram, discord, instagram
    // (empty ones are simply not shown; email can be "you@example.com")
    socials: {
      github: "https://github.com/username",
      linkedin: "https://linkedin.com/in/username",
      twitter: "https://x.com/username",
      telegram: "https://t.me/username",
      email: "you@example.com",
      website: "https://example.com"
    },
    skills: ["Web AppSec", "Bug Bounty", "Recon"],
    certificates: ["OSCP", "eJPT"],
    hallOfFame: ["Example Corp", "Another Co"]
  },
  {
    id: "co-founder",  // used in an article's front matter:  author: co-founder
    name: "Co-founder Name",
    role: "Security Trainer",
    bio: "مدرّب أمن معلومات بيبسّط المفاهيم المعقدة. بيكتب عن الشبكات والـ API Security. امسح الكارت ده من SN_ABOUT لو الموقع لشخص واحد بس.",
    avatarInitial: "C",
    avatarImage: "",
    socials: {
      github: "https://github.com/username2",
      linkedin: "https://linkedin.com/in/username2",
      youtube: "https://youtube.com/@username2",
      facebook: "https://facebook.com/username2",
      discord: "https://discord.gg/example"
    },
    skills: ["Networking", "API Security", "Training"],
    certificates: ["CEH", "Security+"],
    hallOfFame: ["Sample Labs"]
  }
];

// Brand icons (Font Awesome Free, CC BY 4.0): [viewBox, path]
var SN_ICONS = {"website":["0 0 512 512","M351.9 280H161c2.9 64.5 17.2 123.9 37.5 167.4 11.4 24.5 23.7 41.8 35.1 52.4 11.2 10.5 18.9 12.2 22.9 12.2s11.7-1.7 22.9-12.2c11.4-10.6 23.7-28 35.1-52.4 20.3-43.5 34.6-102.9 37.5-167.4zm-191-48h190.9c-2.8-64.5-17.1-123.9-37.4-167.4-11.4-24.4-23.7-41.8-35.1-52.4C268.1 1.7 260.4 0 256.4 0s-11.7 1.7-22.9 12.2c-11.4 10.6-23.7 28-35.1 52.4-20.3 43.5-34.6 102.9-37.5 167.4m-48 0c3.5-85.6 25.6-165.1 57.9-217.3C78.7 47.3 10.9 131.2 1.5 232zM1.5 280c9.4 100.8 77.2 184.7 169.3 217.3-32.3-52.2-54.4-131.7-57.9-217.3zm398.4 0c-3.5 85.6-25.6 165.1-57.9 217.3 92.1-32.7 159.9-116.5 169.3-217.3zm111.4-48C501.9 131.2 434.1 47.3 342 14.7c32.3 52.2 54.4 131.7 57.9 217.3z"],"email":["0 0 512 512","M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4l208 156a48 48 0 0 0 57.6 0l208-156c12.1-9.1 19.2-23.3 19.2-38.4 0-26.5-21.5-48-48-48zM0 196v188c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64V196L313.6 344.8c-34.1 25.6-81.1 25.6-115.2 0z"],"linkedin":["0 0 448 512","M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3M135.4 416H69V202.2h66.5V416zM102.2 96a38.5 38.5 0 1 1 0 77 38.5 38.5 0 1 1 0-77m282.1 320h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9z"],"twitter":["0 0 448 512","M357.2 48h70.6L273.6 224.2 455 464H313L201.7 318.6 74.5 464H3.8l164.9-188.5L-5.2 48h145.6l100.5 132.9zm-24.8 373.8h39.1L119.1 88h-42z"],"facebook":["0 0 512 512","M512 256C512 114.6 397.4 0 256 0S0 114.6 0 256c0 120 82.7 220.8 194.2 248.5V334.2h-52.8V256h52.8v-33.7c0-87.1 39.4-127.5 125-127.5 16.2 0 44.2 3.2 55.7 6.4V172c-6-.6-16.5-1-29.6-1-42 0-58.2 15.9-58.2 57.2V256h83.6l-14.4 78.2H287v175.9C413.8 494.8 512 386.9 512 256"],"github":["0 0 512 512","M173.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6m-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3m44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9M252.8 8C114.1 8 8 113.3 8 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C436.2 457.8 504 362.9 504 252 504 113.3 391.5 8 252.8 8M105.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1m-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7m32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1m-11.4-14.7c-1.6 1-1.6 3.6 0 5.9s4.3 3.3 5.6 2.3c1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2"],"youtube":["0 0 576 512","M549.7 124.1c-6.2-23.7-24.8-42.3-48.3-48.6C458.9 64 288.1 64 288.1 64S117.3 64 74.7 75.5c-23.5 6.3-42 24.9-48.3 48.6C15 167 15 256.4 15 256.4s0 89.4 11.4 132.3c6.3 23.6 24.8 41.5 48.3 47.8C117.3 448 288.1 448 288.1 448s170.8 0 213.4-11.5c23.5-6.3 42-24.2 48.3-47.8 11.4-42.9 11.4-132.3 11.4-132.3s0-89.4-11.4-132.3zM232.2 337.6V175.2l142.7 81.2z"],"telegram":["0 0 512 512","M256 8a248 248 0 1 0 0 496 248 248 0 1 0 0-496m115 168.7c-3.7 39.2-19.9 134.4-28.1 178.3-3.5 18.6-10.3 24.8-16.9 25.4-14.4 1.3-25.3-9.5-39.3-18.7-21.8-14.3-34.2-23.2-55.3-37.2-24.5-16.1-8.6-25 5.3-39.5 3.7-3.8 67.1-61.5 68.3-66.7.2-.7.3-3.1-1.2-4.4s-3.6-.8-5.1-.5c-2.2.5-37.1 23.5-104.6 69.1-9.9 6.8-18.9 10.1-26.9 9.9-8.9-.2-25.9-5-38.6-9.1-15.5-5-27.9-7.7-26.8-16.3.6-4.5 6.7-9 18.4-13.7 72.3-31.5 120.5-52.3 144.6-62.3 68.9-28.6 83.2-33.6 92.5-33.8 2.1 0 6.6.5 9.6 2.9 2 1.7 3.2 4.1 3.5 6.7.5 3.2.6 6.5.4 9.8z"],"discord":["0 0 576 512","M492.5 69.8c-.2-.3-.4-.6-.8-.7-38.1-17.5-78.4-30-119.7-37.1-.4-.1-.8 0-1.1.1s-.6.4-.8.8c-5.5 9.9-10.5 20.2-14.9 30.6-44.6-6.8-89.9-6.8-134.4 0-4.5-10.5-9.5-20.7-15.1-30.6-.2-.3-.5-.6-.8-.8s-.7-.2-1.1-.2C162.5 39 122.2 51.5 84.1 69c-.3.1-.6.4-.8.7C7.1 183.5-13.8 294.6-3.6 404.2c0 .3.1.5.2.8s.3.4.5.6c44.4 32.9 94 58 146.8 74.2.4.1.8.1 1.1 0s.7-.4.9-.7c11.3-15.4 21.4-31.8 30-48.8.1-.2.2-.5.2-.8s0-.5-.1-.8-.2-.5-.4-.6-.4-.3-.7-.4c-15.8-6.1-31.2-13.4-45.9-21.9-.3-.2-.5-.4-.7-.6s-.3-.6-.3-.9 0-.6.2-.9.3-.5.6-.7c3.1-2.3 6.2-4.7 9.1-7.1.3-.2.6-.4.9-.4s.7 0 1 .1c96.2 43.9 200.4 43.9 295.5 0 .3-.1.7-.2 1-.2s.7.2.9.4c2.9 2.4 6 4.9 9.1 7.2.2.2.4.4.6.7s.2.6.2.9-.1.6-.3.9-.4.5-.6.6c-14.7 8.6-30 15.9-45.9 21.8-.2.1-.5.2-.7.4s-.3.4-.4.7-.1.5-.1.8.1.5.2.8c8.8 17 18.8 33.3 30 48.8.2.3.6.6.9.7s.8.1 1.1 0c52.9-16.2 102.6-41.3 147.1-74.2.2-.2.4-.4.5-.6s.2-.5.2-.8c12.3-126.8-20.5-236.9-86.9-334.5zm-302 267.7c-29 0-52.8-26.6-52.8-59.2s23.4-59.2 52.8-59.2c29.7 0 53.3 26.8 52.8 59.2 0 32.7-23.4 59.2-52.8 59.2m195.4 0c-29 0-52.8-26.6-52.8-59.2s23.4-59.2 52.8-59.2c29.7 0 53.3 26.8 52.8 59.2 0 32.7-23.2 59.2-52.8 59.2"],"instagram":["0 0 448 512","M224.3 141a115 115 0 1 0-.6 230 115 115 0 1 0 .6-230m-.6 40.4a74.6 74.6 0 1 1 .6 149.2 74.6 74.6 0 1 1-.6-149.2m93.4-45.1a26.8 26.8 0 1 1 53.6 0 26.8 26.8 0 1 1-53.6 0m129.7 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8M399 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1"]};
var SN_SOCIAL_LABEL = { website: "Website", email: "Email", linkedin: "LinkedIn", twitter: "X", facebook: "Facebook", github: "GitHub", youtube: "YouTube", telegram: "Telegram", discord: "Discord", instagram: "Instagram" };

function snIconSvg(key) {
  var i = SN_ICONS[key];
  return i ? '<svg viewBox="' + i[0] + '" aria-hidden="true"><path d="' + i[1] + '"/></svg>' : "";
}
function snEsc(s) {
  return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
}

function snAboutCardHtml(person) {
  var avatarInner = person.avatarImage
    ? '<img src="' + snEsc(person.avatarImage) + '" alt="' + snEsc(person.name) + '">'
    : snEsc(person.avatarInitial);

  var socialsHtml = Object.keys(person.socials || {})
    .filter(function (k) { return person.socials[k] && SN_ICONS[k]; })
    .map(function (k) {
      var v = person.socials[k];
      var href = k === "email" && v.indexOf("mailto:") !== 0 ? "mailto:" + v : v;
      return '<a class="about-social about-social--' + k + '" href="' + snEsc(href) + '" target="_blank" rel="noopener" aria-label="' +
        SN_SOCIAL_LABEL[k] + '" title="' + SN_SOCIAL_LABEL[k] + '">' + snIconSvg(k) + '</a>';
    }).join("");

  // every card always has the same 9 rows, so cards line up whatever the content
  function pills(title, list, cls, prefix) {
    if (!list || !list.length) return '<div class="about-sec"></div>';
    return '<div class="about-sec"><div class="about-section-title">' + title + '</div><div class="about-pills">' +
      list.map(function (c) { return '<span class="about-pill ' + cls + '">' + (prefix || "") + snEsc(c) + '</span>'; }).join("") + '</div></div>';
  }

  var count = (window.SN_NOTES || []).filter(function (n) { return n.author === person.id; }).length;

  return (
    '<div class="about-card" id="' + snEsc(person.id || '') + '">' +
      '<div class="about-avatar">' + avatarInner + '</div>' +
      '<div class="about-name">' + snEsc(person.name) + '</div>' +
      '<div class="about-role">' + snEsc(person.role) + '</div>' +
      '<div class="about-bio">' + snEsc(person.bio) + '</div>' +
      '<div class="about-socials">' + socialsHtml + '</div>' +
      '<div class="about-stat-row"><span class="about-stat"><b>' + count + '</b> ' + (count === 1 ? 'article' : 'articles') + ' published</span></div>' +
      pills("Focus", person.skills, "about-pill--skill", "") +
      pills("Certificates", person.certificates, "", "") +
      pills("Hall of Fame", person.hallOfFame, "about-pill--hof", "🏆 ") +
    '</div>'
  );
}

function snRenderAbout() {
  var grid = document.getElementById("sn-about-grid");
  if (!grid || grid.dataset.rendered) return;
  grid.dataset.rendered = "1";
  grid.innerHTML = SN_ABOUT.map(snAboutCardHtml).join("");
  // Arriving from an article's author chip (about/#<id>): scroll to + highlight that card.
  var hash = decodeURIComponent((window.location.hash || "").slice(1));
  var card = hash && document.getElementById(hash);
  if (card && card.classList.contains("about-card")) {
    card.scrollIntoView({ block: "center" });
  }
}

// ---- Article author: avatar + name chip, links to that person's About card
// Pick the author per article in its front matter:   author: your-name
// (the id of an entry in SN_ABOUT above — an entry's position, 1 or 2,
// also works). No `author` line = nothing shown.

function snFindAuthor(key) {
  if (!key) return null;
  key = String(key).trim().toLowerCase();
  for (var i = 0; i < SN_ABOUT.length; i++) {
    var p = SN_ABOUT[i];
    if ((p.id && p.id.toLowerCase() === key) || String(i + 1) === key ||
        (p.name && p.name.toLowerCase() === key)) return p;
  }
  return null;
}

function snInitAuthor() {
  var meta = document.querySelector(".sn-pub-date");
  if (!meta || !meta.parentNode) return;
  var line = meta.parentNode;
  if (line.dataset.authorReady) return;
  line.dataset.authorReady = "1";
  var person = snFindAuthor(line.getAttribute("data-author"));
  if (!person) return;
  var avatar = person.avatarImage
    ? '<img src="' + person.avatarImage + '" alt="">'
    : person.avatarInitial;
  var a = document.createElement("a");
  a.className = "sn-author";
  a.href = snUrl("about/") + (person.id ? "#" + person.id : "");
  a.title = "About " + person.name;
  a.innerHTML = '<span class="sn-author-avatar">' + avatar + '</span><span>' + person.name + '</span>';
  line.parentNode.insertBefore(a, line.nextSibling);
}

// ---- Reading progress bar, sitting right under the sticky header --------
function snInitProgressBar() {
  var readBadge = document.querySelector(".sn-read-badge");
  if (!readBadge) {
    // not an article (dashboard, topic, About…): remove what a previous article left behind
    [".sn-progress-bar", ".sn-finished-badge"].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) el.remove();
    });
    return;
  }
  var bar = document.querySelector(".sn-progress-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.className = "sn-progress-bar";
    document.body.appendChild(bar);
  }
  var finished = document.querySelector(".sn-finished-badge");
  if (!finished) {
    finished = document.createElement("div");
    finished.className = "sn-finished-badge";
    finished.textContent = "✅ Finished reading";
    document.body.appendChild(finished);
  }
  var ticking = false;
  var headerH = 0;
  function measure() {
    var header = document.querySelector(".md-header");
    headerH = header ? header.offsetHeight : 0;
    bar.style.top = headerH + "px";
  }
  function paint() {
    ticking = false;
    var doc = document.documentElement;
    var scrollTop = doc.scrollTop || document.body.scrollTop;
    var height = doc.scrollHeight - doc.clientHeight;
    var pct = height > 0 ? Math.min(100, (scrollTop / height) * 100) : 0;
    var done = pct >= 95;
    bar.style.width = pct + "%";
    bar.classList.toggle("sn-progress-bar--hidden", done);
    finished.classList.toggle("visible", done);
    var ring = document.querySelector(".sn-timer-ring");
    if (ring) ring.style.setProperty("--p", (pct / 100).toFixed(3));
  }
  function update() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(paint);
  }
  if (!bar.dataset.bound) {
    bar.dataset.bound = "1";
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", function () { measure(); update(); });
  }
  measure();
  update();
}

// ---- Creative extra: flash-highlight the section a TOC link jumps to -----
function snInitTocFlash() {
  document.querySelectorAll(".md-nav--secondary a.md-nav__link").forEach(function (link) {
    if (link.dataset.flashBound) return;
    link.dataset.flashBound = "1";
    link.addEventListener("click", function () {
      var id = decodeURIComponent((link.hash || "").slice(1));
      setTimeout(function () {
        var target = document.getElementById(id);
        if (!target) return;
        target.classList.remove("sn-flash");
        void target.offsetWidth; // restart the animation if clicked again quickly
        target.classList.add("sn-flash");
        setTimeout(function () { target.classList.remove("sn-flash"); }, 1300);
      }, 50);
    });
  });
}


// ---- Creative extra #1: breadcrumb (Topic ▸ Collection ▸ Note) ----------
// Auto-derived from SN_TOPICS + SN_NOTES by matching the current URL —
// no extra front matter needed.

function snNormPath(p) {
  try { p = decodeURIComponent(p); } catch (e) {}
  return p.replace(/index\.html$/, "").replace(/\/+$/, "").toLowerCase() + "/";
}

// Matches the open page to its note regardless of trailing slash,
// index.html, URL-encoding, letter case, or the site being hosted under
// a sub-path — so no article silently "isn't found".
function snCurrentNote() {
  var path = snNormPath(window.location.pathname);
  var exact = SN_NOTES.filter(function (n) { return snNormPath(snUrl(n.url)) === path; })[0];
  if (exact) return exact;
  return SN_NOTES.filter(function (n) {
    var u = snNormPath("/" + n.url);
    return path.slice(-u.length) === u;
  })[0] || null;
}

// ---- Prev / next ordering, fully automatic -------------------------------
// Chronological (oldest → newest) within the note's own topic. If a topic
// only has this one note, fall back to the whole library so every article
// still gets a way forward.

function snByDate(a, b) {
  return a.date.localeCompare(b.date) || a.title.localeCompare(b.title);
}

function snTopicSiblings(note) {
  return SN_NOTES.filter(function (n) { return n.topic === note.topic; }).sort(snByDate);
}

function snNavOrder(note) {
  var sibs = snTopicSiblings(note);
  return sibs.length >= 2 ? sibs : SN_NOTES.slice().sort(snByDate);
}

function snInitPrevNext() {
  var badge = document.querySelector(".sn-read-badge");
  var article = document.querySelector(".md-content__inner");
  if (!badge || !article || article.querySelector(".sn-prevnext")) return;
  var note = snCurrentNote();
  if (!note) return;
  var order = snNavOrder(note);
  var idx = order.findIndex(function (n) { return n.url === note.url; });
  if (idx < 0) return;
  var prev = idx > 0 ? order[idx - 1] : null;
  var next = idx < order.length - 1 ? order[idx + 1] : null;
  if (!prev && !next) return;

  function card(n, cls, dir) {
    var topic = SN_TOPICS.filter(function (t) { return t.slug === n.topic; })[0];
    return '<a class="sn-prevnext-link ' + cls + '" href="' + snUrl(n.url) + '">' +
      '<span class="sn-prevnext-dir">' + dir + '</span>' +
      '<span class="sn-prevnext-title">' + n.title + '</span>' +
      (topic ? '<span class="sn-prevnext-topic">' + topic.icon + ' ' + topic.title + '</span>' : '') +
      '</a>';
  }
  var nav = document.createElement("div");
  nav.className = "sn-prevnext" + (prev && next ? "" : " sn-prevnext--single");
  nav.innerHTML =
    (prev ? card(prev, "sn-prevnext-prev", "← Previous") : "") +
    (next ? card(next, "sn-prevnext-next", "Next →") : "");
  article.appendChild(nav);

  if (!window.__snArrowNavBound) {
    window.__snArrowNavBound = true;
    document.addEventListener("keydown", function (e) {
      var tag = (document.activeElement && document.activeElement.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.metaKey || e.ctrlKey || e.altKey) return;
      var current = snCurrentNote();
      if (!current) return;
      var o = snNavOrder(current);
      var i = o.findIndex(function (n) { return n.url === current.url; });
      if (e.key === "ArrowRight" && i >= 0 && i < o.length - 1) {
        window.location.href = snUrl(o[i + 1].url);
      } else if (e.key === "ArrowLeft" && i > 0) {
        window.location.href = snUrl(o[i - 1].url);
      }
    });
  }
}

function snInitBreadcrumb() {
  var line = document.querySelector(".sn-pub-date");
  if (!line || !line.parentNode || line.parentNode.dataset.crumbReady) return;
  var note = snCurrentNote();
  if (!note) return;
  var topic = SN_TOPICS.filter(function (t) { return t.slug === note.topic; })[0];
  if (!topic) return;
  line.parentNode.dataset.crumbReady = "1";
  var parts = ['<a href="' + snUrl(topic.url) + '">' + topic.icon + ' ' + topic.title + '</a>'];
  if (note.collection) parts.push('<span>' + note.collection + '</span>');
  var crumb = document.createElement("div");
  crumb.className = "sn-breadcrumb";
  crumb.innerHTML = parts.join(' <span class="sn-breadcrumb-sep">›</span> ');
  line.parentNode.parentNode.insertBefore(crumb, line.parentNode);
}

// ---- Creative extra #2: "Related notes" from the same topic -------------
// Shown at the bottom of an article, pulling 3 other notes sharing the
// same topic — pure discovery, no config, reuses the same note-row look.

function snInitRelatedNotes() {
  var article = document.querySelector(".md-content__inner");
  if (!article || article.querySelector(".sn-related")) return;
  var note = snCurrentNote();
  if (!note) return;
  var mine = note.labels || [];
  function shared(n) {
    return (n.labels || []).filter(function (l) { return mine.indexOf(l) !== -1; }).length;
  }
  // Rank: same topic > shared labels > newest. Never empty while the
  // library has any other note, so every article gets suggestions.
  var related = SN_NOTES
    .filter(function (n) { return n.url !== note.url; })
    .sort(function (a, b) {
      var sa = (a.topic === note.topic ? 100 : 0) + shared(a) * 10;
      var sb = (b.topic === note.topic ? 100 : 0) + shared(b) * 10;
      return (sb - sa) || b.date.localeCompare(a.date);
    })
    .slice(0, 3);
  if (!related.length) return;
  var box = document.createElement("div");
  box.className = "sn-related";
  box.innerHTML =
    '<div class="sn-group-title">📎 Related notes</div>' +
    '<div class="sn-notes-list-inner">' + related.map(snNoteRowHtml).join("") + '</div>';
  article.appendChild(box);
}

// ---- Make markdown task-list checkboxes clickable ------------------------
// They render as read-only by default (disabled="disabled"). Enabling them
// lets the reader tick items off while reading — purely visual, kept only
// in memory for this page view: nothing is saved, so it resets the moment
// the page reloads or is closed.

function snEnableTaskLists() {
  document.querySelectorAll("li.task-list-item input[type='checkbox']").forEach(function (cb) {
    cb.disabled = false;
  });
}

// ---- Creative extra: live session timer, resets on refresh (no storage) --
function snInitSessionTimer() {
  var readBadge = document.querySelector(".sn-read-badge");
  var el = document.querySelector(".sn-session-timer");
  if (!readBadge) {
    if (el) el.style.display = "none"; // stay hidden away from actual notes
    return;
  }
  if (!el) {
    el = document.createElement("div");
    el.className = "sn-session-timer";
    el.title = "Time spent on this note · ring = how far you've read";
    el.innerHTML =
      '<span class="sn-timer-ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><polyline points="12 9 12 13 15 15"/><line x1="9" y1="2" x2="15" y2="2"/></svg></span>' +
      '<span class="sn-timer-text"><small>Reading</small><b class="sn-timer-val">0:00</b></span>';
    document.body.appendChild(el);
  }
  el.style.display = "";
  // restart the clock whenever a different note is opened (instant navigation)
  el._start = Date.now();
  if (el.dataset.bound) return;
  el.dataset.bound = "1";
  var val = el.querySelector(".sn-timer-val");
  function tick() {
    var ms = Date.now() - el._start;
    var mins = Math.floor(ms / 60000);
    var secs = Math.floor((ms % 60000) / 1000);
    val.textContent = mins + ":" + (secs < 10 ? "0" : "") + secs;
  }
  tick();
  setInterval(tick, 1000);
}

// ---- Creative extra: copy-link button next to the pub-date line ----------

function snInitCopyLink() {
  var badge = document.querySelector(".sn-read-badge");
  if (!badge || badge.dataset.copyReady) return;
  badge.dataset.copyReady = "1";
  var btn = document.createElement("button");
  btn.className = "sn-copy-link";
  btn.type = "button";
  btn.textContent = "🔗 copy link";
  btn.addEventListener("click", function () {
    var url = window.location.href;
    var done = function () { btn.textContent = "✓ copied"; setTimeout(function () { btn.textContent = "🔗 copy link"; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(function () { btn.textContent = "couldn't copy"; });
    } else {
      done();
    }
  });
  badge.parentNode.appendChild(document.createTextNode(" · "));
  badge.parentNode.appendChild(btn);
}

// ---- Hide the empty table-of-contents sidebar column ----------------------
// Material always renders .md-sidebar--secondary, even on pages with no
// headings — its <nav> just ends up containing whitespace only. Left alone
// that shows up as a bare, empty scrollbar with nothing in it, so we hide
// the whole column whenever its TOC list has no actual entries.

function snHideEmptyToc() {
  document.querySelectorAll(".md-sidebar--secondary").forEach(function (sidebar) {
    var hasItems = !!sidebar.querySelector(".md-nav__item");
    sidebar.style.display = hasItems ? "" : "none";
    document.documentElement.classList.toggle("sn-no-toc", !hasItems);
  });
}

function snInitSearchShortcut() {
  if (window.__snSearchShortcutBound) return;
  window.__snSearchShortcutBound = true;
  document.addEventListener("keydown", function (e) {
    if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (document.activeElement && document.activeElement.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    var toggle = document.querySelector('[data-md-toggle="search"]');
    if (!toggle) return;
    e.preventDefault();
    toggle.checked = true;
    setTimeout(function () {
      var input = document.querySelector(".md-search__input");
      if (input) input.focus();
    }, 50);
  });
}

// ---- Wire everything up, including Material's instant-navigation --------

function snRenderAll() {
  // Each feature is isolated: one failing shouldn't block the rest.
  [snRenderDashboard, snRenderTopicNotes, snRenderPublishedDates,
   snRenderReadingTime, snInitCopyLink, snInitProgressBar,
   snInitBreadcrumb, snInitRelatedNotes, snEnableTaskLists,
   snInitTocFlash, snInitPrevNext, snInitSessionTimer,
   snInitSearchShortcut, snHideEmptyToc, snRenderAbout, snInitAuthor,
   snAutoDir].forEach(function (fn) {
    try { fn(); } catch (e) { console.error("sec-notes:", fn.name, e); }
  });
}

document.addEventListener("DOMContentLoaded", snRenderAll);
if (typeof document$ !== "undefined") {
  document$.subscribe(snRenderAll);
}


// ==========================================================================
// Reading comfort + delight
// ==========================================================================

// ---- Mixed Arabic / English: every text block picks its own direction ----
// (Arabic paragraphs flow right-to-left and align right, English stay
// left-to-right, even when they share a page or a list.)
function snAutoDir() {
  document.querySelectorAll(
    ".md-typeset p, .md-typeset li, .md-typeset blockquote, .md-typeset h1, .md-typeset h2, " +
    ".md-typeset h3, .md-typeset h4, .md-typeset h5, .md-typeset td, .md-typeset th, " +
    ".md-typeset .admonition-title, .md-typeset summary"
  ).forEach(function (el) {
    if (!el.hasAttribute("dir")) el.setAttribute("dir", "auto");
  });
}

// ---- Cursor spotlight on cards (sets --mx / --my on the hovered card only,
// at most once per frame; CSS paints the glow) ----------------------------
if (!window.__snSpotlight) {
  window.__snSpotlight = true;
  var snSpotEvt = null, snSpotQueued = false;
  document.addEventListener("mousemove", function (e) {
    snSpotEvt = e;
    if (snSpotQueued) return;
    snSpotQueued = true;
    requestAnimationFrame(function () {
      snSpotQueued = false;
      var ev = snSpotEvt;
      var c = ev && ev.target.closest && ev.target.closest(".topic-card, .note-row, .about-card, .sn-prevnext-link, .blog-card, .stat-strip > span");
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (ev.clientX - r.left) + "px");
      c.style.setProperty("--my", (ev.clientY - r.top) + "px");
    });
  }, { passive: true });
}
