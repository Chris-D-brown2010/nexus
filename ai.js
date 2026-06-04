// ============================================================
// AI BOS - Simulated AI Engine (Master AI + Co-workers)
// No external API keys required. Rule + template based with
// light randomization to feel dynamic.
// ============================================================

const MODULES = {
  content: 'Content & Publishing AI',
  comms: 'Communication AI',
  market: 'Market & Stock Analysis AI',
  escrow: 'Escrow & Transaction AI',
  feedback: 'Customer Feedback AI',
  website: 'Website Management AI',
  bi: 'Business Intelligence AI',
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ---- Intent router for the Master AI ----
function routeIntent(text) {
  const t = text.toLowerCase();
  const map = [
    { k: ['post', 'tweet', 'caption', 'blog', 'article', 'instagram', 'linkedin', 'publish', 'content'], m: 'content' },
    { k: ['email', 'message', 'reply', 'customer support', 'whatsapp', 'telegram', 'draft a'], m: 'comms' },
    { k: ['stock', 'market', 'invest', 'watchlist', 'price', 'crypto', 'nvda', 'aapl', 'btc'], m: 'market' },
    { k: ['escrow', 'transaction', 'payment', 'payout', 'invoice', 'refund', 'flag'], m: 'escrow' },
    { k: ['feedback', 'review', 'sentiment', 'satisfaction', 'rating'], m: 'feedback' },
    { k: ['website', 'seo', 'traffic', 'conversion', 'page speed', 'analytics'], m: 'website' },
    { k: ['report', 'forecast', 'strategy', 'insight', 'growth', 'revenue', 'kpi', 'executive'], m: 'bi' },
  ];
  for (const row of map) if (row.k.some((kw) => t.includes(kw))) return row.m;
  return null;
}

// ---- Master AI conversational reply ----
function masterReply(text, context = {}) {
  const t = text.toLowerCase().trim();
  const module = routeIntent(text);

  // Greetings / status
  if (/^(hi|hello|hey|good (morning|afternoon|evening)|yo)\b/.test(t)) {
    return {
      text: `Good to see you${context.name ? ', ' + context.name.split(' ')[0] : ''}. I'm your Master AI. Here's a quick pulse: you have ${context.pendingApprovals ?? 0} items awaiting approval and ${context.alerts ?? 0} alerts. Want a full briefing, or shall I delegate something to one of your AI co-workers?`,
      module: null,
      suggestions: ['Give me my morning briefing', 'Draft a LinkedIn post', 'Any flagged transactions?'],
    };
  }

  if (t.includes('brief') || t.includes('summary') || t.includes('status') || t.includes('update me')) {
    return {
      text: `📋 **Executive Briefing**\n\n• **Finance:** 1 escrow transaction flagged ($12,500) — needs your review.\n• **Market:** NVDA +3.41% nearing your alert. Portfolio sentiment: bullish on tech.\n• **Content:** 1 LinkedIn post pending approval, 1 scheduled for Thursday.\n• **Comms:** 2 outbound messages awaiting approval, 3 enterprise leads in progress.\n• **Website:** Mobile conversion down 8% this week — I have a recommended fix.\n• **Feedback:** CSAT at 4.1/5; 2 negative reviews flagged for follow-up.\n\nWhat would you like me to action first?`,
      module: 'bi',
      suggestions: ['Show flagged transaction', 'Fix the conversion issue', 'Approve the LinkedIn post'],
    };
  }

  if (!module) {
    return {
      text: `I can coordinate across all your business functions. I understood your request as a general query. I can delegate to any of my co-workers:\n\n📝 Content & Publishing · 💬 Communication · 📈 Market & Stock · 🔐 Escrow · ⭐ Feedback · 🌐 Website · 🧠 Business Intelligence\n\nTry: "draft a tweet about our launch", "summarize today's market", or "show me flagged payments".`,
      module: null,
      suggestions: ['Morning briefing', 'Draft an email to a lead', "Today's market summary"],
    };
  }

  // Delegate to a co-worker module
  const out = runModule(module, text);
  return {
    text: `Delegating to **${MODULES[module]}**…\n\n${out.summary}`,
    module,
    payload: out.payload,
    suggestions: out.suggestions,
  };
}

// ---- Co-worker module "work products" ----
function runModule(module, prompt = '') {
  switch (module) {
    case 'content': {
      const topic = prompt.replace(/.*about/i, '').trim() || 'our latest milestone';
      const variants = [
        `🚀 Big news! ${cap(topic)} is here and we couldn't be more excited. Here's why it matters for you 👇 #growth #innovation`,
        `We've been heads-down building, and today it pays off: ${topic}. Swipe to see what's new ✨`,
        `Milestone unlocked 🔓 ${cap(topic)}. Grateful to our community for making it possible. What should we build next?`,
      ];
      return {
        summary: `I've drafted 3 on-brand variations for "${topic}". Pick one and I'll queue it for your approval before publishing.`,
        payload: { type: 'content', variants, hashtags: ['#startup', '#AI', '#business', '#growth'] },
        suggestions: ['Schedule variant 1 for LinkedIn', 'Make it shorter', 'Generate a blog version'],
      };
    }
    case 'comms': {
      return {
        summary: `Drafted a professional response. Tone: warm + concise. It will require your approval before sending.`,
        payload: {
          type: 'email',
          subject: 'Re: Your inquiry',
          body: `Hi there,\n\nThank you for reaching out — really appreciate your interest. ${pick([
            'Based on your needs, our recommended plan includes all AI co-worker modules with priority support.',
            'I\'d be glad to set up a quick 15-minute call to walk you through the details.',
            'Here are the next steps to get you started today.',
          ])}\n\nLet me know what works best and I'll take care of the rest.\n\nWarm regards,\nYour Team`,
        },
        suggestions: ['Send for approval', 'Make it more formal', 'Add pricing details'],
      };
    }
    case 'market': {
      const movers = [
        { s: 'NVDA', c: +3.41 }, { s: 'AAPL', c: +1.24 }, { s: 'MSFT', c: -0.85 }, { s: 'TSLA', c: -2.10 },
      ];
      return {
        summary: `Market snapshot: Tech leading gains. NVDA +3.41% is your standout mover and is approaching your $1,250 alert. Sentiment: cautiously bullish. Suggested action: consider trimming TSLA exposure (-2.1%).`,
        payload: { type: 'market', movers, headline: 'Fed signals rate stability; chipmakers rally on AI demand.' },
        suggestions: ['Add a stock to watchlist', 'Set an alert for NVDA', 'Summarize financial news'],
      };
    }
    case 'escrow': {
      return {
        summary: `🔐 Found 1 flagged escrow: **ESC-2291 ($12,500)** with TechBuyer LLC. Reason: buyer requested release 4 days early + new device login. Recommended: hold funds and request verification. No funds will move without your approval.`,
        payload: { type: 'escrow', ref: 'ESC-2291', amount: 12500, risk: 'High', reasons: ['Early release request', 'New device login', 'Amount above 30-day avg'] },
        suggestions: ['Hold and request verification', 'Release funds', 'View all transactions'],
      };
    }
    case 'feedback': {
      return {
        summary: `⭐ Analyzed 142 reviews. CSAT **4.1/5**. Sentiment: 68% positive · 19% neutral · 13% negative. Top praise: support quality & time savings. Top complaint: Android stability on older devices + billing delays. Recommendation: prioritize a stability patch and add self-serve billing.`,
        payload: { type: 'feedback', csat: 4.1, positive: 68, neutral: 19, negative: 13, themes: ['Support quality', 'Time savings', 'Android stability', 'Billing speed'] },
        suggestions: ['Create a task to fix Android crashes', 'Reply to negative reviews', 'Show satisfaction trend'],
      };
    }
    case 'website': {
      return {
        summary: `🌐 Website health: **82/100**. Mobile conversion dropped 8% this week — root cause looks like a slow checkout step (LCP 4.2s). SEO: 6 quick wins available (meta descriptions, alt text, internal links). Recommended fix: lazy-load checkout images to cut load time ~1.6s.`,
        payload: { type: 'website', score: 82, issues: [{ k: 'Checkout LCP 4.2s', sev: 'high' }, { k: 'Missing meta descriptions (6)', sev: 'medium' }, { k: 'Broken link in footer', sev: 'low' }], seoWins: 6 },
        suggestions: ['Apply the checkout fix', 'Show SEO recommendations', 'Run a full audit'],
      };
    }
    case 'bi': {
      return {
        summary: `🧠 Forecast: at current trajectory, revenue grows **+18% QoQ**. Key driver: enterprise pipeline (12 leads, ~$96k weighted). Risk: churn ticking up in SMB tier (+1.2%). Strategic recommendation: launch an SMB retention offer and double down on enterprise outbound.`,
        payload: { type: 'bi', revenueGrowth: 18, pipeline: 96000, churnRisk: 'SMB +1.2%', kpis: [{ k: 'MRR', v: '$84.2k', d: '+6.4%' }, { k: 'Active users', v: '51,340', d: '+9%' }, { k: 'CAC', v: '$112', d: '-4%' }] },
        suggestions: ['Generate executive report', 'Forecast 12 months', 'Show top opportunities'],
      };
    }
    default:
      return { summary: 'Module not found.', payload: null, suggestions: [] };
  }
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

module.exports = { masterReply, runModule, routeIntent, MODULES };
