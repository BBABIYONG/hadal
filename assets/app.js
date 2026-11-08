/* =========================================================
   하달의 너머 — 송신 문서
   내용은 전부 data.json 에서 읽는다.
   ========================================================= */
(function () {
  "use strict";

  var D = null;
  var view = document.getElementById("view");
  var navEl = document.getElementById("nav");
  var filter = { q: "", tag: "" };
  var STILL = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var CH = [
    { id: "home",  no: "00", hash: "#/",      name: "입구",          en: "Entrance" },
    { id: "works", no: "01", hash: "#/works", name: "건져 올린 것들", en: "Salvaged",
      blurb: "하달 너머에서 건져 와 빚은 것들. 주파수가 맞으면, 지상에서도 이들에게 말을 걸 수 있습니다." },
    { id: "log",   no: "02", hash: "#/log",   name: "교신 일지",     en: "Logbook",  blurb: "새로 보낸 것, 고친 것, 알릴 것." },
    { id: "lore",  no: "03", hash: "#/lore",  name: "너머의 기록",   en: "Records",  blurb: "세계와 설정, 너머에서 들려온 말." },
    { id: "maker", no: "04", hash: "#/maker", name: "송신소",        en: "Station",  blurb: "하달 아래에서 이야기를 빚는 자." }
  ];
  var STATUS = { open: ["송출 중", "open"], prep: ["조율 중", "prep"], hold: ["두절", "hold"] };

  /* ---------- 유틸 ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safeUrl(u) {
    u = String(u == null ? "" : u).trim();
    return /^https?:\/\//i.test(u) ? u : "#";
  }
  function byId(list, id) { for (var i = 0; i < (list || []).length; i++) if (list[i].id === id) return list[i]; return null; }
  function sorted(list) { return (list || []).slice().sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); }); }
  function dot(d) { return String(d || "").replace(/-/g, "."); }
  function pad(n) { return String(n).padStart(2, "0"); }

  function paintNav(id) {
    navEl.innerHTML = CH.map(function (c) {
      return '<a href="' + c.hash + '" class="' + (c.id === id ? "on" : "") + '"><em>' + c.no + "</em>" + esc(c.name) + "</a>";
    }).join("");
  }

  /* ---------- 입구 ---------- */
  function star(x, y, r, cls) {
    var k = r * 0.16;
    return '<path class="star ' + (cls || "") + '" d="M' + x + " " + (y - r) + " Q" + (x + k) + " " + (y - k) + " " + (x + r) + " " + y +
      " Q" + (x + k) + " " + (y + k) + " " + x + " " + (y + r) + " Q" + (x - k) + " " + (y + k) + " " + (x - r) + " " + y +
      " Q" + (x - k) + " " + (y - k) + " " + x + " " + (y - r) + 'Z"/>';
  }
  function orbitSVG() {
    return '<svg class="orbit" viewBox="0 0 900 640" aria-hidden="true">' +
      '<circle class="ring" cx="470" cy="330" r="270"/>' +
      '<circle class="ring d" cx="470" cy="330" r="200"/>' +
      '<ellipse class="ring" cx="470" cy="330" rx="430" ry="120" transform="rotate(-14 470 330)"/>' +
      '<line class="ring" x1="470" y1="20" x2="470" y2="640" stroke-dasharray="2 6"/>' +
      '<circle class="ping" cx="470" cy="330" r="300"/><circle class="ping" cx="470" cy="330" r="300"/><circle class="ping" cx="470" cy="330" r="300"/>' +
      '<circle cx="470" cy="330" r="3.5" fill="#4865FF"/>' +
      star(738, 228, 22) + star(206, 452, 12, "k") + star(612, 86, 8) + star(82, 300, 6, "k") +
      '<text x="478" y="44">11,034 m</text><text x="478" y="626">∞</text>' +
      '<text x="748" y="268">[ 신호원 ]</text>' +
      "</svg>";
  }

  function renderHome() {
    var s = D.site || {};
    view.innerHTML =
      '<section class="still">' +
        '<canvas class="sea" id="heroSea" aria-hidden="true"></canvas>' +
        '<div class="lone" aria-hidden="true"><i></i><i></i><b></b></div>' +
        '<div class="frame still-in">' +
          '<p class="still-en">Beyond the Hadal</p>' +
          "<h1>" + esc(s.title || "하달의 너머") + "</h1>" +
          '<p class="still-line">' + esc(s.tagline || "") + "</p>" +
          '<a class="still-go" href="#/works">건져 올린 것들</a>' +
        "</div>" +
      "</section>";
    seas.push(makeSea(document.getElementById("heroSea"), { v0: innerWidth < 720 ? 0.7 : 0.68, cell: innerWidth < 720 ? 1.6 : 1, amp: 0.42, speed: 0.55, band: true, scale: 0.5 }));
  }

  /* ---------- 건져 올린 것들 ---------- */
  /* 작품 안의 인물을 한 줄로 편다. 인물이 없는 작품은 작품 자체를 한 칸으로 */
  function entries() {
    var out = [];
    sorted(D.works).forEach(function (w) {
      if (w.public === false) return;                       /* 작품째 비공개 */
      var cs = (w.characters || []).filter(function (c) { return c.public !== false; });
      if (!(w.characters || []).length) cs = [{ id: "_", name: w.title, en: "", role: w.tagline, img: w.thumb, profile: [], about: w.intro, tmi: [], gallery: [], prompt: w.prompt, _solo: true }];
      cs.forEach(function (c) { out.push({ w: w, c: c }); });
    });
    return out;
  }
  function entryHash(e) { return "#/works/" + e.w.id + "/" + e.c.id; }
  function allTags() {
    var seen = {}, out = [];
    D.works.forEach(function (w) { (w.tags || []).forEach(function (t) { if (!seen[t]) { seen[t] = 1; out.push(t); } }); });
    return out;
  }
  function matched() {
    var q = filter.q.trim().toLowerCase();
    return entries().filter(function (e) {
      var w = e.w, c = e.c;
      if (filter.tag && (w.tags || []).indexOf(filter.tag) < 0) return false;
      if (!q) return true;
      return [c.name, c.en, c.role, w.title, w.code, (w.tags || []).join(" ")].join(" ").toLowerCase().indexOf(q) >= 0;
    });
  }
  function specHTML(e) {
    var w = e.w, c = e.c, st = STATUS[w.status] || STATUS.open, src = c.img || w.thumb;
    return '<a class="spec" href="' + entryHash(e) + '">' +
      '<div class="meta"><span>' + esc(w.code || "") + '</span><span class="st ' + st[1] + '">( ' + st[0] + " )</span></div>" +
      '<div class="pic">' +
        (src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : '<div class="nosig"><span>NO SIGNAL</span><span>' + dot(w.date) + "</span></div>") +
        (w.adult ? '<span class="flag">19</span>' : "") +
        (w.example ? '<span class="flag ex">예시</span>' : "") +
      "</div>" +
      "<h3>" + esc(c.name) + "</h3>" +
      (c._solo ? "" : '<p class="from">' + esc(w.title) + "</p>") +
      (c.role ? "<p>" + esc(c.role) + "</p>" : "") +
    "</a>";
  }
  function slot(list) {
    return list.length ? '<div class="specimens">' + list.map(specHTML).join("") + "</div>"
                       : '<div class="empty">( 이 주파수에는 아무 신호도 잡히지 않습니다 )</div>';
  }
  function renderWorks() {
    var c = byId(CH, "works"), list = matched(), tags = allTags();
    view.innerHTML =
      '<header class="frame"><div class="phead">' +
        '<span class="big">' + c.no + "</span>" +
        "<h1>" + esc(c.name) + "<i>" + esc(c.en) + " stories</i></h1>" +
        "<p>" + esc(c.blurb) + "</p>" +
        '<span class="tiny br">ledger · ' + entries().length + " signals</span>" +
      "</div>" +
      '<div class="tune">' +
        '<label>SEARCH ▸ <input id="q" type="search" placeholder="제목 · 인물 · 호출부호" value="' + esc(filter.q) + '"></label>' +
        '<div class="freq" id="freq"><button type="button" data-tag="" class="' + (filter.tag ? "" : "on") + '">ALL</button>' +
          tags.map(function (t) { return '<button type="button" data-tag="' + esc(t) + '" class="' + (filter.tag === t ? "on" : "") + '">' + esc(t) + "</button>"; }).join("") +
        "</div>" +
        '<span class="tiny" id="cnt">' + pad(list.length) + " / " + pad(entries().length) + "</span>" +
      "</div></header>" +
      '<div class="frame" id="slot">' + slot(list) + "</div>";

    document.getElementById("q").addEventListener("input", function () {
      filter.q = this.value;
      var m = matched();
      document.getElementById("slot").innerHTML = slot(m);
      document.getElementById("cnt").textContent = pad(m.length) + " / " + pad(entries().length);
    });
    document.getElementById("freq").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      filter.tag = b.getAttribute("data-tag"); renderWorks();
    });
  }


  /* ---------- 작은 마크다운 ---------- */
  function inline(s) {
    return esc(s)
      .replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  }
  function md(src) {
    if (!src) return "";
    return String(src).replace(/\r\n/g, "\n").split(/\n{2,}/).map(function (b) {
      var ls = b.split("\n").filter(function (l) { return l.trim(); });
      if (!ls.length) return "";
      if (ls.every(function (l) { return /^>\s?/.test(l); })) return "<blockquote>" + ls.map(function (l) { return inline(l.replace(/^>\s?/, "")); }).join("<br>") + "</blockquote>";
      if (ls.every(function (l) { return /^[-*]\s+/.test(l); })) return "<ul>" + ls.map(function (l) { return "<li>" + inline(l.replace(/^[-*]\s+/, "")) + "</li>"; }).join("") + "</ul>";
      if (ls.length === 1 && /^#{2,4}\s+/.test(ls[0])) return "<h4>" + inline(ls[0].replace(/^#{2,4}\s+/, "")) + "</h4>";
      return "<p>" + ls.map(inline).join("<br>") + "</p>";
    }).join("");
  }
  function secH(no, ko, en) {
    return '<div class="sec-h"><span class="no">' + no + "</span><h2>" + esc(ko) + "<i>" + esc(en) + "</i></h2><span></span></div>";
  }

  /* ---------- 작품 하나 ---------- */
  function renderWork(id) {
    var w = byId(D.works, id);
    if (!w) return notYet("찾을 수 없는 신호");
    var st = STATUS[w.status] || STATUS.open, chars = w.characters || [];
    view.innerHTML = '<div class="frame">' +
      '<a class="back" href="#/works">← 건져 올린 것들</a>' +
      '<header class="whead"><div>' +
        '<span class="code">' + esc(w.code || "") + " / ( " + st[0] + " )" + (w.adult ? " / 19" : "") + "</span>" +
        "<h1>" + esc(w.title) + "</h1>" +
        (w.tagline ? '<p class="sub">' + esc(w.tagline) + "</p>" : "") +
        '<div class="acts">' + (w.link ? '<a class="cmd play" href="' + esc(safeUrl(w.link)) + '" target="_blank" rel="noopener">' + esc(w.platform || "크랙") + "에서 교신하기</a>" : '<span class="cmd line" style="opacity:.5">조율 중</span>') + "</div>" +
      "</div>" +
      '<dl class="side">' +
        "<div><dt>호출부호</dt><dd>" + esc(w.code || "—") + "</dd></div>" +
        "<div><dt>송수신기</dt><dd>" + esc(w.platform || "크랙") + "</dd></div>" +
        "<div><dt>송신일</dt><dd>" + dot(w.date) + "</dd></div>" +
        "<div><dt>인물</dt><dd>" + chars.length + "</dd></div>" +
        "<div><dt>태그</dt><dd>" + (w.tags || []).map(function (t) { return "#" + esc(t); }).join(" ") + "</dd></div>" +
      "</dl></header>" +
      (chars.length ? '<section class="ws">' + secH("01", "인물", "characters") +
        '<div class="roster">' + chars.map(function (c, i) {
          return '<a href="#/works/' + esc(w.id) + "/" + esc(c.id) + '">' + (c.img ? '<img src="' + esc(c.img) + '" alt="">' : '<span class="ph"></span>') +
            '<span class="info"><em>' + pad(i + 1) + " / " + pad(chars.length) + "</em><b>" + esc(c.name) + "</b><span>" + esc(c.role || "") + "</span></span></a>";
        }).join("") + "</div></section>" : "") +
      (w.opening ? '<section class="ws">' + secH("02", "첫 교신", "first contact") + '<blockquote class="opening">' + md(w.opening) + "</blockquote></section>" : "") +
      (w.intro ? '<section class="ws">' + secH("03", "소개", "about") + '<div class="prose">' + md(w.intro) + "</div></section>" : "") +
      '<div style="height:90px"></div></div>';
  }

  /* ---------- 인물 하나: 한 화면, 탭으로 넘겨 본다 ---------- */
  function renderChar(wid, cid) {
    var all = entries(), at = -1;
    for (var q = 0; q < all.length; q++) if (all[q].w.id === wid && all[q].c.id === cid) { at = q; break; }
    if (at < 0) return notYet("찾을 수 없는 신호");
    var w = all[at].w, c = all[at].c, i = at, chars = all;
    var prevE = all[(at - 1 + all.length) % all.length], nextE = all[(at + 1) % all.length];
    var gal = (c.gallery || []).filter(function (g) { return g && g.src; });
    var prof = (c.profile || []).filter(function (f) { return f && (f.k || f.v); });
    var tmi = (c.tmi || []).filter(Boolean);

    var tabs = [];
    if (prof.length) tabs.push(["profile", "PROFILE", '<dl class="hud">' + prof.map(function (f) { return "<div><dt>" + esc(f.k) + "</dt><dd>" + esc(f.v) + "</dd></div>"; }).join("") + "</dl>"]);
    if (c.about) tabs.push(["about", "ABOUT", '<div class="prose">' + md(c.about) + "</div>"]);
    if (tmi.length) tabs.push(["notes", "NOTES", '<ol class="tmi">' + tmi.map(function (t, k) { return "<li><em>" + pad(k + 1) + "</em><span>" + inline(t) + "</span></li>"; }).join("") + "</ol>"]);
    var st = STATUS[w.status] || STATUS.open;
    if (!c._solo || w.opening || (w.tags || []).length) tabs.push(["work", "WORK",
      '<dl class="hud">' +
        "<div><dt>작품</dt><dd>" + esc(w.title) + "</dd></div>" +
        "<div><dt>호출부호</dt><dd>" + esc(w.code || "—") + "</dd></div>" +
        "<div><dt>상태</dt><dd>" + st[0] + (w.adult ? " · 19" : "") + "</dd></div>" +
        ((w.tags || []).length ? "<div><dt>태그</dt><dd>" + w.tags.map(function (t) { return "#" + esc(t); }).join(" ") + "</dd></div>" : "") +
      "</dl>" +
      (w.tagline && !c._solo ? '<p class="prose" style="margin:14px 0 0">' + esc(w.tagline) + "</p>" : "") +
      (w.opening ? '<blockquote class="opening" style="margin-top:14px">' + md(w.opening) + "</blockquote>" : "")]);
    var slots = gal.slice(0, 4); while (slots.length < 4) slots.push(null);
    /* 프롬프트: 캐릭터 / 의상 두 칸 (칸마다 복사) */
    var pr = c.prompts || (c.prompt ? { character: c.prompt } : null);
    var boxes = pr ? [["캐릭터", "character", pr.character], ["의상", "outfit", pr.outfit]].filter(function (b) { return b[2]; }) : [];
    if (boxes.length) tabs.push(["prompt", "PROMPT", boxes.map(function (b) {
      return '<div class="prompt"><div class="prompt-bar"><span class="tiny">' + b[0] + " · " + b[1] + '</span>' +
        '<button type="button" class="copy" data-copy="' + b[1] + '">복사</button></div><pre data-text="' + b[1] + '">' + esc(b[2]) + "</pre></div>";
    }).join("")]);
    tabs.push(["gallery", "GALLERY " + pad(gal.length), '<div class="gal" id="gal">' + slots.map(function (g, k) {
      return g ? '<button type="button" data-i="' + k + '"><img src="' + esc(g.src) + '" alt="' + esc(g.cap || "") + '" loading="lazy">' + (g.secret ? '<span class="secret">미공개</span>' : "") + "</button>"
               : '<button type="button" class="blank" tabindex="-1" aria-hidden="true"></button>';
    }).join("") + "</div>"]);

    view.innerHTML =
      '<section class="char ' + (navDir === "prev" ? "from-left" : navDir === "next" ? "from-right" : "") + '">' +
        '<p class="ghost" aria-hidden="true">' + esc(c.en || c.name) + "</p>" +
        '<div class="frame char-in">' +
          '<div class="art">' +
            '<svg class="rings" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48"/><circle class="d" cx="50" cy="50" r="36"/><circle cx="50" cy="50" r="22"/></svg>' +
            (c.img ? '<img src="' + esc(c.img) + '" alt="' + esc(c.name) + '">' : '<div class="noportrait"><span>PORTRAIT</span><span>NO SIGNAL</span></div>') +
          "</div>" +
          '<div class="card-info">' +
            '<div class="from"><i><span></span></i><span>' + esc(c._solo ? (w.platform || "크랙") : w.title) + "</span><span>" + esc(w.code || "") + "</span></div>" +
            "<h1>" + esc(c.name) + (c.en ? "<small>" + esc(c.en) + "</small>" : "") + "</h1>" +
            (c.role ? '<p class="role">' + esc(c.role) + "</p>" : "") +
            '<div class="ticks" aria-hidden="true"></div>' +
            '<div class="acts">' +
              (w.link ? '<a class="cmd play" href="' + esc(safeUrl(w.link)) + '" target="_blank" rel="noopener">교신하기</a>' : "") +
              '<a class="cmd line" href="#/works" data-dir="back">목록으로</a>' +
            "</div>" +
            '<div class="tabs" role="tablist" id="tabs">' + tabs.map(function (t, k) {
              return '<button type="button" role="tab" data-t="' + t[0] + '" class="' + (k ? "" : "on") + '" aria-selected="' + (k ? "false" : "true") + '">' + t[1] + "</button>";
            }).join("") + '<span class="bar"></span></div>' +
            '<div class="panel-box">' + tabs.map(function (t, k) {
              return '<div class="pane' + (k ? "" : " on") + '" role="tabpanel" data-p="' + t[0] + '">' + t[2] + "</div>";
            }).join("") + "</div>" +
          "</div>" +
        "</div>" +
        '<div class="idx"><b>' + pad(i + 1) + "</b><sup>" + pad(chars.length) + "</sup></div>" +
        (all.length > 1 ? '<nav class="stepper"><a href="' + entryHash(prevE) + '" data-dir="prev">← ' + esc(prevE.c.name) + '</a><span>/</span><a href="' + entryHash(nextE) + '" data-dir="next">' + esc(nextE.c.name) + " →</a></nav>" : "") +
      "</section>";

    var tabEl = document.getElementById("tabs"), bar = tabEl.querySelector(".bar");
    function moveBar(b) {
      var l = b.offsetLeft + (b === tabEl.firstElementChild ? 0 : 12), wd = b.offsetWidth - (b === tabEl.firstElementChild ? 12 : 24);
      bar.style.left = l + "px"; bar.style.width = Math.max(10, wd) + "px";
    }
    function pick(b) {
      var key = b.getAttribute("data-t");
      tabEl.querySelectorAll("button").forEach(function (x) { var on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-selected", on); });
      view.querySelectorAll(".pane").forEach(function (p) {
        var on = p.getAttribute("data-p") === key;
        if (on) { p.classList.remove("out"); void p.offsetWidth; p.classList.add("on"); p.scrollTop = 0; }
        else if (p.classList.contains("on")) { p.classList.remove("on"); p.classList.add("out"); }
      });
      moveBar(b);
    }
    tabEl.addEventListener("click", function (e) { var b = e.target.closest("button[data-t]"); if (b) pick(b); });
    tabEl.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var bs = Array.prototype.slice.call(tabEl.querySelectorAll("button")), k = bs.indexOf(document.activeElement);
      if (k < 0) return;
      var n = bs[(k + (e.key === "ArrowRight" ? 1 : -1) + bs.length) % bs.length]; n.focus(); pick(n);
    });
    setTimeout(function () { moveBar(tabEl.querySelector("button.on")); }, 60);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { var b = tabEl.querySelector("button.on"); if (b) moveBar(b); });

    view.querySelectorAll(".prompt .copy").forEach(function (cp) {
      cp.addEventListener("click", function () {
        var text = view.querySelector('pre[data-text="' + cp.getAttribute("data-copy") + '"]').textContent;
        function done(ok) { cp.textContent = ok ? "복사됨" : "복사 실패"; setTimeout(function () { cp.textContent = "복사"; }, 1600); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
        else { var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { done(document.execCommand("copy")); } catch (e) { done(false); } ta.remove(); }
      });
    });
    var g = document.getElementById("gal");
    g.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-i]"); if (b) lightbox(gal, Number(b.getAttribute("data-i")));
    });
  }

  /* ---------- 확대 ---------- */
  var lb = null, lbL = [], lbA = 0;
  function lightbox(list, at) {
    lbL = list; lbA = at;
    if (!lb) {
      lb = document.createElement("div"); lb.className = "lb"; document.body.appendChild(lb);
      lb.addEventListener("click", function (e) {
        var b = e.target.closest("button");
        if (!b) { if (e.target === lb) closeLb(); return; }
        if (b.dataset.step) { lbA = (lbA + Number(b.dataset.step) + lbL.length) % lbL.length; drawLb(); } else closeLb();
      });
      addEventListener("keydown", function (e) {
        if (!lb || lb.hidden) return;
        if (e.key === "Escape") closeLb();
        if (e.key === "ArrowRight") { lbA = (lbA + 1) % lbL.length; drawLb(); }
        if (e.key === "ArrowLeft") { lbA = (lbA - 1 + lbL.length) % lbL.length; drawLb(); }
      });
    }
    lb.hidden = false; document.body.style.overflow = "hidden"; drawLb();
  }
  function drawLb() {
    var g = lbL[lbA];
    lb.innerHTML = '<button class="x" type="button">CLOSE ✕</button><img src="' + esc(g.src) + '" alt="">' + (g.cap ? "<p>" + esc(g.cap) + "</p>" : "") +
      (lbL.length > 1 ? '<div class="step"><button type="button" data-step="-1">←</button>' + (lbA + 1) + " / " + lbL.length + '<button type="button" data-step="1">→</button></div>' : "");
  }
  function closeLb() { if (lb) lb.hidden = true; document.body.style.overflow = ""; }

  function head(id, extra) {
    var c = byId(CH, id);
    return '<header class="frame"><div class="phead">' +
      '<span class="big">' + c.no + "</span>" +
      "<h1>" + esc(c.name) + "<i>" + esc(c.en) + "</i></h1>" +
      "<p>" + esc(c.blurb) + "</p>" + (extra || "") +
    "</div></header>";
  }

  /* ---------- 교신 일지 ---------- */
  function renderLog() {
    var list = sorted(D.logs);
    view.innerHTML = head("log", '<span class="tiny br">' + list.length + " transmissions</span>") +
      '<div class="frame">' + (list.length ? '<ol class="logs">' + list.map(function (l, k) {
        return '<li style="animation-delay:' + Math.min(k, 6) * 0.06 + 's"><time>' + dot(l.date) + "</time>" +
          '<div><h3>' + esc(l.title || "") + '</h3><div class="prose">' + md(l.body) + "</div></div>" +
          '<span class="no">' + pad(list.length - k) + "</span></li>";
      }).join("") + "</ol>" : '<div class="empty">( 아직 보낸 신호가 없습니다 )</div>') + '<div style="height:90px"></div></div>';
  }

  /* ---------- 너머의 기록 ---------- */
  function renderLore(want) {
    var list = D.lore || [];
    if (!list.length) { view.innerHTML = head("lore") + '<div class="frame"><div class="empty">( 아직 들려온 말이 없습니다 )</div></div>'; return; }
    var cur = byId(list, want) || list[0];
    var rel = entries().filter(function (e) { return (e.w.lore || []).indexOf(cur.id) >= 0; });
    view.innerHTML = head("lore") +
      '<div class="frame lore">' +
        '<nav class="lore-list" aria-label="기록 목록">' + list.map(function (x, k) {
          return '<a href="#/lore/' + esc(x.id) + '" class="' + (x.id === cur.id ? "on" : "") + '"><em>' + pad(k + 1) + "</em><span><small>" + esc(x.kind || "기록") + "</small>" + esc(x.title) + "</span></a>";
        }).join("") + "</nav>" +
        '<article class="reader" id="reader">' +
          '<p class="tiny">' + esc(x2(cur.kind)) + (cur.date ? " · " + dot(cur.date) : "") + "</p>" +
          "<h2>" + esc(cur.title) + "</h2>" +
          '<div class="prose">' + md(cur.body) + "</div>" +
          (rel.length ? '<div class="rel"><span class="tiny sq">이 기록이 닿은 신호</span>' + rel.map(function (e) {
            return '<a href="' + entryHash(e) + '">' + esc(e.c.name) + "</a>";
          }).join("") + "</div>" : "") +
        "</article>" +
      "</div><div style=\"height:90px\"></div>";
    function x2(k) { return k || "기록"; }
  }

  /* ---------- 송신소: 들어올 때마다 지금의 '나'를 하나 비춘다 ---------- */
  function pickMoment(list, avoid) {
    if (!list.length) return -1;
    var last = -1;
    try { last = Number(sessionStorage.getItem("hadal-moment")); } catch (e) {}
    if (avoid != null) last = avoid;
    var k = Math.floor(Math.random() * list.length);
    if (list.length > 1 && k === last) k = (k + 1 + Math.floor(Math.random() * (list.length - 1))) % list.length;
    try { sessionStorage.setItem("hadal-moment", k); } catch (e) {}
    return k;
  }
  function clock() {
    var d = new Date();
    return d.getFullYear() + "." + pad(d.getMonth() + 1) + "." + pad(d.getDate()) + "  " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }
  var clockTimer = 0;
  function renderMaker() {
    var m = D.maker || {}, list = (m.moments || []).filter(function (x) { return x && (x.img || x.doing); });
    var k = pickMoment(list);

    view.innerHTML =
      '<section class="frame obs">' +
        '<div class="feed" id="feed">' +
          '<div class="screen" id="screen"></div>' +
          '<div class="hud-top"><span class="rec"><b></b>LIVE</span><span>CAM-04 · 11,034 m</span></div>' +
          '<div class="hud-bot"><span id="clock">' + clock() + "</span><span>" + (list.length ? pad(k + 1) + " / " + pad(list.length) : "--") + "</span></div>" +
          '<span class="corner a"></span><span class="corner b"></span><span class="corner c"></span><span class="corner d"></span>' +
        "</div>" +
        '<div class="op">' +
          '<p class="tiny sq">operator</p>' +
          "<h1>" + esc(m.name || "테르마") + (m.en ? "<small>" + esc(m.en) + "</small>" : "") + "</h1>" +
          (m.line ? '<p class="line">' + esc(m.line) + "</p>" : "") +
          '<div class="now" id="now"></div>' +
          (list.length > 1 ? '<button class="retune" type="button" id="retune">다른 순간 수신하기</button>' : "") +
          '<div class="prose about">' + md(m.about) + "</div>" +
          ((m.contact || []).length ? '<nav class="contact" aria-label="닿는 곳">' + m.contact.map(function (c) {
            return '<a href="' + esc(safeUrl(c.url)) + '" target="_blank" rel="noopener"><span>' + esc(c.label) + "</span><i>↗</i></a>";
          }).join("") + "</nav>" : "") +
          ((m.rules || []).length ? '<details class="rules-box"><summary>약속 <span>' + pad(m.rules.length) + '</span></summary><ol class="rules">' + m.rules.map(function (r, n) {
            return "<li><em>" + pad(n + 1) + "</em><span>" + inline(r) + "</span></li>";
          }).join("") + "</ol></details>" : "") +
        "</div>" +
      "</section>";

    function show(idx) {
      var mo = list[idx] || {}, scr = document.getElementById("screen"), now = document.getElementById("now");
      var feed = document.getElementById("feed");
      feed.classList.remove("tuned"); void feed.offsetWidth; feed.classList.add("tuning");
      scr.innerHTML = mo.img ? '<img src="' + esc(mo.img) + '" alt="' + esc((m.name || "") + " — " + (mo.doing || "")) + '">'
                             : '<div class="nofeed"><span>NO SIGNAL</span></div>';
      now.innerHTML = '<span class="tiny">NOW —</span><b>' + esc(mo.doing || "") + "</b>" + (mo.note ? "<p>" + esc(mo.note) + "</p>" : "");
      now.classList.remove("show"); void now.offsetWidth; now.classList.add("show");
      document.querySelector(".hud-bot span:last-child").textContent = pad(idx + 1) + " / " + pad(list.length);
      setTimeout(function () { feed.classList.remove("tuning"); feed.classList.add("tuned"); }, 900);
    }
    if (k >= 0) show(k);
    var rb = document.getElementById("retune");
    if (rb) rb.addEventListener("click", function () { k = pickMoment(list, k); show(k); });
    clearInterval(clockTimer);
    clockTimer = setInterval(function () { var c = document.getElementById("clock"); if (c) c.textContent = clock(); else clearInterval(clockTimer); }, 1000);
  }

  function notYet(name) {
    view.innerHTML = '<div class="frame notyet">( ' + esc(name || "수신 불가") + ' )<br>아직 닿지 않았거나, 잠들어 있는 신호입니다.<br><br><a class="cmd line" href="#/works">건져 올린 것들로</a></div>';
  }


  /* =========================================================
     물결 — 원래 사이트의 윤슬(수면 굴절광)을 GPU 셰이더로 옮겼다.
     보로노이 칸의 경계가 곧 빛줄기이고, 아래로 갈수록 칸이 커지는 원근이 있다.
     화면 픽셀마다 직접 계산하므로 늘려서 생기는 계단·깨짐이 없다.
     ========================================================= */
  var seas = [];
  /* 가벼운 판: 색 번짐 없이 한 번만 계산하고, 화면 아래쪽만 낮은 해상도로 그린다
     (어차피 흐릿하게 보이므로 해상도를 낮춰도 티가 나지 않는다) */
  var FRAG = [
    "precision mediump float;",
    "uniform vec2 uRes; uniform float uT, uV0, uCell, uAmp, uTop, uAsp;",
    "vec2 h2(vec2 p){ vec3 q=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); q+=dot(q,q.yzx+33.33); return fract((q.xx+q.yz)*q.zy); }",
    "float sm(float a,float b,float x){ x=clamp((x-a)/(b-a),0.,1.); return x*x*(3.-2.*x); }",
    "float edge(vec2 g, float t){",
    "  vec2 c=floor(g); float f1=9., f2=9.;",
    "  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){",
    "    vec2 cc=c+vec2(float(i),float(j)); vec2 r=h2(cc);",
    "    vec2 pt=cc+.5+.38*sin(t*(.35+.35*r)+6.283*r);",
    "    float d=length(g-pt);",
    "    if(d<f1){f2=f1;f1=d;} else if(d<f2){f2=d;}",
    "  }",
    "  return f2-f1;",
    "}",
    "vec2 warp(vec2 p, float t){",
    "  p+=.22*vec2(sin(p.y*1.7+t*.9), cos(p.x*1.5-t*.8));",
    "  return p+.10*vec2(sin(p.y*3.9-t*1.3), cos(p.x*4.3+t*1.1));",
    "}",
    "void main(){",
    "  vec2 fc=gl_FragCoord.xy; float u=fc.x/uRes.x;",
    "  float v=uTop+(1.-fc.y/uRes.y)*(1.-uTop);",
    "  if(v<uV0){ gl_FragColor=vec4(0.); return; }",
    "  float K=9.5/uCell, inv=1./(.46+.66*v);",
    "  vec2 p=vec2((u-.5)*K*inv, uAsp*K*(.14+1.34*pow(v,2.2)));",
    "  float t=uT;",
    "  float e1=edge(warp(p,t)+vec2(t*.05,t*.03), t);",
    "  float e2=edge(warp(p*1.37+vec2(4.1,7.3),-t*1.1)-vec2(t*.04,-t*.05), t*1.2);",
    "  float w=.085;",
    "  float l1=exp(-e1/w), l2=exp(-e2/(w*1.15));",
    "  float L=.5*l1+.4*l2+.8*l1*l2+.14*(exp(-e1*5.)+exp(-e2*5.));",
    "  float env=sm(uV0,min(.99,uV0+.2),v)*uAmp*sm(0.,.14,u)*sm(0.,.14,1.-u);",
    "  vec3 col=vec3(.62,.86,1.)*L*env; col=col/(1.+col*.6);",
    "  gl_FragColor=vec4(col,clamp(max(col.b,col.g),0.,1.));",
    "}"
  ].join("\n");
  var VERT = "attribute vec2 p; void main(){ gl_Position=vec4(p,0.,1.); }";

  function makeSea(cv, opt) {
    if (!cv) return null;
    var gl = cv.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return null;
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ["uRes", "uT", "uV0", "uCell", "uAmp", "uTop", "uAsp"].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
    gl.uniform1f(U.uV0, opt.v0 || 0);
    gl.uniform1f(U.uCell, opt.cell || 1);
    gl.uniform1f(U.uAmp, opt.amp || 0.36);

    var raf = 0, last = 0, t = Math.random() * 40, alive = true, visible = true;
    function size() {
      /* 캔버스는 물결이 시작하는 높이 조금 위부터 바닥까지만 차지한다 */
      var top = Math.max(0, (opt.v0 || 0) - 0.02), vh = innerHeight, vw = innerWidth;
      if (opt.band) { cv.style.top = (top * 100) + "%"; cv.style.height = ((1 - top) * 100) + "%"; }
      var r = cv.getBoundingClientRect(), q = opt.scale || 0.5;
      cv.width = Math.max(1, Math.round(r.width * q)); cv.height = Math.max(1, Math.round(r.height * q));
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(U.uRes, cv.width, cv.height);
      gl.uniform1f(U.uTop, opt.band ? top : 0);
      gl.uniform1f(U.uAsp, (opt.band ? r.height / (1 - top) : r.height) / Math.max(1, r.width));
    }
    function draw() { gl.uniform1f(U.uT, t); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
    function frame(now) {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      if (last && now - last < 32) return;            /* 약 30fps */
      var dt = last ? Math.min((now - last) / 1000, 0.1) : 0; last = now;
      t += dt * (opt.speed || 1);
      draw();
    }
    function start() { if (!raf && !STILL && alive && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    size(); draw();
    var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? start() : stop(); }) : null;
    if (io) io.observe(cv);
    start();
    return {
      resize: function () { size(); draw(); },
      wake: start, sleep: stop,
      kill: function () { alive = false; stop(); if (io) io.disconnect(); }
    };
  }

  /* 종이 위에도 바다 눈이 아주 조금 흩날린다 */
  (function drift() {
    var cv = document.getElementById("drift"), ctx = cv.getContext("2d"), W, H, ds = [], raf = 0, last = 0;
    function size() {
      var dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ds = []; var n = Math.round(Math.max(35, Math.min(90, W * H / 16000)));
      for (var i = 0; i < n; i++) ds.push({ x: Math.random() * W, y: Math.random() * H, r: 0.6 + Math.random() * 1.4, v: 4 + Math.random() * 9, ph: Math.random() * 6.28, sw: 4 + Math.random() * 10, a: 0.12 + Math.random() * 0.28 });
    }
    function draw(dt) {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < ds.length; i++) {
        var d = ds[i]; d.y += d.v * dt; d.ph += 0.35 * dt; if (d.y > H + 4) { d.y = -4; d.x = Math.random() * W; }
        ctx.beginPath(); ctx.arc(d.x + Math.sin(d.ph) * d.sw, d.y, d.r, 0, 6.283);
        ctx.fillStyle = "rgba(226,234,255," + (d.a * 1.6).toFixed(3) + ")"; ctx.fill();
      }
    }
    function frame(tm) { raf = requestAnimationFrame(frame); if (last && tm - last < 32) return; var dt = last ? Math.min((tm - last) / 1000, .1) : 0; last = tm; draw(dt); }
    size(); if (STILL) draw(0); else raf = requestAnimationFrame(frame);
    var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(size, 160); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!STILL && !raf) { last = 0; raf = requestAnimationFrame(frame); }
    });
  })();

  /* ---------- 라우팅 · 전환 ---------- */
  var footSea = null, navDir = "", leaving = 0, firstPaint = true;
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href^='#']");
    if (a) navDir = a.getAttribute("data-dir") || "";
  }, true);
  addEventListener("keydown", function (e) {
    if (!document.body.classList.contains("is-char") || (lb && !lb.hidden)) return;
    if (e.target.closest && e.target.closest(".tabs")) return;
    var a = document.querySelector('.stepper a[data-dir="' + (e.key === "ArrowRight" ? "next" : e.key === "ArrowLeft" ? "prev" : "x") + '"]');
    if (a) { navDir = a.getAttribute("data-dir"); location.hash = a.getAttribute("href"); }
  });

  function render() {
    var parts = (location.hash || "#/").replace(/^#\/?/, "").split("/");
    var top = parts[0] || "home";
    if (top === "works" && parts[1] && !parts[2]) {
      var first = entries().filter(function (e) { return e.w.id === parts[1]; })[0];
      if (first) { location.replace(entryHash(first)); return; }
    }
    seas.forEach(function (s) { if (s) s.kill(); }); seas = []; closeLb();
    document.body.classList.toggle("is-home", top === "home");
    document.body.classList.toggle("is-char", top === "works" && !!parts[2]);
    document.body.classList.toggle("is-obs", top === "maker");
    paintNav(top);
    if (top === "home") renderHome();
    else if (top === "works" && !parts[1]) renderWorks();
    else if (top === "works" && parts[2]) renderChar(parts[1], parts[2]);
    else if (top === "log") renderLog();
    else if (top === "lore") renderLore(parts[1]);
    else if (top === "maker") renderMaker();
    else notYet("알 수 없는 채널");
    document.title = (top === "home" ? "" : ((byId(CH, top) || {}).name || "") + " · ") + "하달의 너머";
    scrollTo(0, 0);
    view.classList.remove("out", "out-left", "out-right");
    view.classList.add("in");
    clearTimeout(leaving); leaving = setTimeout(function () { view.classList.remove("in"); }, 900);
    view.focus({ preventScroll: true });
    navDir = "";
  }
  /* 지금 화면을 먼저 가라앉히고, 다음 화면을 띄운다 */
  function go() {
    if (firstPaint || STILL) { firstPaint = false; render(); return; }
    var cls = navDir === "next" ? "out-left" : navDir === "prev" ? "out-right" : "out";
    view.classList.remove("in"); view.classList.add(cls);
    clearTimeout(leaving); leaving = setTimeout(render, 320);
  }

  var rt;
  addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { seas.forEach(function (s) { if (s) s.resize(); }); if (footSea) footSea.resize(); }, 180);
  });
  document.addEventListener("visibilitychange", function () {
    var all = seas.concat([footSea]);
    all.forEach(function (s) { if (s) document.hidden ? s.sleep() : s.wake(); });
  });
  addEventListener("hashchange", go);
  /* 그림 위에서는 우클릭 메뉴와 끌기를 막는다 */
  ["contextmenu", "dragstart"].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      var t = e.target;
      if (t && t.closest && (t.tagName === "IMG" || t.closest(".screen, .feed, .pic, .art, .gal, .lb, .roster"))) e.preventDefault();
    });
  });

  fetch("data.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    D = d; D.works = D.works || []; D.lore = D.lore || []; D.logs = D.logs || [];
    var s = D.site || {};
    document.getElementById("footLine").textContent = "© " + new Date().getFullYear() + " " + (s.maker || "테르마") + " — " + (s.footer || "");
    document.getElementById("footLinks").innerHTML = (s.links || []).map(function (l) {
      return '<a href="' + esc(safeUrl(l.url)) + '" target="_blank" rel="noopener">' + esc(l.label) + " ↗</a>";
    }).join("");
    go();
  }).catch(function () {
    view.innerHTML = '<div class="frame notyet">( 신호 두절 )<br>기록을 끌어올리지 못했습니다. 잠시 뒤 새로고침해 주세요.</div>';
  });
})();
