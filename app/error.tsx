"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container page-section">
      <div className="empty-state">
        <div>
          <div className="eyebrow">Marketplace error</div>
          <h2>Something went wrong.</h2>
          <p>The marketplace couldn&apos;t load this capability.</p>
          <button className="button button-primary" type="button" onClick={reset}>Try again</button>
        </div>
      </div>
    </div>
  );
}
