import React from 'react'
import '../styles/AffiliateDisclosure.css'

export default function AffiliateDisclosure({ variant = 'banner' }) {
  if (variant === 'badge') {
    return (
      <div className="affiliate-disclosure affiliate-disclosure--badge">
        <span className="disclosure-icon">ℹ️</span>
        <span className="disclosure-text">
          Affiliate links. Nudge may earn a commission when you purchase through links on this site.
        </span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <p className="affiliate-disclosure affiliate-disclosure--compact">
        <strong>Affiliate Disclosure:</strong> Some links on Nudge are affiliate links. We may earn a commission at no extra cost to you when you shop through them. This does not influence which results appear — Nudge never curates or reorders search results.
      </p>
    )
  }

  // Default: full banner
  return (
    <div className="affiliate-disclosure affiliate-disclosure--banner">
      <div className="disclosure-header">
        <span className="disclosure-icon">ℹ️</span>
        <strong>Affiliate Disclosure</strong>
      </div>
      <p>
        Nudge participates in affiliate programs including Amazon Associates and Skimlinks. When you click
        certain shopping links and make a purchase, Nudge may earn a commission at no additional cost to you.
        This is how Nudge Cash cashback is funded.
      </p>
      <p>
        Affiliate relationships do <strong>not</strong> influence search results, rankings, or which results
        appear in the reels. Nudge does not curate, reorder, or algorithmically promote results — all search
        results are returned organically from the search provider. Affiliate links are only applied
        <em>after</em> results are retrieved, and only on the Shopping reel where the merchant is part of an
        affiliate program.
      </p>
      <p className="disclosure-legal">
        As required by the FTC (Federal Trade Commission) and equivalent consumer protection authorities:
        this disclosure is provided to ensure transparency about our affiliate relationships. For full
        details, see our{' '}
        <a href="/terms" className="disclosure-link">Terms &amp; Conditions</a>.
      </p>
    </div>
  )
}
