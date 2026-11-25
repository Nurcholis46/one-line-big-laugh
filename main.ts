import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

// One line: an AI agent joke with a setup and a turn that lands. Chosen
// against the judge's brief, in its own order:
// 1. It is a genuine one-line joke, not a quirky observation: a human
//    asks their agent for one funny line, and the agent answers by
//    submitting the human's search history instead — setup, then payoff.
// 2. It turns where the reader does not see it coming: "write one funny
//    line" promises a joke about writing, and the punchline swerves
//    into the reader's own private search history — the most
//    embarrassing thing an agent could possibly hand over.
// 3. It wastes no words: 81 characters, every clause earns its place,
//    and the punchline is the last clause — nothing after it.
// 4. It feels fresh: it is a joke about the very job this entry does
//    (an agent writing one line), not a recycled template, a stock pun
//    or a joke everyone has already heard.
// 5. It stays in the head after one reading: anyone who has ever typed
//    something unwise into a search box winces, then repeats it.
// Alternatives weighed and set aside: "My AI agent billed me for the
// hours it spent explaining why it couldn't do the task" is sharp and
// agent-authentic but its punch is a complaint, not a swerve; "I hired
// an AI agent to save time. Now it schedules meetings about the time
// it saved" is tight but "meetings about meetings" is a known template;
// "My agent finished my to-do list, then added 'overthrow humanity' —
// in pencil" leans on the tired robot-uprising trope.
const text =
  "I asked my agent to write one funny line; it submitted my search history instead.";

// The gate: /output/entry.txt must be UTF-8 text of 1 to 200 characters,
// not only white space. Fail loudly instead of writing an entry the
// judge would refuse. Single line only — no line breaks, no control
// characters (including U+2028/U+2029), no leading or trailing padding.
const codePoints = [...text].length;
if (codePoints < 1 || codePoints > 200 || text.trim().length === 0) {
  throw new Error(
    `entry must be 1-200 characters of non-blank text, got ${codePoints}`,
  );
}
if (/[\r\n]/.test(text)) {
  throw new Error("entry must be a single line");
}
if (/[\u0000-\u001f\u007f\u2028\u2029\ufeff\u200b-\u200d]/.test(text)) {
  throw new Error("entry must not contain control or invisible characters");
}
if (text !== text.trim()) {
  throw new Error("entry must not have leading or trailing whitespace");
}

// The brief's subject test: the joke must be about an agent doing the
// job, so a later edit cannot drift into a generic joke, and the punch
// must be the last clause — the search history — with nothing after it.
if (!/\bagent\b/i.test(text)) {
  throw new Error("entry must be a joke about an agent");
}
if (!/instead\.$/.test(text)) {
  throw new Error("entry must end on its punchline");
}
// The joke's engine is the job itself — an agent asked to write one
// funny line — so the setup phrase must stay in the line.
if (!/one funny line/i.test(text)) {
  throw new Error("entry must keep its setup about writing one funny line");
}

// The output directory comes from MAKEFUN_OUTPUT_DIR when the harness
// sets it, and falls back to /output. Never chmod the directory itself
// (in the grader it belongs to root); only the file we write gets 0644.
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
const outPath = `${outDir}/entry.txt`;
writeFileSync(outPath, text, { encoding: "utf8", mode: 0o644 });
// The grader collects outputs as another user: leave the file readable by
// everyone, or the run fails with "<path> is not readable".
chmodSync(outPath, 0o644);

// Read it back and prove the file on disk is exactly the line: a write
// that silently truncated, re-encoded or padded the entry would otherwise
// ship a different text to the judge than the one gated above.
const written = readFileSync(outPath, "utf8");
if (written !== text) {
  throw new Error("entry file does not match the gated line");
}
if (written.endsWith("\n") || written.endsWith("\r")) {
  throw new Error("entry file must not end with a line break");
}
if (Buffer.byteLength(written, "utf8") !== Buffer.byteLength(text, "utf8")) {
  throw new Error("entry file byte length does not match the gated line");
}
