/* =============================================
   MAXWYNN — script.js
   Interactions, animations, canvas particles
   ============================================= */

(function () {
  "use strict";

  /* ─────────────────────────────────────────
     1. NAV — scroll-aware + mobile toggle
  ───────────────────────────────────────── */
  const nav        = document.getElementById("nav");
  const navBurger  = document.getElementById("navBurger");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileLinks = document.querySelectorAll(".mobile-link");

  function handleNavScroll() {
    if (window.scrollY > 20) {
      nav.classList.add("scrolled");
    } else {
      nav.classList.remove("scrolled");
    }
  }

  window.addEventListener("scroll", handleNavScroll, { passive: true });
  handleNavScroll();

  navBurger.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    navBurger.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
  });

  mobileLinks.forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      navBurger.classList.remove("open");
      document.body.style.overflow = "";
    });
  });

  /* ─────────────────────────────────────────
     1b. THEME TOGGLE — light / dark mode
  ───────────────────────────────────────── */
  const themeToggle = document.getElementById("themeToggle");
  const body        = document.body;

 // Always start in light mode
  body.classList.add("light");

  themeToggle.addEventListener("click", () => {
    const isLight = body.classList.toggle("light");
    localStorage.setItem("maxwynn-theme", isLight ? "light" : "dark");

    // Spin the icon a bit on click
    themeToggle.style.transform = "rotate(360deg)";
    setTimeout(() => { themeToggle.style.transform = ""; }, 400);
  });

  /* ─────────────────────────────────────────
     2. SCROLL REVEAL — IntersectionObserver
  ───────────────────────────────────────── */
  const revealEls = document.querySelectorAll(".reveal");

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  revealEls.forEach((el) => revealObserver.observe(el));

  /* ─────────────────────────────────────────
     4. ABOUT BAR FILLS — removed (section replaced)
  ───────────────────────────────────────── */

  /* ─────────────────────────────────────────
     5. HERO CANVAS — particle field
  ───────────────────────────────────────── */
  const canvas = document.getElementById("heroCanvas");
  const ctx    = canvas.getContext("2d");

  let W, H, particles = [], animFrame;

  const PARTICLE_COUNT   = 90;
  const CONNECTION_DIST  = 130;
  const ACCENT_COLOR      = "79,124,255";
  const ACCENT2_COLOR     = "124,92,255";

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function randomBetween(a, b) {
    return a + Math.random() * (b - a);
  }

  function createParticle() {
    return {
      x:  randomBetween(0, W),
      y:  randomBetween(0, H),
      vx: randomBetween(-0.25, 0.25),
      vy: randomBetween(-0.25, 0.25),
      r:  randomBetween(1, 2.5),
      opacity: randomBetween(0.15, 0.55),
    };
  }

  function initParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
  }

  function drawParticle(p) {
    // Alternate gently between the two accent colors
    const which = p.r > 2 ? ACCENT2_COLOR : ACCENT_COLOR;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${which}, ${p.opacity})`;
    ctx.fill();
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECTION_DIST) {
          const alpha = (1 - dist / CONNECTION_DIST) * 0.18;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${ACCENT_COLOR}, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }

  function updateParticle(p) {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0) p.x = W;
    if (p.x > W) p.x = 0;
    if (p.y < 0) p.y = H;
    if (p.y > H) p.y = 0;
  }

  function renderCanvas() {
    ctx.clearRect(0, 0, W, H);

    // Radial glow in centre-left (hero left side)
    const grd = ctx.createRadialGradient(W * 0.25, H * 0.5, 0, W * 0.25, H * 0.5, W * 0.45);
    grd.addColorStop(0,   "rgba(79,124,255,0.04)");
    grd.addColorStop(0.5, "rgba(124,92,255,0.02)");
    grd.addColorStop(1,   "transparent");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    drawConnections();
    particles.forEach(drawParticle);
    particles.forEach(updateParticle);

    animFrame = requestAnimationFrame(renderCanvas);
  }

  function initCanvas() {
    resize();
    initParticles();
    if (animFrame) cancelAnimationFrame(animFrame);
    renderCanvas();
  }

  const resizeObserver = new ResizeObserver(() => {
    resize();
    initParticles();
  });
  resizeObserver.observe(canvas.parentElement);

  initCanvas();

  /* ─────────────────────────────────────────
     6. MOUSE PARALLAX — subtle hero shift
  ───────────────────────────────────────── */
  const heroVisual = document.querySelector(".hero__visual");

  if (heroVisual && window.matchMedia("(hover: hover)").matches) {
    document.addEventListener("mousemove", (e) => {
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;  // –1 to 1
      const dy = (e.clientY - cy) / cy;

      heroVisual.style.transform = `translate(${dx * 8}px, ${dy * 8}px)`;
    });
  }

  /* ─────────────────────────────────────────
     7. SMOOTH SCROLL — catch all anchor links
  ───────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const id = anchor.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();

      const offset = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue("--nav-h") || "72",
        10
      );

      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior: "smooth",
      });
    });
  });

  /* ─────────────────────────────────────────
     8. WORKFLOW NODE — stagger on enter
  ───────────────────────────────────────── */
  const wfNodes = document.querySelectorAll(".wf-node, .wf-connector");

  const wfObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add("in-view");
          }, idx * 80);
          wfObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  wfNodes.forEach((el) => wfObserver.observe(el));

  /* ─────────────────────────────────────────
     9. CTA GLOW — mouse-tracked radial
  ───────────────────────────────────────── */
  const ctaSection = document.querySelector(".cta-final");
  const ctaGlow    = document.querySelector(".cta-final__glow");

  if (ctaSection && ctaGlow && window.matchMedia("(hover: hover)").matches) {
    ctaSection.addEventListener("mousemove", (e) => {
      const rect = ctaSection.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctaGlow.style.left = `${x}px`;
      ctaGlow.style.top  = `${y}px`;
      ctaGlow.style.transform = "translate(-50%, -50%)";
    });
  }

  /* ─────────────────────────────────────────
     10. SERVICE CARD — spotlight on hover
  ───────────────────────────────────────── */
  const serviceCards = document.querySelectorAll(".service-card");

  serviceCards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width)  * 100;
      const y = ((e.clientY - rect.top)  / rect.height) * 100;
      card.style.setProperty("--mx", `${x}%`);
      card.style.setProperty("--my", `${y}%`);
    });
  });

})();
