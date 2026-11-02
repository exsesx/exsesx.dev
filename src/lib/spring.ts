/*
 * The damped spring behind the site's physical motion (the nav pill, the blog
 * index's dot and rings). It is described the way Apple's tools describe one:
 * response is roughly the period in seconds, and a dampingRatio of 1 settles
 * without overshoot while lower values bounce. It advances in 1 ms
 * semi-implicit Euler steps, which stay stable for every spring here.
 */

export type Spring = { response: number; dampingRatio: number };
export type SpringState = { x: number; v: number };

// Near enough to the target, and slow enough, to snap there and stop.
export const REST_DISTANCE = 0.2;
export const REST_VELOCITY = 4;

export function stepSpring(state: SpringState, target: number, spring: Spring, ms: number) {
  const stiffness = ((2 * Math.PI) / spring.response) ** 2;
  const damping = (4 * Math.PI * spring.dampingRatio) / spring.response;

  for (let elapsed = 0; elapsed < ms; elapsed += 1) {
    state.v += (-stiffness * (state.x - target) - damping * state.v) / 1000;
    state.x += state.v / 1000;
  }
}

export function isAtRest(state: SpringState, target: number, distance = REST_DISTANCE) {
  return Math.abs(state.x - target) < distance && Math.abs(state.v) < REST_VELOCITY;
}
