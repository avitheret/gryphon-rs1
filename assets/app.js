/* ============================================================
   GRYPHON RS·1 — interactions
   ============================================================ */
(function () {
  'use strict';

  /* ---- sticky nav state ---- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- mobile menu toggle (simple anchor reveal) ---- */
  var toggle = document.getElementById('navToggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var links = document.querySelector('.nav-links');
      if (!links) return;
      var open = links.style.display === 'flex';
      links.style.display = open ? '' : 'flex';
      links.style.position = 'fixed';
      links.style.flexDirection = 'column';
      links.style.top = '68px';
      links.style.right = '16px';
      links.style.background = 'var(--surface-2)';
      links.style.border = '1px solid var(--line)';
      links.style.borderRadius = '4px';
      links.style.padding = '16px 20px';
      links.style.gap = '14px';
      links.style.zIndex = '120';
      if (open) { links.removeAttribute('style'); }
    });
  }

  /* ---- scroll reveal ---- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- anatomy callouts: tap to open on touch ---- */
  var points = document.querySelectorAll('.cpoint');
  points.forEach(function (p) {
    p.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var wasOpen = p.classList.contains('open');
      points.forEach(function (o) { o.classList.remove('open'); });
      if (!wasOpen) p.classList.add('open');
    });
  });
  document.addEventListener('click', function () {
    points.forEach(function (o) { o.classList.remove('open'); });
  });

  /* ---- play button (placeholder) ---- */
  var play = document.getElementById('playBtn');
  if (play) {
    play.addEventListener('click', function () {
      play.animate(
        [{ transform: 'scale(1.06)' }, { transform: 'scale(0.9)' }, { transform: 'scale(1.06)' }],
        { duration: 320, easing: 'ease-out' }
      );
    });
  }

  /* ============================================================
     RADAR / SPIDER CHART
     ============================================================ */
  var AXES = ['Dry Handling', 'Dry Braking', 'Steering Response', 'Lap Times', 'Tread Life'];
  // values 0..1
  var SERIES_A = [0.96, 0.92, 0.95, 0.94, 0.62]; // GRYPHON RS-1
  var SERIES_B = [0.82, 0.80, 0.78, 0.80, 0.88]; // Competitor R7

  function renderRadar() {
    var box = document.getElementById('radarBox');
    if (!box) return;
    var size = 360;
    var cx = size / 2, cy = size / 2;
    var R = size * 0.34;
    var n = AXES.length;
    var rings = 4;
    var svgNS = 'http://www.w3.org/2000/svg';

    function pt(i, r) {
      var a = (Math.PI * 2 * i) / n - Math.PI / 2;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    }

    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Performance comparison radar chart');

    // concentric rings
    for (var ring = 1; ring <= rings; ring++) {
      var r = (R * ring) / rings;
      var d = '';
      for (var i = 0; i <= n; i++) {
        var p = pt(i % n, r);
        d += (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' ';
      }
      var poly = document.createElementNS(svgNS, 'path');
      poly.setAttribute('d', d + 'Z');
      poly.setAttribute('class', 'radar-grid-line');
      svg.appendChild(poly);
    }

    // spokes + labels
    for (var s = 0; s < n; s++) {
      var outer = pt(s, R);
      var line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', cx); line.setAttribute('y1', cy);
      line.setAttribute('x2', outer[0]); line.setAttribute('y2', outer[1]);
      line.setAttribute('class', 'radar-spoke');
      svg.appendChild(line);

      var lp = pt(s, R + 26);
      var txt = document.createElementNS(svgNS, 'text');
      txt.setAttribute('x', lp[0]); txt.setAttribute('y', lp[1]);
      txt.setAttribute('class', 'radar-axis-label');
      var anchor = 'middle';
      if (lp[0] < cx - 6) anchor = 'end';
      else if (lp[0] > cx + 6) anchor = 'start';
      txt.setAttribute('text-anchor', anchor);
      txt.setAttribute('dominant-baseline', 'middle');
      // wrap two-word labels onto two lines
      var words = AXES[s].split(' ');
      if (words.length > 1) {
        var t1 = document.createElementNS(svgNS, 'tspan');
        t1.setAttribute('x', lp[0]); t1.setAttribute('dy', '-0.5em');
        t1.textContent = words[0];
        var t2 = document.createElementNS(svgNS, 'tspan');
        t2.setAttribute('x', lp[0]); t2.setAttribute('dy', '1.1em');
        t2.textContent = words.slice(1).join(' ');
        txt.appendChild(t1); txt.appendChild(t2);
      } else {
        txt.textContent = AXES[s];
      }
      svg.appendChild(txt);
    }

    function seriesPath(vals) {
      var d = '';
      for (var i = 0; i <= n; i++) {
        var p = pt(i % n, R * vals[i % n]);
        d += (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' ';
      }
      return d + 'Z';
    }
    function seriesDots(vals, cls) {
      for (var i = 0; i < n; i++) {
        var p = pt(i, R * vals[i]);
        var c = document.createElementNS(svgNS, 'circle');
        c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]);
        c.setAttribute('r', '3.5'); c.setAttribute('class', cls);
        svg.appendChild(c);
      }
    }

    var pb = document.createElementNS(svgNS, 'path');
    pb.setAttribute('d', seriesPath(SERIES_B));
    pb.setAttribute('class', 'poly-b');
    svg.appendChild(pb);

    var pa = document.createElementNS(svgNS, 'path');
    pa.setAttribute('d', seriesPath(SERIES_A));
    pa.setAttribute('class', 'poly-a');
    svg.appendChild(pa);

    seriesDots(SERIES_B, 'dot-b');
    seriesDots(SERIES_A, 'dot-a');

    // animate-in: scale from center once visible
    box.innerHTML = '';
    box.appendChild(svg);

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var grp = [pa, pb];
    grp.forEach(function (el) {
      el.style.transformOrigin = cx + 'px ' + cy + 'px';
      el.style.transform = 'scale(0.2)';
      el.style.opacity = '0';
      el.style.transition = 'transform .8s cubic-bezier(.2,.7,.2,1), opacity .8s ease';
    });
    var seen = false;
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !seen) {
          seen = true;
          grp.forEach(function (el) { el.style.transform = 'scale(1)'; el.style.opacity = '1'; });
        }
      });
    }, { threshold: 0.3 });
    rio.observe(box);
  }

  renderRadar();
  window.addEventListener('resize', function () {
    // radar is viewBox-scaled, no re-render needed
  });
})();
