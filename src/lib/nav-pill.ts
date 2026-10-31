/*
 * The nav switcher's active pill as a physical object. Taps glide it to the
 * new tab on a spring; pressing and dragging lifts it, it follows the pointer
 * (rubber-banding past the ends), and on release it carries its velocity into
 * a snap onto the tab under the pointer (a flick projects past it). Speed
 * stretches it along the travel axis.
 *
 * At rest the pill's CSS rule for data-active-nav positions it, so the server
 * render and layout changes need no script. Glides run as Web Animations
 * sampled from the spring (compositor-driven); only an active drag runs a
 * frame loop.
 */

type Spring = { response: number; dampingRatio: number };
type SpringSample = { x: number; v: number };
type Geometry = { tabLefts: number[]; tabWidth: number; pillWidth: number; scale: number };

type Drag = {
  pointerId: number;
  pointerType: string;
  pressed: number;
  startX: number;
  startY: number;
  grab: number;
  dragging: boolean;
  history: Array<{ time: number; x: number }>;
};

export type NavPillController = {
  moveTo(index: number): void;
  dispose(): void;
};

const TAP_SPRING: Spring = { response: 0.38, dampingRatio: 0.85 };
const RELEASE_SPRING: Spring = { response: 0.36, dampingRatio: 0.8 };
// Stiff enough to read as 1:1, with a few milliseconds of trailing weight.
const DRAG_SPRING: Spring = { response: 0.16, dampingRatio: 0.9 };

const SAMPLE_MS = 1000 / 120;
const MAX_SPRING_MS = 1600;
const REST_DISTANCE = 0.2;
const REST_VELOCITY = 4;

const DRAG_THRESHOLD = 6;
const HOLD_LIFT_MS = 120;
const VELOCITY_WINDOW_MS = 80;
const PROJECTION_DECELERATION = 0.995;
const RUBBER_BAND = 0.55;

const STRETCH_PER_VELOCITY = 0.00018;
const MAX_STRETCH = 0.22;
const SQUASH = 0.5;
const MAGNIFY = 0.08;

export function simulateSpring(from: number, velocity: number, to: number, spring: Spring): SpringSample[] {
  const stiffness = ((2 * Math.PI) / spring.response) ** 2;
  const damping = (4 * Math.PI * spring.dampingRatio) / spring.response;
  const samples: SpringSample[] = [{ x: from, v: velocity }];
  let x = from;
  let v = velocity;
  let nextSample = SAMPLE_MS;

  for (let elapsed = 1; elapsed <= MAX_SPRING_MS; elapsed += 1) {
    v += (-stiffness * (x - to) - damping * v) / 1000;
    x += v / 1000;

    if (elapsed < nextSample) {
      continue;
    }

    nextSample += SAMPLE_MS;

    if (Math.abs(x - to) < REST_DISTANCE && Math.abs(v) < REST_VELOCITY) {
      break;
    }

    samples.push({ x, v });
  }

  samples.push({ x: to, v: 0 });

  return samples;
}

function stretchTransform(velocity: number) {
  const stretch = Math.min(MAX_STRETCH, Math.abs(velocity) * STRETCH_PER_VELOCITY);

  return `scale(${1 + stretch}, ${1 - stretch * SQUASH})`;
}

function rubberBand(overshoot: number, dimension: number) {
  return (overshoot * dimension * RUBBER_BAND) / (dimension + RUBBER_BAND * Math.abs(overshoot));
}

type NavPillOptions = {
  /** data-active-nav value for each tab, in tab order. */
  names: readonly string[];
  /** A drag chose a tab, or (null) was cancelled; the header syncs its state. */
  onCommit: (index: number | null) => void;
};

export function attachNavPill(switcher: HTMLElement, pill: HTMLElement, options: NavPillOptions): NavPillController {
  const body = pill.firstElementChild instanceof HTMLElement ? pill.firstElementChild : pill;
  const tabs = Array.from(switcher.querySelectorAll<HTMLElement>(":scope > a"));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const cssIndex = () => options.names.indexOf(pill.dataset.activeNav ?? "");
  let target = Math.max(0, cssIndex());
  let samples: SpringSample[] | null = null;
  let glide: Animation | null = null;
  let stretch: Animation | null = null;
  let drag: Drag | null = null;
  let geometry: Geometry | null = null;
  let frame = 0;
  let frameTime = 0;
  let x = 0;
  let v = 0;
  let dragTarget = 0;
  let holdTimer = 0;
  let suppressClick = false;

  pill.dataset.driven = "";

  function measure(): Geometry {
    const switcherRect = switcher.getBoundingClientRect();
    const scale = switcherRect.width / (switcher.offsetWidth || 1) || 1;
    const rects = tabs.map(tab => tab.getBoundingClientRect());
    const first = rects[0]?.left ?? 0;

    return {
      tabLefts: rects.map(rect => (rect.left - first) / scale),
      tabWidth: (rects[0]?.width ?? 0) / scale,
      pillWidth: pill.offsetWidth,
      scale,
    };
  }

  function presented(): SpringSample {
    if (drag?.dragging) {
      return { x, v };
    }

    if (glide && samples && glide.playState === "running") {
      const position = Number(glide.currentTime ?? 0) / SAMPLE_MS;
      const lower = samples[Math.min(samples.length - 1, Math.floor(position))];
      const upper = samples[Math.min(samples.length - 1, Math.ceil(position))];
      const mix = position - Math.floor(position);

      if (lower && upper) {
        return { x: lower.x + (upper.x - lower.x) * mix, v: lower.v + (upper.v - lower.v) * mix };
      }
    }

    return { x: (geometry ?? measure()).tabLefts[target] ?? 0, v: 0 };
  }

  function stopGlide() {
    glide?.cancel();
    stretch?.cancel();
    glide = null;
    stretch = null;
    samples = null;
  }

  // At rest the CSS rule owns the position; until the header's state catches
  // up with a drag's choice, hold the pill on the chosen tab inline.
  function settle(index: number) {
    pill.style.transform = cssIndex() === index ? "" : `translate3d(${measure().tabLefts[index] ?? 0}px, 0, 0)`;
  }

  function glideTo(index: number, from: SpringSample, spring: Spring) {
    const to = measure().tabLefts[index] ?? 0;

    stopGlide();
    body.style.transform = "";

    if (reducedMotion.matches || (Math.abs(from.x - to) < REST_DISTANCE && Math.abs(from.v) < REST_VELOCITY)) {
      settle(index);

      return;
    }

    pill.style.transform = "";

    const run = simulateSpring(from.x, from.v, to, spring);
    const duration = (run.length - 1) * SAMPLE_MS;

    samples = run;
    glide = pill.animate(
      run.map(sample => ({ transform: `translate3d(${sample.x}px, 0, 0)` })),
      { duration },
    );
    stretch = body.animate(
      run.map(sample => ({ transform: stretchTransform(sample.v) })),
      { duration },
    );

    const current = glide;

    current.onfinish = () => {
      if (glide === current) {
        glide = null;
        stretch = null;
        samples = null;
        settle(index);
      }
    };
  }

  function setLifted(lifted: boolean) {
    if (lifted) {
      pill.dataset.lifted = "";
    } else {
      delete pill.dataset.lifted;
    }
  }

  function setMagnify(center: number | null) {
    if (!geometry || center === null) {
      for (const tab of tabs) {
        tab.style.transform = "";
      }

      return;
    }

    for (const [index, tab] of tabs.entries()) {
      const tabCenter = (geometry.tabLefts[index] ?? 0) + geometry.tabWidth / 2;
      const proximity = Math.max(0, 1 - Math.abs(center - tabCenter) / geometry.tabWidth);

      tab.style.transform = proximity > 0 ? `scale(${1 + MAGNIFY * proximity})` : "";
    }
  }

  function localX(clientX: number) {
    const left = switcher.getBoundingClientRect().left + switcher.clientLeft;

    return (clientX - left) / (geometry?.scale ?? 1) - (tabs[0]?.offsetLeft ?? 0);
  }

  function clampWithBand(position: number) {
    const max = geometry?.tabLefts.at(-1) ?? 0;
    const dimension = geometry?.pillWidth ?? 1;

    if (position < 0) {
      return -rubberBand(-position, dimension);
    }

    if (position > max) {
      return max + rubberBand(position - max, dimension);
    }

    return position;
  }

  function step(time: number) {
    const elapsed = Math.min(32, frameTime ? time - frameTime : SAMPLE_MS);
    const stiffness = ((2 * Math.PI) / DRAG_SPRING.response) ** 2;
    const damping = (4 * Math.PI * DRAG_SPRING.dampingRatio) / DRAG_SPRING.response;

    frameTime = time;

    for (let ms = 0; ms < elapsed; ms += 1) {
      v += (-stiffness * (x - dragTarget) - damping * v) / 1000;
      x += v / 1000;
    }

    pill.style.transform = `translate3d(${x}px, 0, 0)`;
    body.style.transform = reducedMotion.matches ? "" : stretchTransform(v);

    if (!reducedMotion.matches) {
      setMagnify(x + (geometry?.pillWidth ?? 0) / 2);
    }

    frame = requestAnimationFrame(step);
  }

  function startDrag(event: PointerEvent, active: Drag) {
    const from = presented();

    geometry = measure();
    stopGlide();
    x = from.x;
    v = from.v;
    active.dragging = true;
    active.grab = Math.max(
      -geometry.pillWidth / 2,
      Math.min(
        geometry.pillWidth / 2,
        localX(event.clientX) - ((geometry.tabLefts[active.pressed] ?? 0) + geometry.pillWidth / 2),
      ),
    );
    dragTarget = clampWithBand(localX(event.clientX) - active.grab - geometry.pillWidth / 2);
    switcher.setPointerCapture(event.pointerId);
    switcher.dataset.dragging = "";
    setLifted(true);
    frameTime = 0;
    frame = requestAnimationFrame(step);
  }

  function endDrag(active: Drag, commit: boolean) {
    cancelAnimationFrame(frame);
    clearTimeout(holdTimer);
    setLifted(false);
    delete switcher.dataset.dragging;
    setMagnify(null);
    drag = null;

    // A plain tap is the link's own click. A press the browser took over for
    // scrolling still previewed its tab on pointerdown, so hand it back.
    if (!active.dragging) {
      if (!commit) {
        options.onCommit(null);
      }

      return;
    }

    const recent = active.history.filter(sample => sample.time >= performance.now() - VELOCITY_WINDOW_MS);
    const first = recent[0];
    const last = recent.at(-1);
    const pointerVelocity =
      first && last && last.time > first.time ? ((last.x - first.x) / (last.time - first.time)) * 1000 : 0;
    // Choose from where the pointer puts the pill, not where the trailing
    // pill happens to be, plus how far a flick would carry it.
    const projected = dragTarget + ((pointerVelocity / 1000) * PROJECTION_DECELERATION) / (1 - PROJECTION_DECELERATION);
    const lefts = geometry?.tabLefts ?? [0];
    let nearest = 0;

    for (const [index, left] of lefts.entries()) {
      if (Math.abs(left - projected) < Math.abs((lefts[nearest] ?? 0) - projected)) {
        nearest = index;
      }
    }

    const index = commit ? nearest : target;

    target = index;
    glideTo(index, { x, v }, RELEASE_SPRING);
    suppressClick = true;

    // The pointer's own click lands after this handler; let it pass, then
    // hand the choice to the header (navigation or a cancelled drag).
    setTimeout(() => {
      suppressClick = false;
      options.onCommit(commit ? index : null);
    }, 0);
  }

  function handlePointerDown(event: PointerEvent) {
    const pressed = tabs.findIndex(tab => tab.contains(event.target as Node));

    if (
      pressed < 0 ||
      !event.isPrimary ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    drag = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      pressed,
      startX: event.clientX,
      startY: event.clientY,
      grab: 0,
      dragging: false,
      history: [],
    };
    holdTimer = window.setTimeout(() => setLifted(true), HOLD_LIFT_MS);
  }

  function handlePointerMove(event: PointerEvent) {
    const active = drag;

    if (!active || event.pointerId !== active.pointerId) {
      return;
    }

    const dx = event.clientX - active.startX;
    const dy = event.clientY - active.startY;

    if (!active.dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) {
        return;
      }

      if (active.pointerType !== "mouse" && Math.abs(dy) > Math.abs(dx)) {
        endDrag(active, false);

        return;
      }

      startDrag(event, active);
    }

    active.history.push({ time: event.timeStamp, x: localX(event.clientX) });

    if (active.history.length > 12) {
      active.history.shift();
    }

    dragTarget = clampWithBand(localX(event.clientX) - active.grab - (geometry?.pillWidth ?? 0) / 2);
  }

  function handlePointerUp(event: PointerEvent) {
    if (drag && event.pointerId === drag.pointerId) {
      endDrag(drag, true);
    }
  }

  function handlePointerCancel(event: PointerEvent) {
    if (drag && event.pointerId === drag.pointerId) {
      endDrag(drag, false);
    }
  }

  // Touch input is implicitly captured by the pressed link; taking capture
  // for the drag fires its lostpointercapture, which is not a cancel.
  function handleLostCapture(event: PointerEvent) {
    if (event.target === switcher) {
      handlePointerCancel(event);
    }
  }

  function handleClick(event: MouseEvent) {
    if (suppressClick && event.isTrusted) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  switcher.addEventListener("pointerdown", handlePointerDown);
  switcher.addEventListener("pointermove", handlePointerMove);
  switcher.addEventListener("pointerup", handlePointerUp);
  switcher.addEventListener("pointercancel", handlePointerCancel);
  switcher.addEventListener("lostpointercapture", handleLostCapture);
  switcher.addEventListener("click", handleClick, true);

  return {
    moveTo(index) {
      // A live drag decides the tab itself; its commit syncs the header.
      if (index < 0 || drag?.dragging) {
        return;
      }

      if (index === target) {
        if (!glide) {
          settle(index);
        }

        return;
      }

      geometry = null;

      const from = presented();

      target = index;
      glideTo(index, from, TAP_SPRING);
    },

    dispose() {
      cancelAnimationFrame(frame);
      clearTimeout(holdTimer);
      stopGlide();
      setMagnify(null);
      setLifted(false);
      pill.style.transform = "";
      body.style.transform = "";
      delete pill.dataset.driven;
      delete switcher.dataset.dragging;
      switcher.removeEventListener("pointerdown", handlePointerDown);
      switcher.removeEventListener("pointermove", handlePointerMove);
      switcher.removeEventListener("pointerup", handlePointerUp);
      switcher.removeEventListener("pointercancel", handlePointerCancel);
      switcher.removeEventListener("lostpointercapture", handleLostCapture);
      switcher.removeEventListener("click", handleClick, true);
    },
  };
}
