/**
 * Everything the site does at runtime, which is two things.
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
