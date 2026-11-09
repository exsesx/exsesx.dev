/*
 * The blog index's pointer dot as a bead on the rail. It marks the post under
 * the pointer: it grows in on that post's node and stays centred there while
 * the cursor moves about the post. Once the cursor leaves the post into its half
 * of the gap to a neighbour, that neighbour starts to pull the dot along the
 * rail (harder the nearer the cursor gets to it), so the dot
 * leans into the hop before making it, either way. HEAD has nothing above and
 * the oldest post nothing below to pull. It hops on a
 * spring that carries its velocity and stretches along the rail with speed. The
 * lit node's ring, an element of its own over the rail's lines, is tugged a
 * little after it and, once the dot moves on, let go
 * to spring back. Once no post is lit the dot fades out where it sits rather
 * than travelling anywhere, except on HEAD, whose own dot it stands in for: there
 * it takes over at full size and, on leaving, springs home and hands back.
 *
 * One frame loop drives position, stretch and presence together, and runs only
 * while something is moving. Keyboard focus places the dot instantly (keyboard
 * actions never animate), touch never shows it, and reduced motion keeps only
 * the fade.
 */

import { isMotionReduced } from "@/lib/motion-preference";
import { isAtRest, type Spring, type SpringState, stepSpring } from "@/lib/spring";

type Ring = SpringState & { circle: HTMLElement };

const NODE_SELECTOR = ".blog-index-node";
const CIRCLE_SELECTOR = ".blog-index-circle";
const CORE_SELECTOR = ".blog-index-core";

// The nav pill's release spring with more bounce: a hop overshoots its node by
// a few pixels and settles.
const TRACK_SPRING: Spring = { response: 0.36, dampingRatio: 0.7 };
const PRESENCE_SPRING: Spring = { response: 0.2, dampingRatio: 1 };

const PRESENCE_REST = 0.002;
// Below this the dot reads as gone, so a new post places it instead of sliding.
const APPEARED = 0.05;

// Magnet: across a post's half of the gap to a neighbour, the dot leans toward
// that neighbour, growing with the square of nearness to MAX_LEAN px at the
// boundary. Only height counts, so a band pulls the same anywhere across the row.
const MAX_LEAN = 10;

// The nav pill's stretch, turned to the rail's vertical axis.
const STRETCH_PER_VELOCITY = 0.00018;
const MAX_STRETCH = 0.22;
const SQUASH = 0.5;
const ENTER_SCALE = 0.6;

// The ring follows a third of the lean while held, and is let go on a loose
// spring that wobbles about a pixel past rest before settling.
const RING_FOLLOW = 0.3;
const RING_HOLD_SPRING: Spring = { response: 0.3, dampingRatio: 0.6 };
const RING_RELEASE_SPRING: Spring = { response: 0.5, dampingRatio: 0.3 };
const RING_REST = 0.05;

export function attachBlogIndexDot(root: HTMLElement, list: HTMLElement, dot: HTMLElement): () => void {
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const y: SpringState = { x: 0, v: 0 };
  const presence: SpringState = { x: 0, v: 0 };
  // Rings still moving: the held one and any let go that have not settled yet.
  const rings = new Map<HTMLElement, Ring>();
  let lit: HTMLElement | null = null;
  let hovered: HTMLElement | null = null;
  let visible = false;
  let leaning = false;
  let goal = 0;
  // Geometry in root coordinates; the root's page offset turns the pointer into them.
  let railX = 0;
  let nodeY = 0;
  let postTop = 0;
  let contentTop = 0;
  let contentBottom = 0;
  let postBottom = 0;
  let railAbove = false;
  let railBelow = false;
  // Leaving HEAD, the dot springs back onto its node before handing over.
  let homing = false;
  // HEAD's own dot, hidden while the pointer dot stands in for it.
  let heldCore: HTMLElement | null = null;
  let rootPageTop = 0;
  let pointerClientY: number | null = null;
  let frame = 0;
  let frameTime = 0;

  function measure(node: HTMLElement) {
    const rootRect = root.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const post = node.closest("li");
    const nodeCenter = nodeRect.top + nodeRect.height / 2;
    const postRect = post?.getBoundingClientRect();

    railX = nodeRect.left + nodeRect.width / 2 - rootRect.left;
    nodeY = nodeCenter - rootRect.top;
    // Between the post's content and the row's edges lie its halves of the gaps.
    const contentRect = post?.querySelector("article")?.getBoundingClientRect();

    contentTop = (contentRect?.top ?? nodeCenter) - rootRect.top;
    contentBottom = (contentRect?.bottom ?? nodeCenter) - rootRect.top;
    postTop = (postRect?.top ?? nodeCenter) - rootRect.top;
    postBottom = (postRect?.bottom ?? nodeCenter) - rootRect.top;
    // HEAD has no rail above it and the oldest post none below.
    railAbove = Boolean(post?.previousElementSibling);
    railBelow = Boolean(post?.nextElementSibling);
    rootPageTop = rootRect.top + window.scrollY;
  }

  function leanedGoal() {
    if (!leaning || pointerClientY === null || isMotionReduced()) {
      return nodeY;
    }

    const pointerY = pointerClientY + window.scrollY - rootPageTop;
    const gapBelow = postBottom - contentBottom;
    const gapAbove = contentTop - postTop;

    if (railBelow && gapBelow > 0 && pointerY > contentBottom) {
      const nearness = Math.min(1, (pointerY - contentBottom) / gapBelow);

      return nodeY + MAX_LEAN * nearness * nearness;
    }

    if (railAbove && gapAbove > 0 && pointerY < contentTop) {
      const nearness = Math.min(1, (contentTop - pointerY) / gapAbove);

      return nodeY - MAX_LEAN * nearness * nearness;
    }

    // Over the body of the post the dot stays on its node.
    return nodeY;
  }

  function holdCore(node: HTMLElement) {
    const core = node.querySelector<HTMLElement>(CORE_SELECTOR);

    if (!core || core === heldCore) {
      return;
    }

    releaseCore();
    // Visibility switches at once, so the two dots trade places in one frame.
    core.style.visibility = "hidden";
    heldCore = core;
  }

  function releaseCore() {
    if (heldCore) {
      heldCore.style.visibility = "";
      heldCore = null;
    }
  }

  function render() {
    const still = isMotionReduced();
    const stretch = still ? 0 : Math.min(MAX_STRETCH, Math.abs(y.v) * STRETCH_PER_VELOCITY);
    const grow = still ? 1 : ENTER_SCALE + (1 - ENTER_SCALE) * Math.min(1, Math.max(0, presence.x));

    dot.style.opacity = String(Math.min(1, Math.max(0, presence.x)));
    dot.style.transform = `translate3d(${railX}px, ${y.x}px, 0) translate(-50%, -50%) scale(${grow * (1 - stretch * SQUASH)}, ${grow * (1 + stretch)})`;
  }

  // Steps every moving ring and reports whether they have all settled.
  function stepRings(ms: number) {
    let settled = true;

    for (const [node, ring] of rings) {
      const held = visible && node === lit;
      const target = held ? RING_FOLLOW * (goal - nodeY) : 0;

      stepSpring(ring, target, held ? RING_HOLD_SPRING : RING_RELEASE_SPRING, ms);

      if (isAtRest(ring, target, RING_REST)) {
        ring.x = target;
        ring.v = 0;

        if (!held) {
          rings.delete(node);
          ring.circle.style.transform = "";

          continue;
        }
      } else {
        settled = false;
      }

      ring.circle.style.transform = `translate3d(0, ${ring.x}px, 0)`;
    }

    return settled;
  }

  function resetRings() {
    for (const ring of rings.values()) {
      ring.circle.style.transform = "";
    }

    rings.clear();
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function step(time: number) {
    const elapsed = Math.min(32, frameTime ? time - frameTime : 1000 / 60);
    const presenceTarget = visible || homing ? 1 : 0;

    frameTime = time;

    // Exiting holds the last goal, so a dot at rest fades without moving.
    if (visible) {
      goal = leanedGoal();
    }

    if (isMotionReduced()) {
      y.x = goal;
      y.v = 0;
    } else {
      stepSpring(y, goal, TRACK_SPRING, elapsed);
    }

    stepSpring(presence, presenceTarget, PRESENCE_SPRING, elapsed);

    const ringsSettled = stepRings(elapsed);
    const settled = ringsSettled && isAtRest(y, goal) && Math.abs(presence.x - presenceTarget) < PRESENCE_REST;

    if (settled) {
      y.x = goal;
      y.v = 0;
      presence.x = presenceTarget;
      presence.v = 0;

      // Home on HEAD's node: its own dot takes back over in the same frame.
      if (homing) {
        homing = false;
        presence.x = 0;
        releaseCore();
      }

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
    homing = false;
    leaning = animate;
    measure(node);

    const head = !railAbove;

    if (head) {
      holdCore(node);
    }

    if (!animate) {
      stop();
      resetRings();
      goal = nodeY;
      y.x = goal;
      y.v = 0;
      presence.x = 1;
      presence.v = 0;
      render();

      return;
    }

    // From nothing it grows in on its post; still fading out, it glides back. On
    // HEAD it replaces the dot already there, so it starts on the node at full size.
    if (appearing) {
      goal = leanedGoal();
      y.x = head ? nodeY : goal;
      y.v = 0;

      if (head) {
        presence.x = 1;
        presence.v = 0;
        render();
      }
    }

    const circle = node.querySelector<HTMLElement>(CIRCLE_SELECTOR);

    if (circle && !isMotionReduced() && !rings.has(node)) {
      rings.set(node, { x: 0, v: 0, circle });
    }

    wake();
  }

  function hide(animate: boolean) {
    const leavingHead = lit !== null && !railAbove;

    lit = null;
    visible = false;

    if (animate) {
      if (leavingHead) {
        homing = true;
        goal = nodeY;
      } else if (!homing) {
        releaseCore();
      }

      wake();

      return;
    }

    stop();
    resetRings();
    homing = false;
    releaseCore();
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

    pointerClientY = event.clientY;

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

    pointerClientY = event.clientY;

    if (visible && leaning) {
      wake();
    }
  };

  const onPointerLeave = () => {
    hovered = null;
    pointerClientY = null;
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
    resetRings();
    releaseCore();
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
