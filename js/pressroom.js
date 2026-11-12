/* Presschain Press Room: interactive on-chain explorer.
   Reads PressEditions + PressClaim live (RPC race, batched eth_call),
   renders real front pages from art/<id>.svg, checks claims, tracks the
   Scoop window and the edition seal countdown for the mobile bar.
   Every DOM write is null-guarded. */
(function () {
  var CFG = window.PRESSCHAIN_CONFIG || {};
  var NFT = CFG.CONTRACT, CLAIM = CFG.CLAIM;
  var RPCS = CFG.RPCS || [];
  if (!NFT || !CLAIM || !RPCS.length) return;

  var SEL = {
    totalPrinted: "0xe389b26e", currentEdition: "0xb2750771", editionEnd: "0xef747093",
    printedInEdition: "0x8a52ec94", editionOf: "0x4be185f0", copyNoOf: "0xd9c5cda7",
    classOf: "0x4324aa21", ownerOf: "0x6352211e", isSealed: "0x2c1758c1",
    editorOf: "0xcad50005", claimAmount: "0x23b221a0", claimedById: "0x4c80ee12"
  };
  var CLASSES = ["Standard", "Scoop", "Misprint"];
  function $(id) { return document.getElementById(id); }
  function set(id, txt) { var el = $(id); if (el) el.textContent = txt; }
  function encUint(n) { return BigInt(n).toString(16).padStart(64, "0"); }
  function call(to, data) { return { to: to, data: data }; }
  function asUint(hex) { return hex && hex !== "0x" ? BigInt(hex) : 0n; }
  function asAddr(hex) { return hex && hex.length >= 42 ? "0x" + hex.slice(-40) : ""; }
  function short(a) { return a ? a.slice(0, 6) + "..." + a.slice(-4) : "-"; }
  function fmt(n) { return Number(n).toLocaleString("en-US"); }

  function rpc(method, params) {
    var body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: method, params: params });
    var races = RPCS.map(function (url) {
      var ctl = new AbortController();
      var t = setTimeout(function () { ctl.abort(); }, 4000);
      return fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: body, signal: ctl.signal })
        .then(function (r) { return r.json(); })
        .then(function (j) { clearTimeout(t); if (j.error) throw new Error("rpc"); return j.result; });
    });
    return Promise.any(races);
  }
  /* Batched eth_call via JSON-RPC batch on one endpoint, raced across endpoints. */
  function batch(calls) {
    var body = JSON.stringify(calls.map(function (c, i) {
      return { jsonrpc: "2.0", id: i + 1, method: "eth_call", params: [{ to: c.to, data: c.data }, "latest"] };
    }));
    var races = RPCS.map(function (url) {
      var ctl = new AbortController();
      var t = setTimeout(function () { ctl.abort(); }, 5000);
      return fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: body, signal: ctl.signal })
        .then(function (r) { return r.json(); })
        .then(function (j) { clearTimeout(t); if (!Array.isArray(j)) throw new Error("batch"); return j.sort(function (a, b) { return a.id - b.id; }).map(function (x) { return x.result; }); });
    });
    return Promise.any(races);
  }

  var state = { total: 0, edition: 0, printed: 0, end: 0 };

  function tickCountdown() {
    if (!state.end) return;
    var left = Math.max(0, state.end - Math.floor(Date.now() / 1000));
    var h = Math.floor(left / 3600), m = Math.floor((left % 3600) / 60), s = left % 60;
    var txt = (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    set("mb-seal", txt);
    var dayStart = state.end - 86400;
    var pct = Math.min(100, Math.max(0, ((Math.floor(Date.now() / 1000) - dayStart) / 86400) * 100));
    var bar = $("day-progress"); if (bar) bar.style.width = pct.toFixed(1) + "%";
  }

  function refreshEdition() {
    return batch([call(NFT, SEL.currentEdition), call(NFT, SEL.totalPrinted), call(NFT, SEL.editionEnd)])
      .then(function (r) {
        state.edition = Number(asUint(r[0]));
        state.total = Number(asUint(r[1]));
        state.end = Number(asUint(r[2]));
        set("mb-edition", state.edition ? "Nº " + state.edition : "Soon");
        return batch([call(NFT, SEL.printedInEdition + encUint(state.edition))]);
      })
      .then(function (r) {
        if (r) {
          state.printed = Number(asUint(r[0]));
          var left = Math.max(0, 100 - state.printed);
          set("sc-left", left > 0 ? left + " Scoop copies left" : "Scoop window closed");
          var bar = $("sc-bar"); if (bar) bar.style.width = Math.min(100, state.printed) + "%";
          set("sc-note", state.printed + " of the first 100 copies printed in Edition Nº " + state.edition + ". Copies 1 to 100 are Scoops.");
          calcUpdate();
        }
        tickCountdown();
      })
      .catch(function () { /* keep last state */ });
  }

  /* ===== Copy explorer ===== */
  function explore(id) {
    id = parseInt(id, 10);
    var note = $("pr-note");
    if (!id || id < 1) { if (note) note.textContent = "Enter a copy number, 1 or higher."; return; }
    if (state.total && id > state.total) { if (note) note.textContent = "Copy #" + id + " is not printed yet. Latest is #" + state.total + "."; return; }
    if (note) note.textContent = "Reading copy #" + id + " from the chain...";
    batch([
      call(NFT, SEL.editionOf + encUint(id)), call(NFT, SEL.copyNoOf + encUint(id)),
      call(NFT, SEL.classOf + encUint(id)), call(NFT, SEL.ownerOf + encUint(id))
    ]).then(function (r) {
      var edition = Number(asUint(r[0])), copyNo = Number(asUint(r[1])), cls = Number(asUint(r[2])), owner = asAddr(r[3]);
      return batch([
        call(NFT, SEL.isSealed + encUint(edition)), call(NFT, SEL.editorOf + encUint(edition)),
        call(CLAIM, SEL.claimAmount + encUint(id)), call(CLAIM, SEL.claimedById + encUint(id))
      ]).then(function (r2) {
        var sealed = asUint(r2[0]) === 1n, editor = asAddr(r2[1]);
        var amount = asUint(r2[2]), claimed = asUint(r2[3]) === 1n;
        var img = $("pr-art");
        if (img) {
          img.onerror = function () { img.onerror = null; img.src = "img/frontpage-soon.svg"; if (note) note.textContent = "Front page of copy #" + id + " is still on the press. Its chain data above is final."; };
          img.src = "art/" + id + ".svg"; img.alt = "Front page of Presschain copy " + id;
        }
        set("pr-title", "Copy #" + id + " · Edition Nº " + edition);
        set("pr-class", CLASSES[cls] || "Standard");
        set("pr-copyno", "Copy Nº " + copyNo + " of its edition");
        set("pr-owner", "Owner " + short(owner));
        set("pr-editor", "Editor of the Day " + short(editor));
        var claimTxt;
        if (claimed) claimTxt = "Claimed · " + fmt(amount) + " PRESS paid";
        else if (!sealed) claimTxt = "Edition still open · claims unlock at seal";
        else claimTxt = "Claimable · " + fmt(amount) + " PRESS";
        set("pr-claim", claimTxt);
        var stage = $("pr-stage"); if (stage) stage.hidden = false;
        if (note) note.textContent = "";
      });
    }).catch(function () { if (note) note.textContent = "Chain read failed. Try again in a moment."; });
  }

  var btn = $("pr-go"), inp = $("pr-id");
  if (btn && inp) {
    btn.addEventListener("click", function () { explore(inp.value); });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") explore(inp.value); });
  }

  /* ===== Latest off the press ===== */
  function latest() {
    if (!state.total) return;
    var grid = $("lt-grid"); if (!grid) return;
    var ids = [];
    for (var i = state.total; i > Math.max(0, state.total - 6); i--) ids.push(i);
    var calls = [];
    ids.forEach(function (id) {
      calls.push(call(NFT, SEL.copyNoOf + encUint(id)), call(NFT, SEL.classOf + encUint(id)), call(NFT, SEL.ownerOf + encUint(id)));
    });
    batch(calls).then(function (r) {
      grid.innerHTML = "";
      ids.forEach(function (id, k) {
        var copyNo = Number(asUint(r[k * 3])), cls = Number(asUint(r[k * 3 + 1])), owner = asAddr(r[k * 3 + 2]);
        var card = document.createElement("button");
        card.type = "button";
        card.className = "lt-card";
        card.innerHTML = "";
        var im = document.createElement("img");
        im.src = "art/" + id + ".svg"; im.alt = "Front page of copy " + id; im.loading = "lazy";
        im.onerror = function () { card.style.display = "none"; };
        var meta = document.createElement("span");
        meta.className = "lt-meta";
        meta.textContent = "#" + id + " · Copy Nº " + copyNo + " · " + (CLASSES[cls] || "Standard");
        var own = document.createElement("span");
        own.className = "lt-own";
        own.textContent = short(owner);
        card.appendChild(im); card.appendChild(meta); card.appendChild(own);
        card.addEventListener("click", function () {
          if (inp) inp.value = id;
          explore(id);
          var st = $("pr-stage"); if (st) st.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        grid.appendChild(card);
      });
    }).catch(function () { /* leave grid as is */ });
  }

  /* ===== Print calculator ===== */
  var range = $("calc-range");
  function priceForIdx(i) { return i === 0 ? 0 : (i < 5 ? 0.0002 : 0.0004); }
  function calcUpdate() {
    if (!range) return;
    var n = parseInt(range.value, 10) || 1;
    set("calc-n", String(n));
    var total = 0, rows = [];
    for (var i = 0; i < n; i++) { var p = priceForIdx(i); total += p; rows.push(p === 0 ? "FREE" : p.toFixed(4)); }
    set("calc-rows", rows.join("  +  "));
    set("calc-total", total === 0 ? "0 BNB" : total.toFixed(4) + " BNB");
    var firstNo = state.printed + 1;
    var scoops = 0;
    for (var j = 0; j < n; j++) if (firstNo + j <= 100) scoops++;
    set("calc-scoop", scoops > 0
      ? scoops + " of your copies land in the Scoop zone (Nº " + firstNo + " to " + (firstNo + n - 1) + ")."
      : "Scoop zone is gone for this edition; your copies start at Nº " + firstNo + ".");
  }
  if (range) range.addEventListener("input", calcUpdate);

  refreshEdition().then(latest);
  setInterval(refreshEdition, 30000);
  setInterval(tickCountdown, 1000);
})();
