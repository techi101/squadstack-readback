# Readback

**Find the turns where a Hinglish phone voice agent would act on a misheard number, a lost "nahi" or a misheard promise to pay, and see what each confirm-back policy would catch and what it costs in talk time.**

Live demo: https://squadstack-readback.vercel.app · runs fully in the browser, no API key, nothing uploaded.

> Independent proof-of-work project by Nitesh Kumar Yadav. Not affiliated with or endorsed by SquadStack. The demo data is synthetic (see below).

## The problem

Word error rate treats every wrong word the same. On a sales or collections call, most wrong words do not matter, and a few decide the call: an EMI date heard as "tees" instead of "bees", "छब्बीस" heard as "छत्तीस", a "nahi" heard as "haan", "already paid" heard as "will pay". SquadStack's public Arth V2 post (9 Oct 2026) makes the same point: their benchmark scores semantic WER and sorts meaning-changing errors into classes such as number, negation and commitment.

A team rolling a voice agent out for a new client still has to decide, per campaign, **what the agent should confirm back**. Read back too little and the agent books the wrong date. Read back everything and every call gets longer. That is a per-campaign engineering decision, and it needs a reusable tool rather than a one-off script.

## What it does

1. **Reads the critical slots** in each caller turn, in Devanagari Hindi, romanised Hindi and English:
   - numbers, including compounds (`छह हजार नौ सौ` = 6900, `chhe hazaar nau sau`), fractions (`साढ़े तीन हजार` = 3500, `सवा`, `पौने`, `डेढ़`, `ढाई`), digits, `₹3,450`, and a role (amount / date / count);
   - the caller's yes/no answer and the count of negation words;
   - payment commitment: promise to pay, already paid, refuses to pay;
   - handoff signals: asks for a human, asks to stop calls, distress or bereavement.
2. **Diffs what was said against what the recogniser heard**, slot by slot: number changed / dropped / inserted, "no" heard as "yes" or lost, promise lost / invented / flipped, handoff signal missed.
3. **Simulates confirm-back policies** (none, numbers, critical slots, every turn). A policy may only use what the agent *heard*. A wrong value it heard gets read back and can be corrected; a value the recogniser dropped is invisible to a slot readback. Cost = readbacks × seconds per readback (your assumption, editable).
4. **Per campaign view**, a call drawer with word-level diff, and a paste box for your own transcripts.

Handoff misses are reported separately, because a readback cannot fix them: if the recogniser breaks "इंसान", the agent never knows to escalate. That needs a guard in front of the agent (see related work).

## Input formats

- Text: `# call-id | campaign` header, then one turn per line as `said ||| heard` (or tab-separated).
- JSON: `[{"id", "campaign", "turns": [{"ref", "hyp"}]}]`.
- JSON rows shaped like the `results` config of the [SquadStack Conversational Streaming ASR Benchmark](https://huggingface.co/datasets/Squadstack/conversational-streaming-asr-benchmark) (`normalised_reference` plus `<system>_normalised`, one line per turn). **Untested on real rows**: the dataset is gated and was not used; the parser follows the public dataset card.

## How it works

```
turn text --normalise (NFC, drop nukta, ँ->ं, ₹, commas)--> tokens
tokens --> numbers.js   number phrases -> value + role
       --> slots.js     yes/no answer, negation count, commitment, handoff signals
said slots vs heard slots --> diff.js   slot errors (+ align.js word alignment for display)
slot errors + heard slots --> policy.js caught / missed / readbacks / extra seconds per policy
```

All logic is plain ES modules in `src/core/`, shared by the page and the tests. No build step, no framework, no server.

## The demo data

`src/data/sample.js`: **20 short Hinglish calls written by hand** across five campaign types (BFSI EMI reminder, logistics COD confirmation, marketplace supplier lead, education counselling, travel follow-up). Errors were inserted on purpose, modelled on the error types SquadStack describes publicly. The numbers on the page describe this sample only. They say nothing about Arth, any other recogniser, or SquadStack's agents.

## Run and test

```bash
npm test          # node --test, 14 tests, no dependencies
npm run dev       # or any static server, e.g. python -m http.server
```

## Honest limits

- **Synthetic sample.** Hand-written, not real calls.
- **Rules, not a model.** Word lists and patterns miss paraphrases and rare spellings. Romanised "saath" (60) is skipped because it usually means "with"; "do / दो" counts as 2 only next to another number word; "ना" counts as a no only as the first word of a turn.
- **Turns must be aligned** between said and heard.
- **Cooperative caller.** The readback simulation assumes the caller always corrects a wrong value.
- **Benchmark import untested** on real rows (gated data, not used).

## Related work by the author

- [voice-agent-escalation-eval](https://github.com/techi101/voice-agent-escalation-eval): eval harness and rule guard for when a phone voice agent must hand off. On held-out synthetic calls, the guard raised human-handoff recall from 8/16 to 15/16 (GP clinic, partial test split) and must-escalate recall from 14/16 to 16/16 (Indian collections). Synthetic text, stand-in agents; see that README for limits.
- [Board Room](https://board-room-five.vercel.app): Hindi/English voice interview panel on Gnani STT/TTS.

## AI-use disclosure

Built with Claude Code under the author's direction and review.

MIT licence.
