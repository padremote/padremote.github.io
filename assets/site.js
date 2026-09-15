/**
 * Everything the site does at runtime, which is three things.
 *
 * The reveal class is added here rather than written into the markup on
 * purpose: a page whose content starts at `opacity: 0` and waits for script is
 * a blank page to anything that does not run script. Marked-up elements carry
 * `data-reveal`; they only become hidden once something is around to show them.
 */
const reveal = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  for (const el of reveal) el.classList.add("reveal");

  const seen = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        // Staggering is per element rather than per section, so a row of three
        // arrives as a row of three rather than all at once.
        const delay = Number(entry.target.dataset.revealDelay || 0);
        setTimeout(() => entry.target.classList.add("in"), delay);
        seen.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
  );

  for (const el of reveal) seen.observe(el);
}

// Copy the install command, and say so: a button that does something invisible
// reads as a button that did nothing.
for (const button of document.querySelectorAll("[data-copy]")) {
  button.addEventListener("click", async () => {
    const source = document.getElementById(button.dataset.copy);
    try {
      await navigator.clipboard.writeText(source.textContent);
      const was = button.textContent;
      button.textContent = "Copied";
      setTimeout(() => (button.textContent = was), 1600);
    } catch {
      button.textContent = "Press ⌘C";
    }
  });
}

// The hero screenshot, touched. Over the pad, the mouse turns into a fingertip
// and leaves the same tapered trail the app draws under a real finger (ported
// from `web/src/trail.ts`); a click is a tap. Mouse only: on a phone a finger
// on the picture should still scroll the page.
const pad = document.querySelector("[data-pad-touch]");

if (pad && pad.getContext && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const ctx = pad.getContext("2d");
  const COLOR = "#2f6feb"; // the app's first-finger blue
  const TRAIL_MS = 420;
  const LIFT_MS = 220;
  const TAP_MS = 380;

  let width = 0;
  let height = 0;
  let scale = 1; // the screenshot is a 420pt-wide phone drawn smaller
  let points = [];
  let taps = [];
  let head = null; // where the fingertip is, while the mouse is over the pad
  let liftedAt = 0;
  let frame = 0;

  const resize = () => {
    const r = pad.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    width = r.width;
    height = r.height;
    scale = r.width / 386; // the pad is 386pt wide in the app
    pad.width = Math.round(r.width * dpr);
    pad.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const local = (e) => {
    const r = pad.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const trail = (now) => {
    if (points.length < 2) return;
    const max = 11 * scale;
    const half = points.map((p) => {
      const age = Math.max(0, 1 - (now - p.t) / TRAIL_MS);
      return max * age * age;
    });
    const normals = points.map((_p, i) => {
      const a = points[Math.max(0, i - 1)];
      const b = points[Math.min(points.length - 1, i + 1)];
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      return { x: -(b.y - a.y) / len, y: (b.x - a.x) / len };
    });
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = p.x + normals[i].x * half[i];
      const y = p.y + normals[i].y * half[i];
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    for (let i = points.length - 1; i >= 0; i--) {
      ctx.lineTo(points[i].x - normals[i].x * half[i], points[i].y - normals[i].y * half[i]);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = COLOR;
    ctx.shadowColor = COLOR;
    ctx.shadowBlur = 14 * scale;
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  // The dot and the soft patch it presses through; lifting shrinks both away.
  const fingertip = (p, k) => {
    ctx.globalAlpha = 0.35 * k;
    ctx.fillStyle = COLOR;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 9 * scale * (0.6 + 0.4 * k), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = k;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5 * scale * (0.6 + 0.4 * k), 0, Math.PI * 2);
    ctx.fill();
  };

  const ripple = (tap, now) => {
    const t = (now - tap.t) / TAP_MS;
    const ease = 1 - Math.pow(1 - t, 3);
    ctx.globalAlpha = 0.6 * (1 - t);
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.arc(tap.x, tap.y, (8 + 22 * ease) * scale, 0, Math.PI * 2);
    ctx.stroke();
  };

  const draw = () => {
    const now = performance.now();
    ctx.clearRect(0, 0, width, height);
    while (points.length && now - points[0].t > TRAIL_MS) points.shift();
    taps = taps.filter((tap) => now - tap.t < TAP_MS);

    trail(now);
    for (const tap of taps) ripple(tap, now);
    if (head) fingertip(head, 1);
    else if (points.length && now - liftedAt < LIFT_MS) {
      fingertip(points[points.length - 1], 1 - (now - liftedAt) / LIFT_MS);
    }
    ctx.globalAlpha = 1;

    // Only animate while there is something on the pad.
    frame = head || points.length || taps.length ? requestAnimationFrame(draw) : 0;
  };
  const wake = () => {
    if (!frame) frame = requestAnimationFrame(draw);
  };

  pad.classList.add("live");
  resize();
  new ResizeObserver(resize).observe(pad);

  pad.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const now = performance.now();
    // Coalesced events keep a fast flick a curve rather than a polyline.
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of events.length ? events : [e]) points.push({ ...local(ev), t: now });
    head = local(e);
    wake();
  });
  pad.addEventListener("pointerleave", () => {
    head = null;
    liftedAt = performance.now();
    wake();
  });
  pad.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    taps.push({ ...local(e), t: performance.now() });
    wake();
  });
}
