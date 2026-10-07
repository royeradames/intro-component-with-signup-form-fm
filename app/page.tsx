import { SignupForm } from "./signup-form";
import { challengeUrl, siteName } from "./site";

export default function Home() {
  return (
    <>
      <main className="intro">
        <header className="intro-copy">
          <h1>Learn to code by watching others</h1>
          <p>See how experienced developers solve problems in real-time. Watching scripted tutorials is great, but understanding how developers think is invaluable.</p>
        </header>
        <section className="trial" aria-labelledby="offer">
          <p id="offer" className="offer"><strong>Try it free 7 days</strong> then $20/mo. thereafter</p>
          <SignupForm />
        </section>
      </main>
      <footer><span className="site-name">{siteName}</span>. Challenge by <a href={challengeUrl}>Frontend Mentor</a>. Built by <a href="https://royeradames.com">Royer Adames</a>.</footer>
    </>
  );
}
