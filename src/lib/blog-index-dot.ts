/*
 * The blog index's pointer dot as a bead on the rail. It marks the post under
 * the pointer: it grows in on that post's node, leans up or down the rail
 * toward the cursor (more strongly the closer the cursor is to the rail, never
 * far enough to leave its own post), and hops to the next post on a spring that carries
 * its velocity, stretching along the rail with speed. Once no post is lit it
 * fades out where it sits rather than travelling anywhere.
 *
 * One frame loop drives position, stretch and presence together, and runs only
 * while something is moving. Keyboard focus places the dot instantly (keyboard
 * actions never animate), touch never shows it, and reduced motion keeps only
 * the fade.
 */

type Spring = { response: number; dampingRatio: number };
type Axis = { x: number; v: number };

const NODE_SELECTOR = ".blog-index-node";

// The nav pill's release spring, so both read as the same material.
const TRACK_SPRING: Spring = { response: 0.36, dampingRatio: 0.8 };
const PRESENCE_SPRING: Spring = { response: 0.2, dampingRatio: 1 };

const REST_DISTANCE = 0.2;
const REST_VELOCITY = 4;
const PRESENCE_REST = 0.002;
// Below this the dot reads as gone, so a new post places it instead of sliding.
const APPEARED = 0.05;

// Lean: up to MAX_LEAN px toward the cursor, scaled to the post's own height so
// its edges pull about as hard on a short post as on a tall one, and weakening
// with horizontal distance from the rail.
const MAX_LEAN = 16;
const LEAN_FALLOFF = 480;

// The nav pill's stretch, turned to the rail's vertical axis.
const STRETCH_PER_VELOCITY = 0.00018;
const MAX_STRETCH = 0.22;
const SQUASH = 0.5;
const ENTER_SCALE = 0.6;

function advance(axis: Axis, target: number, spring: Spring, ms: number) {
  const stiffness = ((2 * Math.PI) / spring.response) ** 2;
  const damping = (4 * Math.PI * spring.dampingRatio) / spring.response;

  for (let elapsed = 0; elapsed < ms; elapsed += 1) {
    axis.v += (-stiffness * (axis.x - target) - damping * axis.v) / 1000;
    axis.x += axis.v / 1000;
  }
}

export function attachBlogIndexDot(root: HTMLElement, list: HTMLElement, dot: HTMLElement): () => void {
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const y: Axis = { x: 0, v: 0 };
  const presence: Axis = { x: 0, v: 0 };
  let lit: HTMLElement | null = null;
  let hovered: HTMLElement | null = null;
  let visible = false;
  let leaning = false;
  let goal = 0;
  // Geometry in root coordinates; the root's page offset turns the pointer into them.
  let railX = 0;
  let nodeY = 0;
  let halfPost = 1;
  let rootPageLeft = 0;
  let rootPageTop = 0;
  let pointer: { clientX: number; clientY: number } | null = null;
  let frame = 0;
  let frameTime = 0;

  function measure(node: HTMLElement) {
    const rootRect = root.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const postTop = node.closest("li")?.getBoundingClientRect().top ?? nodeRect.top;

    railX = nodeRect.left + nodeRect.width / 2 - rootRect.left;
    nodeY = nodeRect.top + nodeRect.height / 2 - rootRect.top;
    // The node sits mid-post, so its distance from the row's top is half the post.
    halfPost = Math.max(1, nodeRect.top + nodeRect.height / 2 - postTop);
    rootPageLeft = rootRect.left + window.scrollX;
    rootPageTop = rootRect.top + window.scrollY;
  }

  function leanedGoal() {
    if (!leaning || !pointer || reducedMotion.matches) {
      return nodeY;
    }

    const pointerX = pointer.clientX + window.scrollX - rootPageLeft;
    const pointerY = pointer.clientY + window.scrollY - rootPageTop;
    const pull = 1 / (1 + Math.max(0, pointerX - railX) / LEAN_FALLOFF);

    return nodeY + MAX_LEAN * pull * Math.tanh((pointerY - nodeY) / halfPost);
  }

  function render() {
    const still = reducedMotion.matches;
    const stretch = still ? 0 : Math.min(MAX_STRETCH, Math.abs(y.v) * STRETCH_PER_VELOCITY);
    const grow = still ? 1 : ENTER_SCALE + (1 - ENTER_SCALE) * Math.min(1, Math.max(0, presence.x));

    dot.style.opacity = String(Math.min(1, Math.max(0, presence.x)));
    dot.style.transform = `translate3d(${railX}px, ${y.x}px, 0) translate(-50%, -50%) scale(${grow * (1 - stretch * SQUASH)}, ${grow * (1 + stretch)})`;
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function step(time: number) {
    const elapsed = Math.min(32, frameTime ? time - frameTime : 1000 / 60);
    const presenceTarget = visible ? 1 : 0;

    frameTime = time;

    // Exiting holds the last goal, so a dot at rest fades without moving.
    if (visible) {
      goal = leanedGoal();
    }

    if (reducedMotion.matches) {
      y.x = goal;
      y.v = 0;
    } else {
      advance(y, goal, TRACK_SPRING, elapsed);
    }

    advance(presence, presenceTarget, PRESENCE_SPRING, elapsed);

    const settled =
      Math.abs(y.x - goal) < REST_DISTANCE &&
      Math.abs(y.v) < REST_VELOCITY &&
      Math.abs(presence.x - presenceTarget) < PRESENCE_REST;

    if (settled) {
      y.x = goal;
      y.v = 0;
      presence.x = presenceTarget;
      presence.v = 0;
      render();
      frame = 0;

      return;
    }

    render();
    frame = requestAnimationFrame(step);
  }

  function wake() {
    if (!frame) {
      frameTime = 0;
      frame = requestAnimationFrame(step);
    }
  }

  function show(node: HTMLElement, animate: boolean) {
    const appearing = presence.x < APPEARED;

    lit = node;
    visible = true;
    leaning = animate;
    measure(node);

    if (!animate) {
      stop();
      goal = nodeY;
      y.x = goal;
      y.v = 0;
      presence.x = 1;
      presence.v = 0;
      render();

      return;
    }

    // From nothing it grows in on its post; still fading out, it glides back.
    if (appearing) {
      goal = leanedGoal();
      y.x = goal;
      y.v = 0;
    }

    wake();
  }

  function hide(animate: boolean) {
    lit = null;
    visible = false;

    if (animate) {
      wake();

      return;
    }

    stop();
    presence.x = 0;
    presence.v = 0;
    render();
  }

  const nodeFor = (element: EventTarget | null) =>
    element instanceof Element ? element.closest("li")?.querySelector<HTMLElement>(NODE_SELECTOR) : null;

  const usesPointer = (event: PointerEvent) => event.pointerType !== "touch" && finePointer.matches;

  const onPointerOver = (event: PointerEvent) => {
    if (!usesPointer(event)) {
      return;
    }

    const node = nodeFor(event.target);

    pointer = { clientX: event.clientX, clientY: event.clientY };

    // The list's padding lights no post, so the dot leaves with the highlight.
    if (!node) {
      hovered = null;
      hide(true);

      return;
    }

    if (node !== hovered) {
      hovered = node;
      show(node, true);
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!usesPointer(event)) {
      return;
    }

    pointer = { clientX: event.clientX, clientY: event.clientY };

    if (visible && leaning) {
      wake();
    }
  };

  const onPointerLeave = () => {
    hovered = null;
    pointer = null;
    hide(true);
  };

  // Scrolling moves the posts under a still cursor, so the lean follows.
  const onScroll = () => {
    if (visible && leaning) {
      wake();
    }
  };

  const onFocusIn = (event: FocusEvent) => {
    const node = nodeFor(event.target);

    if (node && event.target instanceof Element && event.target.matches(":focus-visible")) {
      show(node, false);
    }
  };

  const onFocusOut = (event: FocusEvent) => {
    if (!list.contains(event.relatedTarget as Node | null) && !hovered) {
      hide(false);
    }
  };

  // Rows reflow with fonts, width and theme; carry the dot with its node.
  const resizeObserver = new ResizeObserver(() => {
    if (!lit) {
      return;
    }

    const before = nodeY;

    measure(lit);
    y.x += nodeY - before;
    goal += nodeY - before;
    render();
  });

  root.setAttribute("data-timeline-ready", "");
  resizeObserver.observe(list);
  list.addEventListener("pointerover", onPointerOver);
  list.addEventListener("pointermove", onPointerMove, { passive: true });
  list.addEventListener("pointerleave", onPointerLeave);
  list.addEventListener("focusin", onFocusIn);
  list.addEventListener("focusout", onFocusOut);
  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    stop();
    resizeObserver.disconnect();
    list.removeEventListener("pointerover", onPointerOver);
    list.removeEventListener("pointermove", onPointerMove);
    list.removeEventListener("pointerleave", onPointerLeave);
    list.removeEventListener("focusin", onFocusIn);
    list.removeEventListener("focusout", onFocusOut);
    window.removeEventListener("scroll", onScroll);
    root.removeAttribute("data-timeline-ready");
  };
}
