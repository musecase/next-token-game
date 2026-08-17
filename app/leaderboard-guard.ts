const ARCADE_NAME = /^[A-Z0-9 ]{1,10}$/;
const BLOCKED = [
  "ASSHOLE",
  "BASTARD",
  "BITCH",
  "COCK",
  "CUNT",
  "DICK",
  "FAGGOT",
  "FUCK",
  "HITLER",
  "NIGGER",
  "PORN",
  "PUSSY",
  "RETARD",
  "SHIT",
  "SLUT",
];

function foldLeetspeak(value: string) {
  return value
    .replaceAll("0", "O")
    .replaceAll("1", "I")
    .replaceAll("3", "E")
    .replaceAll("4", "A")
    .replaceAll("5", "S")
    .replaceAll("7", "T")
    .replaceAll("8", "B")
    .replaceAll(" ", "");
}

export function cleanArcadeName(value: unknown) {
  if (typeof value !== "string") return null;
  const clean = value.trim().replace(/\s+/g, " ").toUpperCase();
  if (!ARCADE_NAME.test(clean)) return null;

  const folded = foldLeetspeak(clean);
  if (BLOCKED.some((word) => folded.includes(word))) return null;
  return clean;
}

export function validPlayerId(value: unknown) {
  return typeof value === "string" && /^[a-zA-Z0-9-]{16,64}$/.test(value);
}
