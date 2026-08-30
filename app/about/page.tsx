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
      </header>

      <article className="explainer-shell">
        <section className="explainer-card">
          <div>
            <h2>Tokens are pieces of text.</h2>
            <p>A token can be a word, part of a word, punctuation, or a space. Models read and write tokens rather than complete answers.</p>
            <div className="token-example" aria-label="The sentence The cat purred split into example tokens">
              <span>The</span><span> cat</span><span> purred</span><span>.</span>
            </div>
          </div>
        </section>

        <section className="explainer-card">
          <div>
            <h2>The model predicts, then repeats.</h2>
            <p>At each step, it scores possible next tokens. Pick one and it recalculates from there. In the game, likely choices appear larger and brighter.</p>
          </div>
        </section>

        <section className="explainer-card">
          <div>
            <h2>Generation is not retrieval.</h2>
            <p>The model usually builds a response from learned patterns rather than retrieving a finished answer. A fluent path can lead to a fact—or plausible nonsense.</p>
          </div>
        </section>

        <p className="explainer-note">High probability means likely, not necessarily true. Low probability can be creative—or wrong.</p>

        <Link className="home-choice home-choice-primary explainer-play" href="/">
          <span>Play Token Tumble</span><b aria-hidden="true">→</b>
        </Link>
      </article>
    </main>
  );
}
