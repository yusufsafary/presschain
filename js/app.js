/* Presschain page behaviour: copy buttons and reveal on scroll.
   Every lookup is null-guarded. */
(function () {
  function $(id) { return document.getElementById(id); }

  function wireCopy(btnId, srcId, label) {
    var btn = $(btnId), src = $(srcId);
    if (!btn || !src) return;
    btn.addEventListener("click", function () {
      var t = src.textContent;
      try {
        if (navigator.clipboard) navigator.clipboard.writeText(t);
        else {
          var ta = document.createElement("textarea");
          ta.value = t; document.body.appendChild(ta); ta.select();
          document.execCommand("copy"); ta.remove();
        }
      } catch (err) { /* clipboard unavailable */ }
      btn.textContent = "Copied";
      setTimeout(function () { btn.textContent = label; }, 1600);
    });
  }
  wireCopy("copy-prompt", "agent-prompt", "Copy prompt");
  wireCopy("copy-prompt-claim", "claim-prompt", "Copy prompt");
  wireCopy("copy-token", "token-addr", "Copy address");

  /* Jam UTC live di utility bar: "THU 12 NOV 2026 · 01:23:45 UTC". */
  var clock = $("utc-clock");
  if (clock) {
    var DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    var MONS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var tickClock = function () {
      var d = new Date();
      clock.textContent = DAYS[d.getUTCDay()] + " " + pad(d.getUTCDate()) + " " + MONS[d.getUTCMonth()] + " " + d.getUTCFullYear() +
        " · " + pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds()) + " UTC";
    };
    tickClock();
    setInterval(tickClock, 1000);
  }

  if ("IntersectionObserver" in window) {
    var rvEls = document.querySelectorAll(".sec, .facts-band, .board, .perk, .steps-l li, .swap-card");
    var rvIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); rvIO.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });
    rvEls.forEach(function (el) { el.classList.add("rv"); rvIO.observe(el); });
  }
})();

/* Bayangan navrow saat halaman digeser */
(function () {
  function onScroll() { document.body.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
