// CONFIG: edita textos, fecha inicial, foto opcional y musica local desde aqui.
const CONFIG = {
  startDate: "2021-02-12T00:00:00-05:00",
  photoUrl: "",
  photoAlt: "Un recuerdo de ustedes dos",
  musicSrc: "tema.mp3",
  musicAutoplayOnOpen: true,
  musicVolume: 0.25,
  letterTitle: "Feliz cumpleaños, mi princesita",
  paragraphs: [
    "Cómo me encantaría estar ahí contigo hoy... ir a comer algo rico, salir a pasear, chismear un ratito y simplemente disfrutarte.",
    "Te amo muchísimo. Hoy cumples un añito más, mi princesita, y eso me llena de felicidad. Me encantas, me encanta todo de ti, tu forma de ser, tu risa, tus ocurrencias, todo.",
    "Quiero estar contigo toda la vida, y en algún momento poder celebrarte yo mismo tu cumpleaños en persona... bueno, los dos cumpleaños, porque sé que mereces que te celebren ambos.",
    "Quiero darte muchos detalles, muchas cositas bonitas, pero sobre todo mucho amor.",
    "Espero que me permitas acompañarte en muchos cumpleaños más, mi niñita preciosa. 💖🌷"
  ],
  gifts: [
    {
      title: "Impresora para mi princesita",
      description: "La impresora que quiera mi princesita."
    },
    {
      title: "50 pesitos en Shein o Temu",
      description: "50 pesitos en Shein o Temu. Si me regala un besito, seria para cada tienda."
    },
    {
      title: "Sushisito varias veces",
      description: "Sushisito varias veces, la cantidad que quiera."
    }
  ]
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const state = {
  reduceMotion: prefersReducedMotion.matches,
  animationFrame: 0,
  lastTime: 0,
  tulips: [],
  particles: [],
  width: 0,
  height: 0,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  musicEnabled: false,
  giftMode: "blind",
  revealedGiftIndex: -1,
  lastFocusedElement: null
};

const elements = {
  body: document.body,
  openLetter: document.getElementById("openLetter"),
  letterPanel: document.getElementById("letterPanel"),
  letterHeading: document.getElementById("letterHeading"),
  letterBody: document.getElementById("letterBody"),
  letterNext: document.getElementById("letterNext"),
  counterSection: document.getElementById("counterSection"),
  counterValue: document.getElementById("counterValue"),
  counterNext: document.getElementById("counterNext"),
  closingSection: document.getElementById("closingSection"),
  openGiftModal: document.getElementById("openGiftModal"),
  backToTop: document.getElementById("backToTop"),
  giftModal: document.getElementById("giftModal"),
  closeGiftModal: document.getElementById("closeGiftModal"),
  giftManual: document.getElementById("giftManual"),
  giftRandom: document.getElementById("giftRandom"),
  giftDeck: document.getElementById("giftDeck"),
  giftStatus: document.getElementById("giftStatus"),
  giftReveal: document.getElementById("giftReveal"),
  giftRevealTitle: document.getElementById("giftRevealTitle"),
  giftRevealText: document.getElementById("giftRevealText"),
  photoFrame: document.getElementById("photoFrame"),
  photo: document.getElementById("photo"),
  canvas: document.getElementById("sky"),
  musicToggle: document.getElementById("musicToggle"),
  bgMusic: document.getElementById("bgMusic")
};

const ctx = elements.canvas.getContext("2d");

function init() {
  renderLetter();
  renderPhoto();
  renderGifts();
  setupMotionPreference();
  setupMusic();
  bindEvents();
  resizeCanvas();
  updateCounter();
  window.setInterval(updateCounter, 1000);
  startScene();
}

function renderLetter() {
  elements.letterHeading.textContent = CONFIG.letterTitle;
  elements.letterBody.innerHTML = "";

  CONFIG.paragraphs.forEach((text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    elements.letterBody.appendChild(paragraph);
  });
}

function renderPhoto() {
  if (!CONFIG.photoUrl) {
    return;
  }

  elements.photo.src = CONFIG.photoUrl;
  elements.photo.alt = CONFIG.photoAlt || "Foto especial";
  elements.photoFrame.classList.add("visible");
}

function renderGifts() {
  elements.giftDeck.innerHTML = "";

  CONFIG.gifts.slice(0, 3).forEach((gift, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "gift-card";
    card.dataset.index = String(index);
    card.setAttribute("aria-label", "Carta sorpresa " + (index + 1));

    const inner = document.createElement("span");
    inner.className = "gift-card-inner";

    const back = document.createElement("span");
    back.className = "gift-card-face gift-card-back";

    const mark = document.createElement("span");
    mark.className = "gift-card-mark";
    mark.textContent = "?";

    const backLabel = document.createElement("span");
    backLabel.className = "gift-card-label";
    backLabel.textContent = "Sorpresa";

    const front = document.createElement("span");
    front.className = "gift-card-face gift-card-front";

    const title = document.createElement("span");
    title.className = "gift-card-title";

    const description = document.createElement("span");
    description.className = "gift-card-copy";

    front.append(title, description);
    back.append(mark, backLabel);
    inner.append(back, front);
    card.appendChild(inner);
    card.addEventListener("click", handleGiftCardClick);
    elements.giftDeck.appendChild(card);
  });

  syncGiftCardContent();
}

function bindEvents() {
  elements.openLetter.addEventListener("click", revealLetter);
  elements.letterNext.addEventListener("click", showNextLetterStep);
  elements.counterNext.addEventListener("click", revealClosing);
  elements.openGiftModal.addEventListener("click", openGiftModal);
  elements.closeGiftModal.addEventListener("click", closeGiftModal);
  elements.giftManual.addEventListener("click", enableBlindGiftSelection);
  elements.giftRandom.addEventListener("click", enableVisibleGiftSelection);
  elements.giftModal.addEventListener("click", handleGiftModalClick);
  elements.backToTop.addEventListener("click", resetExperience);

  elements.musicToggle.addEventListener("click", toggleMusic);
  window.addEventListener("resize", resizeCanvas, { passive: true });
  document.addEventListener("keydown", handleKeyDown);

  if (typeof prefersReducedMotion.addEventListener === "function") {
    prefersReducedMotion.addEventListener("change", () => {
      setReduceMotion(prefersReducedMotion.matches);
    });
  }
}

function setupMotionPreference() {
  setReduceMotion(prefersReducedMotion.matches);
}

function setupMusic() {
  if (!CONFIG.musicSrc) {
    return;
  }

  elements.bgMusic.src = CONFIG.musicSrc;
  elements.bgMusic.volume = clamp(CONFIG.musicVolume, 0, 1);
  elements.musicToggle.hidden = false;
}

function setReduceMotion(value) {
  state.reduceMotion = Boolean(value);
  elements.body.classList.toggle("motion-reduced", state.reduceMotion);

  resetScene();
  if (state.reduceMotion) {
    drawScene(0);
  } else {
    startScene();
  }
}

function revealLetter() {
  resetExperienceState();
  elements.body.classList.remove("intro-locked");

  if (elements.letterPanel.hasAttribute("hidden")) {
    elements.letterPanel.removeAttribute("hidden");
    requestAnimationFrame(() => {
      elements.letterPanel.classList.add("visible");
    });
  }

  renderLetter();
  elements.letterPanel.classList.add("visible");
  elements.letterPanel.setAttribute("aria-hidden", "false");

  if (CONFIG.musicSrc && CONFIG.musicAutoplayOnOpen) {
    playMusic();
  }

  scrollToElement(elements.letterPanel);
  window.setTimeout(() => elements.letterPanel.focus(), state.reduceMotion ? 0 : 260);
}

function showNextLetterStep() {
  revealPanel(elements.counterSection);
}

function revealClosing() {
  revealPanel(elements.closingSection);
}

function openGiftModal() {
  resetGiftState();
  state.lastFocusedElement = document.activeElement;
  elements.body.classList.add("modal-open");
  elements.giftModal.removeAttribute("hidden");
  elements.giftModal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => elements.giftManual.focus(), state.reduceMotion ? 0 : 40);
}

function closeGiftModal() {
  hideGiftModal(true);
}

function hideGiftModal(restoreFocus) {
  elements.body.classList.remove("modal-open");
  elements.giftModal.setAttribute("hidden", "");
  elements.giftModal.setAttribute("aria-hidden", "true");

  if (restoreFocus && state.lastFocusedElement && typeof state.lastFocusedElement.focus === "function") {
    state.lastFocusedElement.focus();
  }
}

function handleGiftModalClick(event) {
  if (event.target === elements.giftModal) {
    closeGiftModal();
  }
}

function handleKeyDown(event) {
  if (event.key === "Escape" && !elements.giftModal.hasAttribute("hidden")) {
    closeGiftModal();
  }
}

function enableBlindGiftSelection() {
  if (state.revealedGiftIndex !== -1) {
    return;
  }

  state.giftMode = "blind";
  updateGiftModeButtons();
  syncGiftCardContent();
  elements.giftDeck.classList.remove("show-fronts");
  elements.giftStatus.textContent = "Toca una carta boca abajo para descubrir tu detalle.";
}

function enableVisibleGiftSelection() {
  if (state.revealedGiftIndex !== -1) {
    return;
  }

  state.giftMode = "visible";
  updateGiftModeButtons();
  syncGiftCardContent();
  elements.giftDeck.classList.add("show-fronts");
  elements.giftStatus.textContent = "Ahora puedes ver las tres opciones y elegir la que más quieras.";
}

function handleGiftCardClick(event) {
  if (state.revealedGiftIndex !== -1) {
    return;
  }

  if (state.giftMode !== "blind" && state.giftMode !== "visible") {
    elements.giftStatus.textContent = "Primero elige si lo quieres a ciegas o viendo las tres opciones.";
    return;
  }

  const giftIndex = Number(event.currentTarget.dataset.index);
  revealGift(giftIndex);
}

function revealGift(index) {
  const cards = getGiftCards();
  const selectedCard = cards[index];
  const selectionMode = state.giftMode;
  const selectedGift = selectionMode === "blind" ? CONFIG.gifts[0] : CONFIG.gifts[index];

  if (!selectedGift || !selectedCard) {
    return;
  }

  if (selectionMode === "blind") {
    setGiftCardContent(selectedCard, selectedGift);
  }

  state.revealedGiftIndex = index;
  state.giftMode = "locked";
  updateGiftModeButtons();
  elements.giftDeck.classList.toggle("show-fronts", selectionMode === "visible");

  cards.forEach((card, cardIndex) => {
    const isSelected = cardIndex === index;
    card.classList.toggle("revealed", selectionMode === "visible" || isSelected);
    card.classList.toggle("selected", isSelected);
    card.classList.toggle("muted", !isSelected);
    card.disabled = true;
  });

  elements.giftStatus.textContent = selectionMode === "visible"
    ? "Elegiste viendo las tres opciones."
    : "Elegiste tu detalle a ciegas.";
  elements.giftRevealTitle.textContent = selectedGift.title;
  elements.giftRevealText.textContent = selectedGift.description;
  elements.giftReveal.removeAttribute("hidden");
}

function getGiftCards() {
  return Array.from(elements.giftDeck.querySelectorAll(".gift-card"));
}

function syncGiftCardContent() {
  getGiftCards().forEach((card) => {
    const giftIndex = Number(card.dataset.index);
    setGiftCardContent(card, CONFIG.gifts[giftIndex]);
  });
}

function setGiftCardContent(card, gift) {
  if (!card || !gift) {
    return;
  }

  const title = card.querySelector(".gift-card-title");
  const description = card.querySelector(".gift-card-copy");

  if (title) {
    title.textContent = gift.title;
  }

  if (description) {
    description.textContent = gift.description;
  }
}

function resetGiftState() {
  state.giftMode = "blind";
  state.revealedGiftIndex = -1;
  updateGiftModeButtons();
  syncGiftCardContent();
  elements.giftDeck.classList.remove("show-fronts");
  elements.giftStatus.textContent = "Toca una carta boca abajo para descubrir tu detalle.";
  elements.giftReveal.setAttribute("hidden", "");
  elements.giftRevealTitle.textContent = "";
  elements.giftRevealText.textContent = "";

  getGiftCards().forEach((card) => {
    card.classList.remove("revealed", "selected", "muted");
    card.disabled = false;
  });
}

function updateGiftModeButtons() {
  const blindActive = state.giftMode === "blind";
  const visibleActive = state.giftMode === "visible";

  elements.giftManual.classList.toggle("is-active", blindActive);
  elements.giftRandom.classList.toggle("is-active", visibleActive);
  elements.giftManual.setAttribute("aria-pressed", String(blindActive));
  elements.giftRandom.setAttribute("aria-pressed", String(visibleActive));
}

function scrollToElement(element) {
  element.scrollIntoView({
    behavior: state.reduceMotion ? "auto" : "smooth",
    block: "start"
  });
}

function updateCounter() {
  const start = new Date(CONFIG.startDate);
  const now = new Date();

  if (Number.isNaN(start.getTime())) {
    elements.counterValue.textContent = "Fecha inicial no válida";
    return;
  }

  const diff = getCalendarDiff(start, now);
  elements.counterValue.textContent =
    diff.years + " años, " +
    diff.months + " meses, " +
    diff.days + " días, " +
    pad(diff.hours) + ":" +
    pad(diff.minutes) + ":" +
    pad(diff.seconds);
}

function getCalendarDiff(start, end) {
  let from = new Date(start);
  let years = 0;
  let months = 0;

  while (addToDate(from, years + 1, 0) <= end) {
    years += 1;
  }

  from = addToDate(from, years, 0);

  while (addToDate(from, 0, months + 1) <= end) {
    months += 1;
  }

  from = addToDate(from, 0, months);

  let remaining = end.getTime() - from.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;
  const minuteMs = 60 * 1000;

  const days = Math.floor(remaining / dayMs);
  remaining -= days * dayMs;

  const hours = Math.floor(remaining / hourMs);
  remaining -= hours * hourMs;

  const minutes = Math.floor(remaining / minuteMs);
  remaining -= minutes * minuteMs;

  const seconds = Math.floor(remaining / 1000);

  return { years, months, days, hours, minutes, seconds };
}

function addToDate(date, years, months) {
  const copy = new Date(date);
  copy.setFullYear(copy.getFullYear() + years);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

async function toggleMusic() {
  if (!CONFIG.musicSrc) {
    return;
  }

  if (state.musicEnabled) {
    pauseMusic();
    return;
  }

  await playMusic();
}

async function playMusic() {
  try {
    await elements.bgMusic.play();
    state.musicEnabled = true;
    updateMusicButton();
  } catch (error) {
    state.musicEnabled = false;
    updateMusicButton("Toca de nuevo para activar");
  }
}

function pauseMusic() {
  elements.bgMusic.pause();
  state.musicEnabled = false;
  updateMusicButton();
}

function updateMusicButton(message) {
  elements.musicToggle.setAttribute("aria-pressed", String(state.musicEnabled));
  elements.musicToggle.textContent = message || (state.musicEnabled ? "Pausar música" : "Activar música");
}

function revealPanel(element) {
  if (element.hasAttribute("hidden")) {
    element.removeAttribute("hidden");
    requestAnimationFrame(() => {
      element.classList.add("visible");
    });
  }

  element.classList.add("visible");
  scrollToElement(element);
}

function resetExperience() {
  hideGiftModal(false);
  resetExperienceState();
  elements.body.classList.add("intro-locked");
  scrollToElement(document.getElementById("top"));
}

function resetExperienceState() {
  renderLetter();
  hidePanel(elements.counterSection);
  hidePanel(elements.closingSection);
  resetGiftState();
}

function hidePanel(element) {
  element.classList.remove("visible");
  element.setAttribute("hidden", "");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function resizeCanvas() {
  const rect = elements.canvas.getBoundingClientRect();
  state.width = rect.width;
  state.height = rect.height;
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);

  elements.canvas.width = Math.round(state.width * state.dpr);
  elements.canvas.height = Math.round(state.height * state.dpr);
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

  resetScene();
  drawScene(0);

  if (!state.reduceMotion) {
    startScene();
  }
}

function resetScene() {
  cancelAnimationFrame(state.animationFrame);
  state.animationFrame = 0;
  state.lastTime = 0;
  state.tulips = buildTulips();
  state.particles = buildParticles();
}

function startScene() {
  if (state.reduceMotion || state.animationFrame) {
    return;
  }

  state.animationFrame = requestAnimationFrame(animate);
}

function animate(timestamp) {
  if (state.reduceMotion) {
    state.animationFrame = 0;
    return;
  }

  if (!state.lastTime) {
    state.lastTime = timestamp;
  }

  drawScene(timestamp * 0.001);
  state.animationFrame = requestAnimationFrame(animate);
}

function buildTulips() {
  const tulips = [];
  const count = state.width < 700 ? 6 : 10;
  const baseY = state.height;

  for (let index = 0; index < count; index += 1) {
    const progress = count === 1 ? 0.5 : index / (count - 1);
    const x = state.width * (0.06 + progress * 0.88);
    const scale = 0.7 + Math.random() * 0.6;

    tulips.push({
      x,
      y: baseY + 12,
      stemHeight: 90 + Math.random() * 70,
      bloomSize: 14 + Math.random() * 14,
      swaySpeed: 0.55 + Math.random() * 0.55,
      swayAmp: 0.03 + Math.random() * 0.035,
      phase: Math.random() * Math.PI * 2,
      scale,
      hueShift: Math.random() * 20 - 10
    });
  }

  return tulips;
}

function buildParticles() {
  const particles = [];
  const count = state.width < 700 ? 28 : 44;

  for (let index = 0; index < count; index += 1) {
    particles.push({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      size: Math.random() * 1.8 + 0.6,
      speedY: Math.random() * 0.14 + 0.03,
      speedX: (Math.random() - 0.5) * 0.08,
      alpha: Math.random() * 0.28 + 0.08,
      drift: Math.random() * Math.PI * 2
    });
  }

  return particles;
}

function drawScene(time) {
  ctx.clearRect(0, 0, state.width, state.height);
  drawParticles(time);
  drawGroundGlow();
  drawTulips(time);
}

function drawParticles(time) {
  state.particles.forEach((particle) => {
    const wobble = Math.sin(time * 0.3 + particle.drift) * 10;
    const x = particle.x + wobble + time * particle.speedX * 40;
    const y = (particle.y + time * particle.speedY * 60) % (state.height + 12);

    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,255," + particle.alpha.toFixed(3) + ")";
    ctx.arc((x + state.width) % state.width, y - 6, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawGroundGlow() {
  const gradient = ctx.createLinearGradient(0, state.height * 0.7, 0, state.height);
  gradient.addColorStop(0, "rgba(66, 78, 120, 0)");
  gradient.addColorStop(1, "rgba(33, 55, 78, 0.24)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, state.height * 0.68, state.width, state.height * 0.32);
}

function drawTulips(time) {
  state.tulips.forEach((tulip) => {
    const sway = state.reduceMotion ? 0 : Math.sin(time * tulip.swaySpeed + tulip.phase) * tulip.swayAmp;
    const stemTopY = tulip.y - tulip.stemHeight;
    const bloomBaseY = stemTopY - tulip.bloomSize * 0.2;
    const stemTopX = tulip.x + tulip.stemHeight * sway;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "rgba(103, 184, 138, 0.82)";
    ctx.lineWidth = 3 * tulip.scale;
    ctx.beginPath();
    ctx.moveTo(tulip.x, tulip.y);
    ctx.quadraticCurveTo(tulip.x + stemTopX * 0.03, tulip.y - tulip.stemHeight * 0.5, stemTopX, stemTopY);
    ctx.stroke();

    drawLeaf(tulip.x, tulip.y - tulip.stemHeight * 0.34, -1, tulip.scale, sway);
    drawLeaf(tulip.x, tulip.y - tulip.stemHeight * 0.2, 1, tulip.scale, sway * 0.8);

    ctx.translate(stemTopX, bloomBaseY);
    ctx.rotate(sway * 4);
    drawBloom(tulip.bloomSize, tulip.hueShift);

    ctx.restore();
  });
}

function drawLeaf(x, y, direction, scale, sway) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(direction * (0.75 + sway));
  const width = 12 * scale;
  const height = 34 * scale;

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(135, 219, 160, 0.86)");
  gradient.addColorStop(1, "rgba(40, 124, 88, 0.16)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(width, height * 0.2, width * 0.35, height);
  ctx.quadraticCurveTo(width * 0.04, height * 0.86, 0, 0);
  ctx.fill();
  ctx.restore();
}

function drawBloom(size, hueShift) {
  const petalColor = "hsla(" + (334 + hueShift) + ", 78%, 78%, 0.92)";
  const petalShadow = "hsla(" + (330 + hueShift) + ", 75%, 68%, 0.44)";

  ctx.shadowBlur = 14;
  ctx.shadowColor = petalShadow;

  drawPetal(0, -size * 0.72, size * 0.8, size * 1.2, petalColor, 0);
  drawPetal(-size * 0.58, -size * 0.14, size * 0.7, size, petalColor, -0.4);
  drawPetal(size * 0.58, -size * 0.14, size * 0.7, size, petalColor, 0.4);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255, 234, 224, 0.78)";
  ctx.beginPath();
  ctx.ellipse(0, size * 0.05, size * 0.16, size * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPetal(x, y, width, height, color, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  const gradient = ctx.createLinearGradient(0, -height * 0.5, 0, height * 0.5);
  gradient.addColorStop(0, "rgba(255, 240, 250, 0.96)");
  gradient.addColorStop(0.32, color);
  gradient.addColorStop(1, "rgba(171, 94, 146, 0.82)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, -height * 0.5);
  ctx.bezierCurveTo(width * 0.62, -height * 0.28, width * 0.72, height * 0.2, 0, height * 0.5);
  ctx.bezierCurveTo(-width * 0.72, height * 0.2, -width * 0.62, -height * 0.28, 0, -height * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

init();
