export function getMermaidAccessibleLabel(source: string) {
  return /^\s*accTitle:\s*(.+?)\s*$/m.exec(source)?.[1]?.trim() || "Diagram illustrating this section";
}

export function getMermaidAccessibleDescription(source: string) {
  return /^\s*accDescr:\s*(.+?)\s*$/m.exec(source)?.[1]?.trim() || null;
}
