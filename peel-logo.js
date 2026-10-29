/* The logo, alive: a violet film lies on a phone, its bottom-right corner peels off, holds, and sticks back down.
   The markup in index.html is already the finished (peeled) logo, so without this script, or with reduced
   motion, the logo simply stands still. svg.peel-logo[data-peel=loop] plays the loop while it is on screen;
   svg.peel-logo[data-peel=hover] gives the corner a little lift when the pointer passes. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var logos = document.querySelectorAll('svg.peel-logo');
  if (reduce || !logos.length) return;

  var MAX = 110;  /* how far the corner is peeled in the finished logo, in logo units */

  /* the film is clipped by a polygon that loses its bottom-right corner; the flap is that corner folded over */
  function setPeel(svg, s) {
    var cut = svg.querySelector('clipPath polygon'), flap = svg.querySelector('.flap');
    cut.setAttribute('points', '160,54 352,54 352,' + (450 - s) + ' ' + (344 - s) + ',458 160,458');
    flap.setAttribute('points', '348,' + (454 - s) + ' ' + (348 - s) + ',454 ' + (348 - s) + ',' + (454 - s));
    flap.style.opacity = s < 4 ? s / 4 : 1;
  }
  function easeOutBack(k) { var c = 1.3; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); }
  function easeInOut(k) { return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function tween(ms, ease, fn) {
    return new Promise(function (done) {
      var t0;
      (function frame(t) {
        t0 = t0 || t;
        var k = Math.min(1, (t - t0) / ms);
        fn(ease(k));
        if (k < 1) requestAnimationFrame(frame); else done();
      })(performance.now());
    });
  }
  function sleep(ms) { return new Promise(function (done) { setTimeout(done, ms); }); }
  function play(el, frames, opts) { return el.animate ? el.animate(frames, opts).finished : sleep(opts.duration); }

  /* a loop only runs while its logo is on screen and the tab is in front */
  function onScreen(svg) {
    return new Promise(function (go) {
      (function check() {
        if (svg.__seen && !document.hidden) go(); else setTimeout(check, 250);
      })();
    });
  }
  if ('IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.__seen = e.isIntersecting; }); });
    logos.forEach(function (svg) { seen.observe(svg); });
  } else {
    logos.forEach(function (svg) { svg.__seen = true; });
  }

  function slideOn(svg) {
    var film = svg.querySelector('.film');
    var a = play(film, [
      { transform: 'translate(46px,-96px) rotate(9deg)', opacity: 0 },
      { transform: 'translate(0,8px) rotate(-1deg)', opacity: 1, offset: .66 },
      { transform: 'none', opacity: 1 }
    ], { duration: 850, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
    return a.then(function () { film.style.opacity = 1; });
  }
  function sheen(svg) {
    var band = svg.querySelector('.sheen');
    if (!band) return sleep(0);
    return play(band, [
      { transform: 'translateX(-170px)', opacity: 0 },
      { opacity: .55, offset: .4 },
      { transform: 'translateX(190px)', opacity: 0 }
    ], { duration: 900, easing: 'ease-in-out' });
  }
  function stick(svg) {
    return play(svg.querySelector('.film'), [
      { transform: 'scale(1)' }, { transform: 'scale(1.035)', offset: .4 }, { transform: 'scale(1)' }
    ], { duration: 320, easing: 'ease-out' });
  }

  function cycle(svg) {
    return onScreen(svg)
      .then(function () { return sleep(500); })
      .then(function () { return sheen(svg); })
      .then(function () { return tween(900, easeOutBack, function (k) { setPeel(svg, MAX * k); }); })
      .then(function () { return sleep(2600); })
      .then(function () { return tween(650, easeInOut, function (k) { setPeel(svg, MAX * (1 - k)); }); })
      .then(function () { return stick(svg); })
      .then(function () { return sleep(1400); })
      .then(function () { return cycle(svg); });
  }

  logos.forEach(function (svg) {
    var mode = svg.getAttribute('data-peel');
    if (mode === 'loop') {
      var film = svg.querySelector('.film');
      setPeel(svg, 0);
      film.style.opacity = 0;
      onScreen(svg).then(function () { return slideOn(svg); }).then(function () { return cycle(svg); });
    } else if (mode === 'hover') {
      var busy = false;
      svg.addEventListener('mouseenter', function () {
        if (busy) return;
        busy = true;
        tween(420, function (k) { return k; }, function (k) { setPeel(svg, MAX + 18 * Math.sin(Math.PI * k)); })
          .then(function () { setPeel(svg, MAX); busy = false; });
      });
    }
  });
})();
