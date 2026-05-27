(() => {
  "use strict";

  const year = document.getElementById("year");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = Array.from(document.querySelectorAll(".reveal"));

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const canvas = document.getElementById("waveCanvas");
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d", { alpha: true });
  const traces = [
    { color: "rgba(158, 227, 223, 0.62)", amp: 24, speed: 0.0012, y: 0.30 },
    { color: "rgba(255, 190, 119, 0.55)", amp: 18, speed: 0.0016, y: 0.47 },
    { color: "rgba(191, 211, 236, 0.45)", amp: 32, speed: -0.0010, y: 0.66 }
  ];
  let width = 0;
  let height = 0;
  let ratio = 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(0);
  }

  function drawGrid(time) {
    const spacing = width < 720 ? 46 : 64;
    const drift = reducedMotion ? 0 : (time * 0.012) % spacing;

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.055)";
    ctx.lineWidth = 1;

    for (let x = -spacing; x < width + spacing; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x + drift, 0);
      ctx.lineTo(x + drift - height * 0.16, height);
      ctx.stroke();
    }

    for (let y = spacing; y < height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y + Math.sin(time * 0.001 + y * 0.02) * 8);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawTrace(trace, index, time) {
    ctx.save();
    ctx.strokeStyle = trace.color;
    ctx.lineWidth = index === 0 ? 2.4 : 1.6;
    ctx.beginPath();

    for (let x = 0; x <= width; x += 8) {
      const y = height * trace.y
        + Math.sin(x * 0.012 + time * trace.speed + index) * trace.amp
        + Math.sin(x * 0.037 - time * trace.speed * 0.7) * trace.amp * 0.34;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.restore();
  }

  function drawSensors(time) {
    const count = width < 720 ? 8 : 13;
    const baseY = height * 0.78;

    ctx.save();
    for (let i = 0; i < count; i += 1) {
      const x = (width / (count + 1)) * (i + 1);
      const pulse = reducedMotion ? 0.45 : 0.45 + Math.sin(time * 0.003 + i) * 0.25;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.55 + pulse * 0.25})`;
      ctx.beginPath();
      ctx.arc(x, baseY + Math.sin(i) * 8, 3 + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(158, 227, 223, ${0.18 + pulse * 0.12})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, baseY + Math.sin(i) * 8, 16 + pulse * 16, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#102f45");
    gradient.addColorStop(0.54, "#0d5c5a");
    gradient.addColorStop(1, "#123247");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    drawGrid(time);
    traces.forEach((trace, index) => drawTrace(trace, index, time));
    drawSensors(time);

    if (!reducedMotion) {
      window.requestAnimationFrame(draw);
    }
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();

  if (!reducedMotion) {
    window.requestAnimationFrame(draw);
  }
})();
