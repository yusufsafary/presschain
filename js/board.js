/* Presschain live board.
   Races public BSC RPC endpoints for PressEditions and PressClaim state.
   Genesis state (genesisOpen false, currentEdition 0) renders as
   "Genesis opens soon". Every DOM write is null-guarded. */
(function () {
  var CFG = window.PRESSCHAIN_CONFIG || {};
  var NFT = CFG.CONTRACT || "";
  var CLAIM = CFG.CLAIM || "";
  var RPCS = CFG.RPCS || [];
  var ZERO = "0x0000000000000000000000000000000000000000";

  function $(id) { return document.getElementById(id); }
  function fmt(n) { return n.toLocaleString("en-US"); }
  function setText(id, txt) { var el = $(id); if (el) el.textContent = txt; }

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var tweens = {};
  function setNum(id, to) {
    var el = $(id);
    if (!el) return;
    if (reduceMotion) { el.textContent = fmt(to); return; }
    var from = parseInt((el.textContent || "").replace(/[^0-9]/g, ""), 10);
    if (isNaN(from)) from = 0;
    if (tweens[id]) cancelAnimationFrame(tweens[id]);
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / 650);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(from + (to - from) * e));
      if (p < 1) tweens[id] = requestAnimationFrame(step);
    }
    tweens[id] = requestAnimationFrame(step);
  }

  function padArg(n) {
    var h = n.toString(16);
    while (h.length < 64) h = "0" + h;
    return h;
  }
  function wordToInt(hex) { return parseInt(hex, 16); }
  function wordToAddr(hex) {
    if (!hex || hex.length < 42) return ZERO;
    return "0x" + hex.slice(-40);
  }
  function shortAddr(a) {
    if (!a || a.toLowerCase() === ZERO) return "";
    return a.slice(0, 6) + "\u2026" + a.slice(-4);
  }

  function rpcBatch(to, calls) {
    // calls: [{id, data}] -> Promise resolving to {id: resultHex} from the
    // fastest RPC that answers completely, or null when all fail.
    return new Promise(function (resolve) {
      var settled = false;
      var pending = RPCS.length;
      if (!pending) { resolve(null); return; }
      RPCS.forEach(function (url) {
        var ctl = ("AbortController" in window) ? new AbortController() : null;
        var timer = ctl ? setTimeout(function () { ctl.abort(); }, 4000) : null;
        var body = calls.map(function (c) {
          return { jsonrpc: "2.0", id: c.id, method: "eth_call", params: [{ to: to, data: c.data }, "latest"] };
        });
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: ctl ? ctl.signal : undefined
        }).then(function (r) { return r.json(); }).then(function (j) {
          if (timer) clearTimeout(timer);
          if (settled || !j || !Array.isArray(j)) return;
          var out = {};
          var ok = true;
          calls.forEach(function (c) {
            var hit = null;
            for (var i = 0; i < j.length; i++) if (j[i].id === c.id) hit = j[i];
            if (!hit || !hit.result || hit.result === "0x") ok = false;
            else out[c.id] = hit.result;
          });
          if (ok) { settled = true; resolve(out); }
        }).catch(function () {
          if (timer) clearTimeout(timer);
        }).finally(function () {
          pending -= 1;
          if (!settled && pending === 0) resolve(null);
        });
      });
    });
  }

  /* ---------- edition board ---------- */
  var sealTs = 0; // unix seconds when current edition seals; 0 = not ticking

  function tickSeal() {
    var el = $("b-seal");
    if (!el || !sealTs) return;
    var left = sealTs - Math.floor(Date.now() / 1000);
    if (left <= 0) { el.textContent = "Sealed"; return; }
    var h = Math.floor(left / 3600), m = Math.floor((left % 3600) / 60), s = left % 60;
    function p2(n) { return (n < 10 ? "0" : "") + n; }
    el.textContent = p2(h) + ":" + p2(m) + ":" + p2(s);
  }
  setInterval(tickSeal, 1000);

  function soonMode(total) {
    sealTs = 0;
    setText("h-status", "Genesis soon");
    setText("b-edition", "N\u00ba 1 \u00b7 Genesis");
    setNum("b-printed", 0);
    setText("b-seal", "Opens soon");
    setNum("b-total", total || 0);
    setText("b-editor", "Not named yet");
    setText("b-note", "Genesis opens soon. Edition 1 opens by hand and its window runs to the next 00:00 UTC. Every later edition prints on a plain UTC day, then seals for good.");
  }

  function applyEdition(ed, printed, endTs, editor, total) {
    var now = Math.floor(Date.now() / 1000);
    setText("b-edition", "N\u00ba " + fmt(ed));
    setNum("b-printed", printed);
    setNum("b-total", total);
    var edEl = $("b-editor");
    if (edEl) edEl.textContent = shortAddr(editor) || "Not named yet";
    if (endTs && now < endTs) {
      sealTs = endTs;
      tickSeal();
      setText("h-status", "Printing now");
      setText("b-note", "Edition N\u00ba " + fmt(ed) + " is on the press. Copies 1 to 100 of an edition are Scoops, so early printers read a rarer front page. Sealed editions never print again.");
    } else {
      sealTs = 0;
      setText("b-seal", "Sealed");
      setText("h-status", "Sealed");
      setText("b-note", "Edition N\u00ba " + fmt(ed) + " is sealed for good. A fresh edition starts at 00:00 UTC. Holders of sealed copies can claim $PRESS once claims open.");
    }
  }

  function raceEdition() {
    if (!NFT || NFT.toLowerCase() === ZERO) { soonMode(0); return; }
    rpcBatch(NFT, [
      { id: 1, data: "0x14349d0c" }, // genesisOpen()
      { id: 2, data: "0xb2750771" }, // currentEdition()
      { id: 3, data: "0xe389b26e" }  // totalPrinted()
    ]).then(function (r) {
      if (!r) return;
      var genesis = wordToInt(r[1]) === 1;
      var ed = wordToInt(r[2]);
      var total = wordToInt(r[3]);
      if (!genesis || ed < 1) { soonMode(total); return; }
      rpcBatch(NFT, [
        { id: 1, data: "0x8a52ec94" + padArg(ed) }, // printedInEdition(ed)
        { id: 2, data: "0x72af5d64" + padArg(ed) }, // editionEnd(ed)
        { id: 3, data: "0xcad50005" + padArg(ed) }  // editorOf(ed)
      ]).then(function (r2) {
        if (!r2) { soonMode(total); return; }
        var endTs = wordToInt(r2[2]);
        if (!endTs) { soonMode(total); return; }
        applyEdition(ed, wordToInt(r2[1]), endTs, wordToAddr(r2[3]), total);
      });
    });
  }

  /* ---------- claim board ---------- */
  function fmtPool(weiHex) {
    var v = parseInt(weiHex, 16) / 1e18;
    if (v >= 1e9) return (v / 1e9).toFixed(2).replace(/\.?0+$/, "") + "B";
    if (v >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    return fmt(Math.round(v));
  }
  function applyClaim(claimed, open, poolHex) {
    setNum("c-claimed", claimed);
    var el = $("c-pool");
    if (el) el.textContent = fmtPool(poolHex);
    setText("c-status", open ? "OPEN" : "SOON");
    setText("c-note", open
      ? "Claims are open. Send your Binance agent a claim prompt below, one call per copy."
      : "Claims are not open yet. Copies of sealed editions become claimable when claims open. Watch this board.");
  }
  function raceClaim() {
    if (!CLAIM || CLAIM.toLowerCase() === ZERO) return;
    rpcBatch(CLAIM, [
      { id: 1, data: "0xd54ad2a1" }, // totalClaimed()
      { id: 2, data: "0x4b8bcb58" }, // claimOpen()
      { id: 3, data: "0x96365d44" }  // poolBalance()
    ]).then(function (r) {
      if (!r) return;
      applyClaim(wordToInt(r[1]), wordToInt(r[2]) === 1, r[3]);
    });
  }

  raceEdition();
  raceClaim();
  setInterval(function () { raceEdition(); raceClaim(); }, 30000);
})();
