// Injects a compact identity block (avatar + name + subtitle) and a
// search box above the primary nav, matching the reference dashboard design.
// Edit SN_PROFILE below to personalize it.

var SN_PROFILE = {
  name: "Sec-Notes",
  subtitle: "Personal study vault",
  avatarInitial: "S",
  avatarImage: ""   // paste an image URL here to use a real photo instead of the initial
};

function snInjectProfile() {
  document.querySelectorAll('.md-sidebar--primary .md-sidebar__scrollwrap').forEach(function (wrap) {
    if (wrap.querySelector('.sn-identity')) return;

    var avatarInner = SN_PROFILE.avatarImage
      ? '<img src="' + SN_PROFILE.avatarImage + '" alt="' + SN_PROFILE.name + '">'
      : SN_PROFILE.avatarInitial;

    var identity = document.createElement('div');
    identity.className = 'sn-identity';
    identity.innerHTML =
      '<div class="sn-avatar">' + avatarInner + '</div>' +
      '<div>' +
        '<div class="sn-name">' + SN_PROFILE.name + '</div>' +
        '<div class="sn-subtitle">' + SN_PROFILE.subtitle + '</div>' +
      '</div>';

    var aboutBtn = document.createElement('div');
    aboutBtn.className = 'sn-about-btn';
    aboutBtn.setAttribute('role', 'button');
    aboutBtn.setAttribute('tabindex', '0');
    aboutBtn.innerHTML = '<span>👤</span><span>About Us</span>';
    function goAbout() {
      var url = typeof window.snUrl === 'function' ? window.snUrl('about/') : 'about/';
      window.location.href = url;
    }
    aboutBtn.addEventListener('click', goAbout);
    aboutBtn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') goAbout();
    });

    var random = document.createElement('div');
    random.className = 'sn-random';
    random.setAttribute('role', 'button');
    random.setAttribute('tabindex', '0');
    random.innerHTML = '<span>🎲</span><span>Surprise me</span>';
    function goRandom() {
      if (!window.SN_NOTES || !window.SN_NOTES.length) return;
      var pick = window.SN_NOTES[Math.floor(Math.random() * window.SN_NOTES.length)];
      var url = typeof window.snUrl === "function" ? window.snUrl(pick.url) : pick.url;
      window.location.href = url;
    }
    random.addEventListener('click', goRandom);
    random.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') goRandom();
    });

    var search = document.createElement('div');
    search.className = 'sn-search';
    search.setAttribute('role', 'button');
    search.setAttribute('tabindex', '0');
    search.innerHTML = '<span class="sn-search-icon">🔍</span><span class="sn-search-text">Search notes…</span><kbd class="sn-kbd">/</kbd>';
    function openSearch() {
      var toggle = document.querySelector('[data-md-toggle="search"]');
      if (toggle) toggle.checked = true;
      setTimeout(function () {
        var input = document.querySelector('.md-search__input');
        if (input) input.focus();
      }, 50);
    }
    search.addEventListener('click', openSearch);
    search.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') openSearch();
    });

    var nav = wrap.querySelector('.md-nav--primary');
    if (nav && nav.parentNode) {
      var quick = document.createElement('div');
      quick.className = 'sn-quick';
      quick.appendChild(aboutBtn);
      quick.appendChild(random);
      nav.parentNode.insertBefore(identity, nav);
      nav.parentNode.insertBefore(search, nav);
      nav.parentNode.insertBefore(quick, nav);
    }
  });
}

document.addEventListener('DOMContentLoaded', snInjectProfile);
if (typeof document$ !== 'undefined') {
  document$.subscribe(snInjectProfile);
}

// ---- Real icons per nav item, instead of a plain bullet -------------------
// Turns the left menu from a bare text list into an icon+label nav. Topic
// items (Web AppSec, HTB, ...) pull their icon + color straight from
// SN_TOPICS — the same data the dashboard cards use — so a brand-new topic
// gets its sidebar icon automatically too, with zero extra editing anywhere.
// The handful of fixed, non-topic entries (Dashboard, All Content, This
// week) use this small manual map instead, since they aren't topics.
var SN_FIXED_NAV_ICONS = {
  'Dashboard': '🏠',
  'All Content': '📚',
  'This week': '🗓️'
};

function snTopicByUrl(href) {
  if (!window.SN_TOPICS) return null;
  for (var i = 0; i < window.SN_TOPICS.length; i++) {
    var t = window.SN_TOPICS[i];
    if (href.indexOf(t.url) !== -1) return t;
  }
  return null;
}

function snInjectNavIcons() {
  document.querySelectorAll('.md-nav--primary .md-nav__item .md-nav__item > a.md-nav__link').forEach(function (link) {
    if (link.dataset.iconReady) return;
    var href = link.getAttribute('href') || '';
    var topic = snTopicByUrl(href);
    var label = link.textContent.trim();
    var icon = topic ? topic.icon : SN_FIXED_NAV_ICONS[label];
    if (!icon) return;
    link.dataset.iconReady = '1';
    var span = document.createElement('span');
    span.className = 'sn-nav-icon' + (topic ? ' sn-nav-icon--' + topic.chip : '');
    span.textContent = icon;
    link.insertBefore(span, link.firstChild);

    // Little count pill on the right: notes in that topic (All Content = all notes).
    var count = null;
    if (topic && typeof window.snTopicCount === 'function') count = window.snTopicCount(topic.slug);
    else if (label === 'All Content' && window.SN_NOTES) count = window.SN_NOTES.length;
    if (count) {
      var pill = document.createElement('span');
      pill.className = 'sn-nav-count';
      pill.textContent = count;
      link.appendChild(pill);
    }
  });
}

document.addEventListener('DOMContentLoaded', snInjectNavIcons);
if (typeof document$ !== 'undefined') {
  document$.subscribe(snInjectNavIcons);
}

// Makes any element with data-href act as a full clickable card.
document.addEventListener('click', function (e) {
  var card = e.target.closest('[data-href]');
  if (card) window.location.href = card.getAttribute('data-href');
});


// ---- Rail toggle: a tab on the sidebar's edge that hides / shows the menu --
function snRailGet() { return document.documentElement.classList.contains('sn-rail-collapsed'); }

function snApplyRail(collapsed) {
  document.documentElement.classList.toggle('sn-rail-collapsed', collapsed);
  var b = document.querySelector('.sn-rail-toggle');
  if (b) {
    b.setAttribute('aria-expanded', String(!collapsed));
    b.title = collapsed ? 'Show menu  ([)' : 'Hide menu  ([)';
  }
}

function snInitRailToggle() {
  if (document.querySelector('.sn-rail-toggle')) return;
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'sn-rail-toggle';
  btn.setAttribute('aria-label', 'Toggle menu');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 6 9 12 15 18"/></svg>';
  document.body.appendChild(btn);
  function toggle() {
    var c = !document.documentElement.classList.contains('sn-rail-collapsed');
    snApplyRail(c);
  }
  btn.addEventListener('click', toggle);
  document.addEventListener('keydown', function (e) {
    if (e.key !== '[' || e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (document.activeElement && document.activeElement.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    toggle();
  });
  snApplyRail(snRailGet());
}
document.addEventListener('DOMContentLoaded', snInitRailToggle);
if (typeof document$ !== 'undefined') { document$.subscribe(snInitRailToggle); }

// ---- Code blocks: label each one with its language (PHP, HTML, …) ----------
var SN_LANG_NAMES = { js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', typescript: 'TypeScript',
  py: 'Python', python: 'Python', php: 'PHP', html: 'HTML', xml: 'XML', css: 'CSS', json: 'JSON', yaml: 'YAML',
  yml: 'YAML', sql: 'SQL', bash: 'Bash', sh: 'Shell', shell: 'Shell', zsh: 'Shell', http: 'HTTP', java: 'Java',
  c: 'C', cpp: 'C++', csharp: 'C#', go: 'Go', rust: 'Rust', ruby: 'Ruby', powershell: 'PowerShell',
  text: 'Text', txt: 'Text', diff: 'Diff', ini: 'INI', toml: 'TOML', md: 'Markdown', markdown: 'Markdown' };

function snLabelCodeBlocks() {
  document.querySelectorAll('.md-typeset .highlight').forEach(function (hl) {
    if (hl.dataset.lang) return;
    var holder = hl.closest('[class*="language-"]') || hl;
    var m = (holder.className || '').match(/language-([\w+#-]+)/);
    var key = m ? m[1].toLowerCase() : '';
    hl.dataset.lang = key ? (SN_LANG_NAMES[key] || key) : 'code';
  });
}
document.addEventListener('DOMContentLoaded', snLabelCodeBlocks);
if (typeof document$ !== 'undefined') { document$.subscribe(snLabelCodeBlocks); }


// ---- TOC rail toggle (right edge) — mirror of the menu toggle -------------
function snTocGet() { return document.documentElement.classList.contains('sn-toc-collapsed'); }
function snApplyToc(collapsed) {
  document.documentElement.classList.toggle('sn-toc-collapsed', collapsed);
  var b = document.querySelector('.sn-toc-toggle');
  if (b) { b.setAttribute('aria-expanded', String(!collapsed)); b.title = collapsed ? 'Show contents  (])' : 'Hide contents  (])'; }
}
function snInitTocToggle() {
  if (document.querySelector('.sn-toc-toggle')) return;
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'sn-toc-toggle';
  btn.setAttribute('aria-label', 'Toggle table of contents');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>';
  document.body.appendChild(btn);
  function toggle() {
    var c = !document.documentElement.classList.contains('sn-toc-collapsed');
    snApplyToc(c);
  }
  btn.addEventListener('click', toggle);
  document.addEventListener('keydown', function (e) {
    if (e.key !== ']' || e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (document.activeElement && document.activeElement.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    toggle();
  });
  snApplyToc(snTocGet());
}
document.addEventListener('DOMContentLoaded', snInitTocToggle);
if (typeof document$ !== 'undefined') { document$.subscribe(snInitTocToggle); }


// ---- Clicking the site title (header) or the sidebar identity card → Dashboard.
// Triggers the logo link so Material's instant navigation handles it.
document.addEventListener('click', function (e) {
  if (!e.target.closest('.md-header__title, .sn-identity')) return;
  var logo = document.querySelector('a.md-header__button.md-logo');
  if (logo) logo.click();
});
