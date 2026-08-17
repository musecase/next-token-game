import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How Token Tumble Works",
  description: "What tokens are, how language models generate answers, and what Token Tumble is simulating.",
};

export default function AboutPage() {
  return (
    <main className="game-shell skin-cli explainer-page">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Back to Token Tumble">
          <span className="brand-mark">T</span>
          <span>TOKEN TUMBLE</span>
        </Link>
        <Link className="topbar-link" href="/">← PLAY</Link>
      </header>

      <article className="explainer-shell">
        <header className="explainer-hero">
          <p className="eyebrow">How the machine talks</p>
          <h1>WHAT IS THIS?</h1>
          <p className="lede">Token Tumble puts you inside the repeating prediction loop of a language model.</p>
        </header>

        <section className="explainer-card">
          <span className="explainer-number">01</span>
          <div>
            <h2>Text becomes tokens.</h2>
            <p>A token is a small chunk of text: a word, part of a word, punctuation, or even a space attached to the next word.</p>
            <div className="token-example" aria-label="The sentence The cat purred split into example tokens">
              <span>The</span><span> cat</span><span> purred</span><span>.</span>
            </div>
          </div>
        </section>

        <section className="explainer-card">
          <span className="explainer-number">02</span>
          <div>
            <h2>The model predicts what comes next.</h2>
            <p>For every step, it assigns probabilities to possible next tokens. One token is selected, added to the context, and the model calculates a new set of probabilities. That loop builds the answer.</p>
            <p>In the game, large bright choices are more probable. Smaller dim choices are less probable—not necessarily wrong.</p>
          </div>
        </section>

        <section className="explainer-card">
          <span className="explainer-number">03</span>
          <div>
            <h2>Generation is not ordinary retrieval.</h2>
            <p>A base language model usually does not pull a finished answer from a fact drawer. It constructs one token by token from patterns learned during training. Models can also be connected to search, documents, or databases, but that is an added retrieval step.</p>
            <p>This is why fluent language can keep forming even when the model does not have a solid factual path.</p>
          </div>
        </section>

        <section className="explainer-card">
          <span className="explainer-number">04</span>
          <div>
            <h2>Token Tumble uses both kinds of work.</h2>
            <p>For a custom question, a stronger cloud model prepares a short factual guide and reference answer. Then a small model on your device produces the token choices you play. Daily Steer asks you to bend that local prediction path toward one target token.</p>
          </div>
        </section>

        <section className="notice-panel">
          <span>[ watch_for ]</span>
          <ul>
            <li>Always choosing the largest token tends to produce safe, dull language.</li>
            <li>A low-probability token can open a creative path—or break the answer.</li>
            <li>Once a direction forms, later predictions often reinforce it.</li>
            <li>When no good choice appears, plausible nonsense becomes tempting.</li>
          </ul>
        </section>

        <Link className="primary-button explainer-play" href="/">PLAY TOKEN TUMBLE →</Link>
      </article>
    </main>
  );
}
