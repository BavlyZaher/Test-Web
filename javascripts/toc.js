// ==========================================================================
// toc.js — TOC scroll-spy (nothing is stored in the browser)
//   Highlights the heading you're on, keeps it in view as the page scrolls
//   (the rail follows you), sets the reading progress (--sn-pct) and, on
//   small screens, offers the same sections as a floating button + sheet.
// ==========================================================================
(function () {
  "use strict";

  // ---- TOC scroll-spy -------------------------------------------------------
  // Own implementation (Material's tracking skips headings whose ids contain
  // Arabic/emoji). Heading positions are cached, so a scroll frame is just a
  // loop over numbers — no layout reads.
  var spy = { items: [], tops: [], cur: -2, wrap: null, sheet: null, headerH: 0, queued: false, bound: false };

  function spyMeasure() {
    var h = document.querySelector(".md-header");
    spy.headerH = h ? h.offsetHeight : 0;
    var sy = window.pageYOffset;
    spy.tops = spy.items.map(function (it) { return it.el.getBoundingClientRect().top + sy; });
  }
  function spyApply(cur) {
    syncSheet(cur);
    spy.items.forEach(function (it, i) {
      it.a.classList.toggle("is-current", i === cur);
      it.a.classList.toggle("is-passed", i < cur);
    });
    if (spy.wrap && cur >= 0) {                       // the rail follows the page: current item sits ~40% down
      var lr = spy.items[cur].a.getBoundingClientRect(), wr = spy.wrap.getBoundingClientRect();
      var delta = (lr.top + lr.height / 2) - (wr.top + wr.height * 0.4);
      if (Math.abs(delta) > 4) spy.wrap.scrollBy({ top: delta, behavior: "smooth" });
    }
  }

  // ---- Mobile: a floating "sections" button + bottom sheet (the rail is hidden there) ----
  function removeSheet() {
    [".sn-toc-fab", ".sn-toc-sheet", ".sn-toc-backdrop"].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) el.remove();
    });
  }
  function buildSheet() {
    removeSheet();
    if (spy.items.length < 2 || !document.querySelector(".sn-read-badge")) return;
    var fab = document.createElement("button");
    fab.type = "button";
    fab.className = "sn-toc-fab";
    fab.setAttribute("aria-label", "Sections of this page");
    fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="15" y2="12"/><line x1="4" y1="18" x2="10" y2="18"/></svg>';
    var back = document.createElement("div");
    back.className = "sn-toc-backdrop";
    var box = document.createElement("div");
    box.className = "sn-toc-sheet";
    var html = '<div class="sn-toc-sheet-title">— ON THIS PAGE</div>';
    spy.items.forEach(function (it, i) {
      var depth = -1;                                  // how deeply the link is nested in the TOC
      for (var n = it.a; n && !n.classList.contains("md-nav--secondary"); n = n.parentElement) {
        if (n.classList.contains("md-nav__list")) depth++;
      }
      depth = Math.min(2, Math.max(0, depth));
      var txt = it.a.textContent.replace(/</g, "&lt;").trim();
      html += '<a href="#" class="d' + depth + '" data-i="' + i + '">' + txt + '</a>';
    });
    box.innerHTML = html;
    function open(on) { document.documentElement.classList.toggle("sn-toc-open", on); }
    fab.addEventListener("click", function () { open(!document.documentElement.classList.contains("sn-toc-open")); });
    back.addEventListener("click", function () { open(false); });
    box.addEventListener("click", function (e) {
      var a = e.target.closest("a[data-i]");
      if (!a) return;
      e.preventDefault();
      var it = spy.items[+a.dataset.i];
      open(false);
      if (it) window.scrollTo({ top: it.el.getBoundingClientRect().top + window.pageYOffset - spy.headerH - 12, behavior: "smooth" });
    });
    document.body.appendChild(back);
    document.body.appendChild(box);
    document.body.appendChild(fab);
    spy.sheet = box;
    syncSheet(spy.cur);
  }
  function syncSheet(cur) {
    if (!spy.sheet) return;
    [].forEach.call(spy.sheet.querySelectorAll("a[data-i]"), function (a, i) {
      a.classList.toggle("is-current", i === cur);
      a.classList.toggle("is-passed", i < cur);
    });
  }

  function spyTick() {
    spy.queued = false;
    if (!spy.items.length) return;
    var y = window.pageYOffset + spy.headerH + 30;
    var cur = -1;
    for (var i = 0; i < spy.tops.length; i++) if (spy.tops[i] <= y) cur = i;
    if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 4) cur = spy.items.length - 1;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (spy.wrap) spy.wrap.style.setProperty("--sn-pct", (max > 0 ? Math.min(100, Math.max(0, window.pageYOffset / max * 100)) : 0).toFixed(1) + "%");
    if (cur === spy.cur) return;
    spy.cur = cur;
    spyApply(cur);
  }
  function spyReq() { if (!spy.queued) { spy.queued = true; requestAnimationFrame(spyTick); } }
  function initSpy() {
    var nav = document.querySelector(".md-sidebar--secondary .md-nav--secondary");
    spy.items = [];
    spy.cur = -2;
    if (nav) {
      // Material may rewrite hrefs to absolute URLs, so read .hash instead of the attribute
      [].slice.call(nav.querySelectorAll("a.md-nav__link")).forEach(function (a) {
        if (!a.hash) return;
        var id;
        try { id = decodeURIComponent(a.hash.slice(1)); } catch (e) { id = a.hash.slice(1); }
        var el = document.getElementById(id);
        if (el) spy.items.push({ a: a, el: el });
      });
    }
    spy.wrap = document.querySelector(".md-sidebar--secondary .md-sidebar__scrollwrap");
    document.documentElement.classList.remove("sn-toc-open");
    if (!spy.items.length) { removeSheet(); return; }
    spyMeasure();
    buildSheet();
    spyTick();
    if (!spy.bound) {
      spy.bound = true;
      window.addEventListener("scroll", spyReq, { passive: true });
      window.addEventListener("resize", function () { spyMeasure(); spy.cur = -2; spyReq(); });
    }
    // images / fonts / code blocks finish laying out a moment later
    setTimeout(function () { spyMeasure(); spy.cur = -2; spyTick(); }, 700);
  }

  // ---- go ------------------------------------------------------------------
  function schedule() { setTimeout(initSpy, 0); }
  document.addEventListener("DOMContentLoaded", schedule);
  if (typeof document$ !== "undefined") document$.subscribe(schedule);
})();
