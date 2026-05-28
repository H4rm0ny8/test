// Derived from `profile/js/main.js` but defensive:
// writeups pages don't always include every element (e.g. `#typewriter`).

/* ── Animated honeycomb background ── */
const canvas = document.getElementById("hex-canvas");
const ctx = canvas?.getContext?.("2d");

let hexes = [];
let mouse = { x: -9999, y: -9999 };

const HEX_R = 28;
const HEX_H = HEX_R * Math.sqrt(3);
let rafId;

function buildGrid() {
  if (!canvas || !ctx) return;

  hexes = [];
  const cols = Math.ceil(canvas.width / (HEX_R * 1.5)) + 2;
  const rows = Math.ceil(canvas.height / HEX_H) + 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const offsetX = row % 2 === 0 ? 0 : HEX_R * 0.75;
      const x = col * HEX_R * 1.5 + offsetX;
      const y = row * HEX_H * 0.5;
      hexes.push({
        x,
        y,
        baseAlpha: 0.04 + Math.random() * 0.06,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }
}

function drawHex(x, y, r, alpha) {
  if (!ctx) return;

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const px = x + r * Math.cos(angle);
    const py = y + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = `rgba(0, 255, 65, ${alpha})`;
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

function animateBg(time) {
  if (!canvas || !ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const hex of hexes) {
    const dx = mouse.x - hex.x;
    const dy = mouse.y - hex.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const proximity = Math.max(0, 1 - dist / 180);
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.001 + hex.phase);
    const alpha = hex.baseAlpha + proximity * 0.25 + pulse * 0.03;
    drawHex(hex.x, hex.y, HEX_R - 2, alpha);
  }

  rafId = requestAnimationFrame(animateBg);
}

function resizeCanvas() {
  if (!canvas || !ctx) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  buildGrid();
}

if (canvas && ctx) {
  window.addEventListener("resize", resizeCanvas);
  document.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  resizeCanvas();
  animateBg(0);
}

/* ── Cursor glow ── */
const glow = document.querySelector(".cursor-glow");
if (glow) {
  document.addEventListener("mousemove", (e) => {
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
  });
}

/* ── Typing effect ── */
const typeEl = document.getElementById("typewriter");
if (typeEl) {
  const titles = [
    "Penetration Tester",
    "Red Team Enthusiast",
    "Bug Bounty Hunter",
    "CTF Player",
  ];

  let titleIdx = 0;
  let charIdx = 0;
  let deleting = false;

  function typeLoop() {
    const current = titles[titleIdx];
    const display = current.substring(0, charIdx);

    typeEl.innerHTML = `${display}<span class="cursor-blink">|</span>`;

    if (!deleting && charIdx < current.length) {
      charIdx++;
      setTimeout(typeLoop, 80);
    } else if (!deleting && charIdx === current.length) {
      setTimeout(() => {
        deleting = true;
        typeLoop();
      }, 2000);
    } else if (deleting && charIdx > 0) {
      charIdx--;
      setTimeout(typeLoop, 40);
    } else {
      deleting = false;
      titleIdx = (titleIdx + 1) % titles.length;
      setTimeout(typeLoop, 400);
    }
  }

  typeLoop();
}

/* ── Scroll reveal ── */
const revealEls = document.querySelectorAll(".hero, .section");
if (revealEls.length) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  revealEls.forEach((el) => revealObserver.observe(el));
}

/* ── Skill meters animate on view ── */
const meters = document.querySelectorAll(".meter-fill");
if (meters.length) {
  const meterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;
          target.style.width = target.dataset.width;
          meterObserver.unobserve(target);
        }
      });
    },
    { threshold: 0.5 }
  );

  meters.forEach((m) => meterObserver.observe(m));
}

/* ── Section nav dots ── */
const sections = document.querySelectorAll("[data-section]");
const navDots = document.querySelectorAll(".nav-dot");

if (navDots.length) {
  navDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const id = dot.dataset.target;
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    });
  });

  if (sections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navDots.forEach((d) =>
              d.classList.toggle("active", d.dataset.target === id)
            );
          }
        });
      },
      { threshold: 0.4 }
    );

    sections.forEach((s) => sectionObserver.observe(s));
  }
}

/* ── Experience card tilt ── */
document.querySelectorAll(".exp-card").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    if (e.target.closest("a")) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateX(6px) perspective(400px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

/* ── Skill hex ripple ── */
document.querySelectorAll(".skill-hex").forEach((hex) => {
  hex.addEventListener("click", () => {
    hex.style.transform = "scale(0.95)";
    setTimeout(() => {
      hex.style.transform = "";
    }, 150);
  });
});

