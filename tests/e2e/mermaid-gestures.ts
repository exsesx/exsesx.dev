import { expect, type Locator } from "@playwright/test";

export async function pinchMermaidWithPointers(viewport: Locator) {
  await viewport.scrollIntoViewIfNeeded();
  const bounds = await viewport.boundingBox();
  expect(bounds).not.toBeNull();

  const centerX = (bounds?.x ?? 0) + (bounds?.width ?? 0) / 2;
  const centerY = (bounds?.y ?? 0) + (bounds?.height ?? 0) / 2;
  const pointer = (pointerId: number, clientX: number, isPrimary: boolean, buttons: number) => ({
    bubbles: true,
    button: 0,
    buttons,
    cancelable: true,
    clientX,
    clientY: centerY,
    composed: true,
    isPrimary,
    pointerId,
    pointerType: "touch",
  });
  const firstStart = pointer(41, centerX - 24, true, 1);
  const secondStart = pointer(42, centerX + 24, false, 1);

  await viewport.dispatchEvent("pointerdown", firstStart);
  await viewport.dispatchEvent("pointerdown", secondStart);

  for (let step = 1; step <= 4; step += 1) {
    const halfDistance = 24 + step * 6;
    await viewport.dispatchEvent("pointermove", pointer(41, centerX - halfDistance, true, 1));
    await viewport.dispatchEvent("pointermove", pointer(42, centerX + halfDistance, false, 1));
  }

  await viewport.dispatchEvent("pointerup", pointer(41, centerX - 48, true, 0));
  await viewport.dispatchEvent("pointerup", pointer(42, centerX + 48, false, 0));
}

export async function dragMermaidWithTouchPointer(viewport: Locator) {
  const bounds = await viewport.boundingBox();
  expect(bounds).not.toBeNull();

  const startX = (bounds?.x ?? 0) + (bounds?.width ?? 0) / 2;
  const startY = (bounds?.y ?? 0) + (bounds?.height ?? 0) / 2;
  const pointer = (clientX: number, clientY: number, buttons: number) => ({
    bubbles: true,
    button: 0,
    buttons,
    cancelable: true,
    clientX,
    clientY,
    composed: true,
    isPrimary: true,
    pointerId: 43,
    pointerType: "touch",
  });

  await viewport.dispatchEvent("pointerdown", pointer(startX, startY, 1));
  await viewport.dispatchEvent("pointermove", pointer(startX + 48, startY + 32, 1));
  await viewport.dispatchEvent("pointerup", pointer(startX + 48, startY + 32, 0));
}
