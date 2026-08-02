import React, { useState } from 'react'
import AffiliateDisclosure from '../components/AffiliateDisclosure'
import '../styles/TermsPage.css'

const LAST_UPDATED = 'July 30, 2026'

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('overview')

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'definitions', label: 'Definitions' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'credits', label: 'Social Credits' },
    { id: 'nudge-cash', label: 'Nudge Cash & Affiliate' },
    { id: 'disclosure', label: 'Affiliate Disclosure' },
    { id: 'search', label: 'Search & Results' },
    { id: 'acceptable-use', label: 'Acceptable Use' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'disclaimers', label: 'Disclaimers' },
    { id: 'liability', label: 'Limitation of Liability' },
    { id: 'governing-law', label: 'Governing Law' },
    { id: 'changes', label: 'Changes to These Terms' },
    { id: 'contact', label: 'Contact' },
  ]

  return (
    <div className="terms-page">
      <div className="terms-header">
        <h1>Terms &amp; Conditions</h1>
        <p className="terms-updated">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="terms-layout">
        {/* Sidebar nav */}
        <aside className="terms-nav">
          {sections.map(s => (
            <button
              key={s.id}
              className={`terms-nav-btn ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => {
                setActiveSection(s.id)
                document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              {s.label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <div className="terms-content">
          <section id="overview" className="terms-section">
            <h2>1. Overview</h2>
            <p>
              Welcome to Nudge ("we", "us", "our"), a gamified search interface operated from New Zealand.
              Nudge presents search results from third-party search providers through a slot-machine reel
              interface. By using Nudge, you agree to these Terms &amp; Conditions ("Terms"). If you do not
              agree, please do not use the service.
            </p>
            <p>
              Nudge is a search discovery platform. It is not a search engine itself — it retrieves and
              displays results from providers such as SerpAPI (Google), DuckDuckGo, and Searx. Nudge does
              not own, control, or endorse the content of search results.
            </p>
          </section>

          <section id="definitions" className="terms-section">
            <h2>2. Definitions</h2>
            <ul>
              <li><strong>"Nudge"</strong> — the platform, website, and service operated by us.</li>
              <li><strong>"Social Credits"</strong> — cosmetic, non-transferable, non-monetizable points earned through spin interactions. They have no real-world monetary value.</li>
              <li><strong>"Nudge Cash"</strong> — a real-money cashback reward system funded by affiliate commissions from qualifying purchases made through affiliate links on the Shopping reel.</li>
              <li><strong>"Reels"</strong> — the five category columns (All, Images, Videos, News, Shopping) that display search results in a slot-machine format.</li>
              <li><strong>"SuperNudge"</strong> — an optional search refinement tool that augments your query with operators (site:, quotes, year filters).</li>
              <li><strong>"Affiliate Links"</strong> — links to merchant websites that may generate a commission for Nudge when a qualifying purchase is made.</li>
            </ul>
          </section>

          <section id="accounts" className="terms-section">
            <h2>3. Accounts</h2>
            <p>
              You may use Nudge's search functionality without creating an account. An account is required to:
            </p>
            <ul>
              <li>Earn and track Social Credits</li>
              <li>Earn and withdraw Nudge Cash</li>
              <li>Appear on the leaderboard</li>
              <li>Track search streaks</li>
            </ul>
            <p>
              You are responsible for maintaining the security of your account credentials. You must be at
              least 13 years old to create an account. Accounts found to be engaged in abuse, automation, or
              fraud may be terminated without notice.
            </p>
          </section>

          <section id="credits" className="terms-section">
            <h2>4. Social Credits</h2>
            <p>
              Social Credits are a purely cosmetic reward system. Each search ("spin") earns 1 base credit.
              A "winning" combination of high-relevance results earns a +2 bonus. Streak bonuses of +1
              (7-day streak) and +2 (30-day streak) may also apply.
            </p>
            <p>
              <strong>Social Credits have no monetary value, cannot be purchased, cannot be sold, cannot be
              transferred between accounts, and cannot be exchanged for cash, goods, or services.</strong>
              They exist solely as a gamification and engagement mechanic.
            </p>
            <p>
              Nudge commits to never introducing dark patterns, pay-to-win mechanics, or monetization paths
              for Social Credits.
            </p>
          </section>

          <section id="nudge-cash" className="terms-section">
            <h2>5. Nudge Cash &amp; Affiliate Program</h2>
            <p>
              Nudge Cash is a real-money cashback system funded by affiliate commissions. When you click a
              Shopping reel result that is an affiliate link and make a qualifying purchase, the merchant
              pays Nudge a commission. A portion of that commission is returned to you as Nudge Cash.
            </p>
            <h3>Cashback Rates</h3>
            <p>
              Cashback rates vary by merchant and are determined by the merchant's affiliate program terms.
              Rates are displayed on the Nudge Cash page and on individual Shopping reel results. Nudge does
              not guarantee any specific cashback rate — rates are subject to change by the merchant.
            </p>
            <h3>Earning Nudge Cash</h3>
            <ul>
              <li>Nudge Cash is credited after the merchant confirms the qualifying purchase (typically 30–90 days).</li>
              <li>Pending Nudge Cash may be reversed if the purchase is returned, cancelled, or otherwise not completed.</li>
              <li>Nudge Cash is only earned on purchases made through Nudge's affiliate links. If you navigate directly to the merchant without using the Nudge link, no cashback will be earned.</li>
            </ul>
            <h3>Withdrawals</h3>
            <ul>
              <li>Minimum withdrawal amount is $10.00 USD (or equivalent).</li>
              <li>Withdrawals are processed via PayPal, bank transfer, or gift card, subject to availability.</li>
              <li>Withdrawal processing time is 5–7 business days after the pending balance becomes available.</li>
              <li>Nudge reserves the right to verify identity before processing withdrawals.</li>
            </ul>
            <h3>Affiliate Partners</h3>
            <p>
              Nudge currently participates in the following affiliate programs:
            </p>
            <ul>
              <li><strong>Skimlinks</strong> — multi-merchant affiliate network (48,500+ merchants, Publisher Code 306889X1795159)</li>
              <li><strong>Amazon Associates</strong> — Amazon marketplace-specific program (pending registration)</li>
            </ul>
            <p>
              Additional affiliate programs may be added over time. All affiliate relationships will be
              disclosed on this page.
            </p>
          </section>

          <section id="disclosure" className="terms-section">
            <h2>6. Affiliate Disclosure (FTC &amp; NZ Consumer Law)</h2>
            <AffiliateDisclosure variant="banner" />
            <p>
              In accordance with the United States Federal Trade Commission (FTC) guidelines on the use of
              endorsements and testimonials in advertising (16 CFR Part 255), and the New Zealand Fair
              Trading Act 1986, Nudge discloses the following:
            </p>
            <ul>
              <li>Nudge earns affiliate commissions when users purchase through links on the Shopping reel.</li>
              <li>Nudge Cash cashback is funded by a portion of these commissions.</li>
              <li>Affiliate relationships do not influence search results, rankings, or the order of results.</li>
              <li>Nudge does not curate, algorithmically promote, or reorder search results in any way.</li>
              <li>Affiliate link wrapping is applied only to Shopping reel results, and only after results are retrieved from the search provider.</li>
              <li>Nudge is not compensated for clicks on non-Shopping results (All, Images, Videos, News).</li>
            </ul>
            <p>
              For the avoidance of doubt: clicking a Shopping reel affiliate link does not increase the price
              you pay. The commission is paid by the merchant, not by you.
            </p>
          </section>

          <section id="search" className="terms-section">
            <h2>7. Search &amp; Results</h2>
            <p>
              Nudge retrieves search results from third-party providers. Nudge does not:
            </p>
            <ul>
              <li>Curate, filter, or promote specific results</li>
              <li>Use algorithms to rank or reorder results beyond what the search provider returns</li>
              <li>Insert sponsored or paid content into search results</li>
              <li>Modify the content of search results</li>
            </ul>
            <p>
              Search results reflect what the underlying search provider returns. Nudge is not responsible for
              the accuracy, legality, or quality of third-party content linked in search results.
            </p>
          </section>

          <section id="acceptable-use" className="terms-section">
            <h2>8. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use automated scripts, bots, or scrapers to abuse the search or credit systems</li>
              <li>Attempt to artificially inflate Social Credits, Nudge Cash, or streak counts</li>
              <li>Make fraudulent or non-genuine purchases through affiliate links</li>
              <li>Submit false withdrawal requests</li>
              <li>Use Nudge for any illegal purpose</li>
              <li>Attempt to reverse-engineer, decompile, or otherwise extract Nudge's source code</li>
              <li>Spam, harass, or harm other users</li>
            </ul>
            <p>
              Violations may result in account termination, forfeiture of Nudge Cash balances, and being
              banned from the platform.
            </p>
          </section>

          <section id="privacy" className="terms-section">
            <h2>9. Privacy</h2>
            <p>
              Nudge collects the minimum data necessary to operate the service:
            </p>
            <ul>
              <li><strong>Account data:</strong> username, email (for withdrawals), password (hashed via bcrypt)</li>
              <li><strong>Search data:</strong> your search queries and result counts (for trending and streak tracking)</li>
              <li><strong>Activity data:</strong> spin history, affiliate clicks, cashback transactions</li>
            </ul>
            <p>
              Nudge does not sell your data to third parties. Search queries are logged to generate trending
              topics and streak data, but are not shared with advertisers. A full Privacy Policy will be
              published separately.
            </p>
          </section>

          <section id="disclaimers" className="terms-section">
            <h2>10. Disclaimers</h2>
            <p>
              Nudge is provided "as is" and "as available" without warranties of any kind. We do not guarantee:
            </p>
            <ul>
              <li>That search results will be accurate, complete, or up to date</li>
              <li>That the service will be uninterrupted or error-free</li>
              <li>That affiliate commissions or Nudge Cash will be paid for any specific transaction</li>
              <li>That merchant cashback rates will remain unchanged</li>
            </ul>
            <p>
              Search results are provided by third-party search engines. Nudge is not responsible for the
              content of external websites linked in results.
            </p>
          </section>

          <section id="liability" className="terms-section">
            <h2>11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Nudge shall not be liable for:
            </p>
            <ul>
              <li>Any indirect, incidental, or consequential damages arising from use of the service</li>
              <li>Loss of Nudge Cash due to merchant non-payment of affiliate commissions</li>
              <li>Content accessed through search results</li>
              <li>Any purchase made through an affiliate link (the transaction is between you and the merchant)</li>
            </ul>
            <p>
              Nudge's total liability for any claim shall not exceed the total Nudge Cash earned by the user
              in the 12 months preceding the claim.
            </p>
          </section>

          <section id="governing-law" className="terms-section">
            <h2>12. Governing Law</h2>
            <p>
              These Terms are governed by the laws of New Zealand. Any disputes shall be resolved in the
              courts of New Zealand, unless otherwise required by applicable consumer protection law.
            </p>
          </section>

          <section id="changes" className="terms-section">
            <h2>13. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Material changes will be notified via the Nudge
              interface. Continued use of Nudge after changes constitutes acceptance of the updated Terms.
              The "Last updated" date at the top of this page reflects the most recent revision.
            </p>
          </section>

          <section id="contact" className="terms-section">
            <h2>14. Contact</h2>
            <p>
              For questions about these Terms, the affiliate program, Nudge Cash, or any other matter,
              please contact us through the Nudge platform.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
