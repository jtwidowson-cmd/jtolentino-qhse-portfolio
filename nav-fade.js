// Eye-friendly in-page navigation.
// Instead of a long smooth-scroll "roll" (which can feel dizzying), clicking any
// in-page link (#section) gently fades the content out, jumps instantly to the
// target, then fades back in — so the visitor lands directly on the clicked section.
(function () {
  var main = document.getElementById("top") || document.querySelector("main");
  if (!main) return;

  var prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var HEADER_OFFSET = 76; // clears the sticky header so the section title isn't hidden
  main.classList.add("nav-fade");

  function jump(hash) {
    if (hash === "#top") {
      window.scrollTo(0, 0);
    } else {
      var el = document.getElementById(hash.slice(1));
      if (el) {
        var y = el.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;
        window.scrollTo(0, Math.max(0, y));
      }
    }
    // keep the address bar hash in sync without triggering another jump
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", hash);
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var hash = link.getAttribute("href");
      if (!hash || hash === "#") return;

      var target = hash === "#top" ? main : document.getElementById(hash.slice(1));
      if (!target) return; // let the browser handle anything we can't find

      event.preventDefault();

      if (prefersReduced) { jump(hash); return; } // respect reduced-motion: plain instant jump

      main.classList.add("nav-fade-out");
      window.setTimeout(function () {
        jump(hash);
        window.requestAnimationFrame(function () {
          main.classList.remove("nav-fade-out");
        });
      }, 180);
    });
  });
})();
