// ============================================================
// AI BOS — Views (rendered per route into #content)
// Each view returns an HTML string; some attach behavior via init().
// ============================================================
const ICONS = {
  dashboard: '📊', assistant: '🤖', content: '📝', comms: '💬', market: '📈',
  escrow: '🔐', feedback: '⭐', website: '🌐', bi: '🧠', tasks: '✅', security: '🛡️', settings: '⚙️',
};

const PLATFORM_ICON = { LinkedIn: '💼', X: '𝕏', Instagram: '📸', Facebook: '👍', YouTube: '▶️', WhatsApp: '🟢', Telegram: '✈️' };

const Views = {};

// ---------- DASHBOARD ----------
Views.dashboard = async () => {
  const d = await API.get('/dashboard');
  const moduleMeta = {
    content: ['Content & Publishing', 'Creates posts, blogs, ads & schedules them'],
    comms: ['Communication', 'Drafts emails, replies & customer support'],
    market: ['Market & Stock', 'Tracks markets, alerts & financial news'],
    escrow: ['Escrow & Transactions', 'Monitors payments & flags risk'],
    feedback: ['Customer Feedback', 'Analyzes reviews & sentiment'],
    website: ['Website Management', 'Performance, SEO & technical health'],
    bi: ['Business Intelligence', 'Reports, forecasts & strategy'],
  };

  const kpis = d.kpis.map((k) => `
    <div class="kpi">
      <div class="label">${esc(k.label)}</div>
      <div class="value">${esc(k.value)}</div>
      <div class="delta ${k.up ? 'up' : 'down'}">${k.up ? '▲' : '▼'} ${esc(k.delta)}</div>
    </div>`).join('');

  const bars = (arr) => arr.map((v) => `<div class="bar" style="height:${v}%"></div>`).join('');

  const modules = Object.entries(moduleMeta).map(([key, [name, desc]]) => `
    <div class="module-card" data-route="${key}">
      <div class="mc-icon">${ICONS[key]}</div>
      <h4>${esc(name)} AI</h4>
      <p>${esc(desc)}</p>
      <div class="mc-status"><span class="pulse-dot"></span> Active · Co-worker online</div>
    </div>`).join('');

  return {
    html: `
    <div class="grid grid-4 mb20">${kpis}</div>

    <div class="grid grid-2 mb20">
      <div class="card">
        <div class="card-head"><div><h3>Revenue Trend</h3><div class="sub">Last 8 weeks</div></div><span class="badge-tag tag-green">▲ +18% QoQ</span></div>
        <div class="chart">${bars(d.revenueTrend.map((v) => Math.round((v / 90) * 100)))}</div>
      </div>
      <div class="card">
        <div class="card-head"><div><h3>Customer Engagement</h3><div class="sub">Across all channels</div></div><span class="badge-tag tag-cyan">Live</span></div>
        <div class="chart">${bars(d.engagementTrend)}</div>
      </div>
    </div>

    <div class="grid grid-4 mb20">
      <div class="kpi"><div class="label">⏳ Pending Approvals</div><div class="value">${d.counters.pendingApprovals}</div><div class="delta down">Needs your review</div></div>
      <div class="kpi"><div class="label">🚩 Flagged Items</div><div class="value">${d.counters.flagged}</div><div class="delta down">Risk review</div></div>
      <div class="kpi"><div class="label">📋 Open Tasks</div><div class="value">${d.counters.openTasks}</div><div class="delta up">In progress</div></div>
      <div class="kpi"><div class="label">🔔 Unread Alerts</div><div class="value">${d.counters.unreadNotifs}</div><div class="delta up">From AI co-workers</div></div>
    </div>

    <div class="flex-between mb16"><h3 style="font-size:16px;font-weight:800">🧩 AI Co-workers</h3><span class="pill-online"><span class="pulse-dot"></span> 7 modules online</span></div>
    <div class="grid grid-3">${modules}</div>
    `,
    init(root, go) {
      $$('.module-card', root).forEach((c) => c.addEventListener('click', () => go(c.dataset.route)));
    },
  };
};

// ---------- ASSISTANT (Master AI chat) ----------
Views.assistant = async () => {
  const { history } = await API.get('/ai/history');
  return {
    html: `
    <div class="chat-wrap">
      <div class="chat-scroll" id="chatScroll"></div>
      <div class="chat-input-bar">
        <button class="mic-btn" id="micBtn" title="Voice command">🎤</button>
        <textarea id="chatInput" placeholder="Ask your Master AI… e.g. 'Give me my morning briefing' or 'Draft a LinkedIn post'"></textarea>
        <button class="send-btn" id="sendBtn">➤</button>
      </div>
    </div>`,
    init(root) {
      const scroll = $('#chatScroll', root);
      const input = $('#chatInput', root);

      function addMsg(role, text, payload, suggestions) {
        const av = role === 'user' ? (API.user.name[0] || 'U') : '🤖';
        const m = el(`<div class="msg ${role}"><div class="m-avatar">${role === 'user' ? esc(av) : '🤖'}</div><div><div class="bubble">${mdBold(text)}</div></div></div>`);
        const wrap = m.querySelector('.bubble').parentElement;
        if (payload) wrap.appendChild(el(renderPayload(payload)));
        if (suggestions && suggestions.length) {
          const s = el(`<div class="suggestions">${suggestions.map((x) => `<button class="suggestion">${esc(x)}</button>`).join('')}</div>`);
          s.querySelectorAll('.suggestion').forEach((b) => b.addEventListener('click', () => { input.value = b.textContent; send(); }));
          wrap.appendChild(s);
        }
        scroll.appendChild(m);
        scroll.scrollTop = scroll.scrollHeight;
      }

      if (!history.length) {
        addMsg('assistant', `Welcome to **AI BOS** — I'm your Master AI executive assistant. I coordinate 7 specialized AI co-workers across content, communication, finance, market intelligence and more.\n\nTry a command below or speak using the 🎤 button.`, null,
          ['Give me my morning briefing', 'Draft a LinkedIn post about our launch', "Show me flagged transactions", "Today's market summary"]);
      } else {
        history.forEach((h) => addMsg(h.role, h.content));
      }

      async function send(speakBack) {
        const text = input.value.trim();
        if (!text) return;
        addMsg('user', text);
        input.value = '';
        const typing = el(`<div class="msg assistant"><div class="m-avatar">🤖</div><div class="bubble"><div class="typing"><span></span><span></span><span></span></div></div></div>`);
        scroll.appendChild(typing); scroll.scrollTop = scroll.scrollHeight;
        try {
          const r = await API.post('/ai/chat', { message: text });
          typing.remove();
          addMsg('assistant', r.text, r.payload, r.suggestions);
          if (speakBack && window.Voice) Voice.speak(r.text);
        } catch (e) { typing.remove(); addMsg('assistant', '⚠️ ' + e.message); }
      }

      $('#sendBtn', root).addEventListener('click', send);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });

      // Push-to-talk mic (speaks the reply back)
      const micBtn = $('#micBtn', root);
      let activeRec = null;
      micBtn.addEventListener('click', () => {
        if (!window.Voice || !Voice.supported()) { toast('Voice not supported in this browser. Try Chrome.', 'error'); return; }
        if (micBtn.classList.contains('recording')) { try { activeRec && activeRec.stop(); } catch (e) {} micBtn.classList.remove('recording'); return; }
        micBtn.classList.add('recording');
        Voice.loadVoices();
        activeRec = Voice.listenOnce((transcript) => {
          micBtn.classList.remove('recording');
          input.value = transcript;
          send(true); // speak the reply out loud
        });
        // safety: clear recording state if it ends without a result
        setTimeout(() => micBtn.classList.remove('recording'), 8000);
      });
    },
  };
};

function renderPayload(p) {
  if (p.type === 'content') {
    return `<div class="payload-card"><div class="pc-title">📝 Draft Variations · awaiting approval</div>
      ${p.variants.map((v, i) => `<div class="variant"><b style="color:var(--violet)">Variant ${i + 1}</b><br>${esc(v)}</div>`).join('')}
      <div class="muted">Suggested hashtags: ${p.hashtags.join(' ')}</div></div>`;
  }
  if (p.type === 'email') {
    return `<div class="payload-card"><div class="pc-title">✉️ Drafted Email · awaiting approval</div>
      <b>Subject:</b> ${esc(p.subject)}<div class="variant mt8">${esc(p.body).replace(/\n/g, '<br>')}</div></div>`;
  }
  if (p.type === 'market') {
    return `<div class="payload-card"><div class="pc-title">📈 Market Snapshot</div>
      <div class="muted mb16">${esc(p.headline)}</div>
      ${p.movers.map((m) => `<div class="flex-between" style="padding:6px 0"><b>${esc(m.s)}</b><span class="${m.c >= 0 ? 'delta up' : 'delta down'}">${m.c >= 0 ? '▲' : '▼'} ${Math.abs(m.c)}%</span></div>`).join('')}</div>`;
  }
  if (p.type === 'escrow') {
    return `<div class="payload-card"><div class="pc-title">🔐 Flagged Transaction</div>
      <div class="flex-between mb16"><b>${esc(p.ref)} · $${p.amount.toLocaleString()}</b><span class="badge-tag tag-high">Risk: ${esc(p.risk)}</span></div>
      <div class="muted">Reasons:</div><ul style="margin:6px 0 0 18px;font-size:13px;color:var(--text-dim)">${p.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>`;
  }
  if (p.type === 'feedback') {
    return `<div class="payload-card"><div class="pc-title">⭐ Sentiment Analysis</div>
      <div class="flex gap12 mb16"><span class="badge-tag tag-green">😊 ${p.positive}%</span><span class="badge-tag tag-gray">😐 ${p.neutral}%</span><span class="badge-tag tag-high">😞 ${p.negative}%</span><span class="badge-tag tag-cyan">CSAT ${p.csat}/5</span></div>
      <div class="muted">Top themes: ${p.themes.join(' · ')}</div></div>`;
  }
  if (p.type === 'website') {
    return `<div class="payload-card"><div class="pc-title">🌐 Website Health: ${p.score}/100</div>
      ${p.issues.map((i) => `<div class="flex-between" style="padding:5px 0"><span>${esc(i.k)}</span><span class="badge-tag tag-${i.sev}">${i.sev}</span></div>`).join('')}
      <div class="muted mt8">${p.seoWins} SEO quick-wins available.</div></div>`;
  }
  if (p.type === 'bi') {
    return `<div class="payload-card"><div class="pc-title">🧠 Business Intelligence</div>
      <div class="grid grid-3 gap8" style="gap:8px">${p.kpis.map((k) => `<div><div class="muted" style="font-size:11px">${esc(k.k)}</div><b>${esc(k.v)}</b> <span class="delta up" style="font-size:11px">${esc(k.d)}</span></div>`).join('')}</div>
      <div class="muted mt8">Forecast revenue growth: <b style="color:var(--green)">+${p.revenueGrowth}%</b> · Pipeline: $${p.pipeline.toLocaleString()}</div></div>`;
  }
  return '';
}

// ---------- CONTENT & PUBLISHING ----------
Views.content = async () => {
  const { items } = await API.get('/posts');
  const statusTag = { draft: 'tag-gray', pending_approval: 'tag-medium', scheduled: 'tag-violet', published: 'tag-green', rejected: 'tag-high' };
  const rows = items.map((p) => `
    <div class="list-row" data-id="${p.id}">
      <div class="mc-icon" style="width:38px;height:38px;font-size:18px;margin:0">${PLATFORM_ICON[p.platform] || '📱'}</div>
      <div class="lr-main"><b>${esc(p.platform)}</b><span>${esc(p.content.slice(0, 90))}${p.content.length > 90 ? '…' : ''}</span></div>
      <span class="badge-tag ${statusTag[p.status] || 'tag-gray'}">${esc(p.status.replace('_', ' '))}</span>
      ${p.engagement ? `<span class="muted hide-mobile">${p.engagement.toLocaleString()} eng.</span>` : ''}
      <div class="row-actions">
        ${p.status === 'pending_approval' ? `<button class="btn btn-sm btn-success" data-act="approve">Approve & Publish</button><button class="btn btn-sm btn-danger" data-act="reject">Reject</button>` : ''}
      </div>
    </div>`).join('');

  return {
    html: `
    <div class="flex-between mb20"><div class="muted">The Content & Publishing AI drafts posts, blogs & ads. Nothing publishes without your approval.</div>
      <button class="btn btn-primary" id="genBtn">✨ Generate with AI</button></div>
    <div class="card">${rows || emptyState('No content yet', '📝')}</div>`,
    init(root, go, reload) {
      $('#genBtn', root).addEventListener('click', () => {
        openModal(`
          <h3>✨ Generate Content</h3><div class="modal-sub">The Content AI will draft on-brand variations for approval.</div>
          <div class="field"><label>Platform</label><select id="mPlatform">${Object.keys(PLATFORM_ICON).map((p) => `<option>${p}</option>`).join('')}</select></div>
          <div class="field"><label>What's it about?</label><input id="mTopic" placeholder="e.g. our new product launch" /></div>
          <div id="genResult"></div>
          <div class="modal-actions"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="mGen">Generate Draft</button></div>`);
        $('#mGen').addEventListener('click', async () => {
          const topic = $('#mTopic').value || 'our latest update';
          const r = await API.post('/ai/module/content', { prompt: 'about ' + topic });
          const platform = $('#mPlatform').value;
          $('#genResult').innerHTML = `<div class="payload-card">${r.payload.variants.map((v, i) => `<div class="variant"><label style="display:flex;gap:8px;cursor:pointer"><input type="radio" name="variant" value="${i}" style="width:auto" ${i === 0 ? 'checked' : ''}/> <span>${esc(v)}</span></label></div>`).join('')}</div>`;
          $('#mGen').textContent = 'Queue for Approval';
          $('#mGen').onclick = async () => {
            const idx = $('input[name=variant]:checked')?.value || 0;
            await API.post('/posts', { platform, content: r.payload.variants[idx] });
            closeModal(); toast('Draft queued for your approval', 'success'); reload();
          };
        });
      });

      $$('.list-row', root).forEach((row) => {
        row.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', async () => {
          const id = row.dataset.id; const act = b.dataset.act;
          try {
            await API.post(`/posts/${id}/${act}`);
            toast(act === 'approve' ? 'Published! 🚀' : 'Post rejected', act === 'approve' ? 'success' : '');
            reload();
          } catch (e) { toast(e.message, 'error'); }
        }));
      });
    },
  };
};

// ---------- COMMUNICATION ----------
Views.comms = async () => {
  const { items } = await API.get('/messages');
  const chIcon = { email: '✉️', whatsapp: '🟢', telegram: '✈️', chat: '💬' };
  const rows = items.map((m) => `
    <div class="list-row" data-id="${m.id}">
      <div class="mc-icon" style="width:38px;height:38px;font-size:17px;margin:0">${chIcon[m.channel] || '💬'}</div>
      <div class="lr-main"><b>${esc(m.customer || m.channel)} ${m.subject ? '· ' + esc(m.subject) : ''}</b><span>${esc((m.body || '').slice(0, 80))}…</span></div>
      <span class="badge-tag ${m.status === 'sent' ? 'tag-green' : m.status === 'pending_approval' ? 'tag-medium' : 'tag-gray'}">${esc(m.status.replace('_', ' '))}</span>
      ${m.status === 'pending_approval' ? `<button class="btn btn-sm btn-success" data-act="send">Approve & Send</button>` : ''}
    </div>`).join('');
  return {
    html: `
    <div class="flex-between mb20"><div class="muted">Communication AI drafts replies, emails & support responses — sent only after your approval.</div>
      <button class="btn btn-primary" id="draftBtn">✨ Draft a Reply</button></div>
    <div class="card">${rows || emptyState('No messages', '💬')}</div>`,
    init(root, go, reload) {
      $('#draftBtn', root).addEventListener('click', async () => {
        const r = await API.post('/ai/module/comms', {});
        openModal(`<h3>✉️ AI-Drafted Reply</h3><div class="modal-sub">Review before sending.</div>
          <div class="field"><label>Subject</label><input id="dSub" value="${esc(r.payload.subject)}" /></div>
          <div class="field"><label>Body</label><textarea id="dBody" style="min-height:160px">${esc(r.payload.body)}</textarea></div>
          <div class="modal-actions"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="dQueue">Queue for Approval</button></div>`);
        $('#dQueue').addEventListener('click', async () => {
          await API.post('/messages', { channel: 'email', customer: 'New draft', subject: $('#dSub').value, body: $('#dBody').value });
          closeModal(); toast('Reply drafted & queued', 'success'); reload();
        });
      });
      $$('.list-row', root).forEach((row) => {
        row.querySelector('[data-act]')?.addEventListener('click', async () => {
          try { await API.post(`/messages/${row.dataset.id}/send`); toast('Message sent ✉️', 'success'); reload(); }
          catch (e) { toast(e.message, 'error'); }
        });
      });
    },
  };
};

// ---------- MARKET & STOCK ----------
Views.market = async () => {
  const { items } = await API.get('/watchlist');
  const rows = items.map((w) => `
    <tr data-id="${w.id}">
      <td><b>${esc(w.symbol)}</b><br><span class="muted" style="font-size:12px">${esc(w.name)}</span></td>
      <td>$${w.price.toLocaleString()}</td>
      <td><span class="${w.change >= 0 ? 'delta up' : 'delta down'}">${w.change >= 0 ? '▲' : '▼'} ${Math.abs(w.change)}%</span></td>
      <td class="hide-mobile">$${(w.alert || 0).toLocaleString()}</td>
      <td><button class="btn btn-sm btn-danger" data-del>Remove</button></td>
    </tr>`).join('');
  return {
    html: `
    <div class="flex-between mb20"><div class="muted">Market & Stock AI tracks your watchlist, sets alerts & summarizes financial news.</div>
      <div class="flex gap8"><button class="btn" id="summBtn">📰 News Summary</button><button class="btn btn-primary" id="addBtn">➕ Add to Watchlist</button></div></div>
    <div class="card mb20"><div class="card-head"><h3>📈 Watchlist</h3><span class="pill-online"><span class="pulse-dot"></span> Live</span></div>
      <table><thead><tr><th>Symbol</th><th>Price</th><th>Change</th><th class="hide-mobile">Alert</th><th></th></tr></thead><tbody>${rows || ''}</tbody></table>
      ${items.length ? '' : emptyState('No symbols tracked', '📈')}</div>`,
    init(root, go, reload) {
      $('#addBtn', root).addEventListener('click', () => {
        openModal(`<h3>➕ Add Symbol</h3><div class="modal-sub">Track price & set an alert.</div>
          <div class="field"><label>Symbol</label><input id="aSym" placeholder="e.g. GOOGL" /></div>
          <div class="field"><label>Name (optional)</label><input id="aName" placeholder="Alphabet Inc." /></div>
          <div class="field"><label>Alert price (optional)</label><input id="aAlert" type="number" placeholder="180" /></div>
          <div class="modal-actions"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="aSave">Add</button></div>`);
        $('#aSave').addEventListener('click', async () => {
          const symbol = $('#aSym').value.trim(); if (!symbol) return toast('Enter a symbol', 'error');
          await API.post('/watchlist', { symbol, name: $('#aName').value, alert: parseFloat($('#aAlert').value) || null });
          closeModal(); toast('Added to watchlist', 'success'); reload();
        });
      });
      $('#summBtn', root).addEventListener('click', async () => {
        const r = await API.post('/ai/module/market', {});
        openModal(`<h3>📰 Market News Summary</h3><div class="modal-sub">Generated by Market & Stock AI</div>
          <div class="muted">${esc(r.summary)}</div>
          <div class="modal-actions"><button class="btn btn-primary" onclick="closeModal()">Got it</button></div>`);
      });
      $$('tr[data-id]', root).forEach((tr) => tr.querySelector('[data-del]')?.addEventListener('click', async () => {
        await API.del('/watchlist/' + tr.dataset.id); toast('Removed'); reload();
      }));
    },
  };
};

// ---------- ESCROW & TRANSACTIONS ----------
Views.escrow = async () => {
  const { items } = await API.get('/transactions');
  const stColor = { flagged: 'tag-high', held: 'tag-medium', released: 'tag-green', completed: 'tag-green', pending: 'tag-gray' };
  const rows = items.map((t) => `
    <tr data-id="${t.id}">
      <td><b>${esc(t.ref)}</b> ${t.flagged ? '🚩' : ''}<br><span class="muted" style="font-size:12px">${esc(t.counterparty)}</span></td>
      <td>$${t.amount.toLocaleString()}</td>
      <td><span class="badge-tag tag-gray">${esc(t.type)}</span></td>
      <td><span class="badge-tag ${stColor[t.status] || 'tag-gray'}">${esc(t.status)}</span></td>
      <td><div class="row-actions">
        ${t.status !== 'released' && t.status !== 'completed' ? `<button class="btn btn-sm btn-success" data-act="release">Release</button><button class="btn btn-sm" data-act="hold">Hold</button>` : '<span class="muted">—</span>'}
      </div></td>
    </tr>`).join('');
  const flaggedCount = items.filter((t) => t.flagged).length;
  return {
    html: `
    ${flaggedCount ? `<div class="err-msg mb20">🚩 ${flaggedCount} transaction(s) flagged by the Escrow AI for unusual activity. Funds are held pending your review.</div>` : ''}
    <div class="muted mb20">Escrow & Transaction AI monitors payments, manages escrow workflows & flags risk. Financial actions require your approval (owner role).</div>
    <div class="card"><div class="card-head"><h3>🔐 Transactions</h3></div>
      <table><thead><tr><th>Ref</th><th>Amount</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>`,
    init(root, go, reload) {
      $$('tr[data-id]', root).forEach((tr) => tr.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', async () => {
        try { await API.post(`/transactions/${tr.dataset.id}/action`, { action: b.dataset.act });
          toast(`Transaction ${b.dataset.act}d`, 'success'); reload();
        } catch (e) { toast(e.message, 'error'); }
      })));
    },
  };
};

// ---------- FEEDBACK ----------
Views.feedback = async () => {
  const { items, dist, csat } = await API.get('/feedback');
  const total = items.length || 1;
  const pct = (n) => Math.round((n / total) * 100);
  const rows = items.map((f) => `
    <div class="list-row">
      <div class="avatar" style="background:${f.sentiment === 'positive' ? 'var(--green)' : f.sentiment === 'negative' ? 'var(--red)' : 'var(--text-dim)'}">${'★'.repeat(f.rating) || '·'}</div>
      <div class="lr-main"><b>${esc(f.customer)} · ${esc(f.source)}</b><span>${esc(f.comment)}</span></div>
      <span class="badge-tag ${f.sentiment === 'positive' ? 'tag-green' : f.sentiment === 'negative' ? 'tag-high' : 'tag-gray'}">${f.sentiment}</span>
    </div>`).join('');
  const deg = pct(dist.positive || 0) * 3.6;
  return {
    html: `
    <div class="grid grid-3 mb20">
      <div class="card" style="text-align:center"><div class="card-head" style="justify-content:center"><h3>Overall CSAT</h3></div>
        <div style="font-size:46px;font-weight:800" class="gradient-text">${csat}</div><div class="muted">out of 5.0 · ${items.length} reviews</div></div>
      <div class="card" style="text-align:center"><div class="card-head" style="justify-content:center"><h3>Sentiment</h3></div>
        <div style="display:flex;justify-content:center"><div class="donut" style="background:conic-gradient(var(--green) 0 ${deg}deg, var(--text-dim) ${deg}deg ${deg + pct(dist.neutral || 0) * 3.6}deg, var(--red) ${deg + pct(dist.neutral || 0) * 3.6}deg 360deg)"><div class="center"><b>${pct(dist.positive || 0)}%</b><span>positive</span></div></div></div></div>
      <div class="card"><div class="card-head"><h3>Breakdown</h3></div>
        <div class="flex-between mb16"><span>😊 Positive</span><b class="delta up">${pct(dist.positive || 0)}%</b></div>
        <div class="flex-between mb16"><span>😐 Neutral</span><b>${pct(dist.neutral || 0)}%</b></div>
        <div class="flex-between mb16"><span>😞 Negative</span><b class="delta down">${pct(dist.negative || 0)}%</b></div>
        <button class="btn btn-primary" id="recBtn" style="width:100%">🧠 AI Recommendations</button></div>
    </div>
    <div class="card"><div class="card-head"><h3>⭐ Recent Reviews</h3></div>${rows}</div>`,
    init(root) {
      $('#recBtn', root).addEventListener('click', async () => {
        const r = await API.post('/ai/module/feedback', {});
        openModal(`<h3>🧠 Feedback AI Recommendations</h3><div class="modal-sub">Based on ${items.length} reviews</div>
          <div class="muted">${esc(r.summary)}</div>
          <div class="modal-actions"><button class="btn btn-primary" onclick="closeModal()">Got it</button></div>`);
      });
    },
  };
};

// ---------- WEBSITE ----------
Views.website = async () => {
  const r = await API.post('/ai/module/website', {});
  const p = r.payload;
  return {
    html: `
    <div class="grid grid-3 mb20">
      <div class="card" style="text-align:center"><div class="card-head" style="justify-content:center"><h3>Health Score</h3></div>
        <div style="font-size:46px;font-weight:800" class="gradient-text">${p.score}</div><div class="muted">out of 100</div></div>
      <div class="card"><div class="card-head"><h3>Traffic (7d)</h3></div><div class="spark">${[40, 55, 48, 62, 58, 70, 66].map((v) => `<div class="bar" style="height:${v}%"></div>`).join('')}</div><div class="muted mt8">12,480 sessions · ▲ 6%</div></div>
      <div class="card"><div class="card-head"><h3>SEO Wins</h3></div><div style="font-size:46px;font-weight:800" class="gradient-text">${p.seoWins}</div><div class="muted">quick improvements available</div></div>
    </div>
    <div class="grid grid-2">
      <div class="card"><div class="card-head"><h3>⚠️ Detected Issues</h3></div>
        ${p.issues.map((i) => `<div class="list-row"><div class="lr-main"><b>${esc(i.k)}</b></div><span class="badge-tag tag-${i.sev}">${i.sev}</span></div>`).join('')}
        <button class="btn btn-primary mt16" id="fixBtn" style="width:100%">⚡ Apply Recommended Fix</button></div>
      <div class="card"><div class="card-head"><h3>🧠 AI Recommendation</h3></div><div class="muted">${esc(r.summary)}</div></div>
    </div>`,
    init(root, go, reload) {
      $('#fixBtn', root).addEventListener('click', () => { toast('Fix queued — requires deploy approval', 'success'); });
    },
  };
};

// ---------- BUSINESS INTELLIGENCE ----------
Views.bi = async () => {
  const r = await API.post('/ai/module/bi', {});
  const p = r.payload;
  return {
    html: `
    <div class="grid grid-3 mb20">${p.kpis.map((k) => `<div class="kpi"><div class="label">${esc(k.k)}</div><div class="value">${esc(k.v)}</div><div class="delta up">▲ ${esc(k.d)}</div></div>`).join('')}</div>
    <div class="grid grid-2 mb20">
      <div class="card"><div class="card-head"><h3>📈 12-Month Forecast</h3><span class="badge-tag tag-green">+${p.revenueGrowth}% QoQ</span></div>
        <div class="chart">${[50, 54, 58, 60, 65, 68, 72, 75, 80, 84, 88, 94].map((v) => `<div class="bar" style="height:${v}%"></div>`).join('')}</div></div>
      <div class="card"><div class="card-head"><h3>🎯 Strategic Recommendation</h3></div><div class="muted">${esc(r.summary)}</div>
        <button class="btn btn-primary mt16" id="repBtn" style="width:100%">📄 Generate Executive Report</button></div>
    </div>`,
    init(root) {
      $('#repBtn', root).addEventListener('click', () => {
        openModal(`<h3>📄 Executive Report</h3><div class="modal-sub">Auto-generated by Business Intelligence AI · ${new Date().toLocaleDateString()}</div>
          <div class="muted" style="white-space:pre-line">EXECUTIVE SUMMARY

Revenue is on track to grow +${p.revenueGrowth}% QoQ, driven primarily by the enterprise pipeline (~$${p.pipeline.toLocaleString()} weighted).

KPIs:
${p.kpis.map((k) => `• ${k.k}: ${k.v} (${k.d})`).join('\n')}

RISK: ${p.churnRisk} — recommend an SMB retention offer.

RECOMMENDATION: Double down on enterprise outbound while launching SMB retention initiatives. Projected outcome: sustained double-digit growth with reduced churn.</div>
          <div class="modal-actions"><button class="btn btn-ghost" onclick="closeModal()">Close</button><button class="btn btn-primary" onclick="closeModal()">Export PDF</button></div>`);
      });
    },
  };
};

// ---------- TASKS ----------
Views.tasks = async () => {
  const { items } = await API.get('/tasks');
  const cols = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
  const board = Object.entries(cols).map(([key, label]) => `
    <div class="card"><div class="card-head"><h3>${label}</h3><span class="badge-tag tag-gray">${items.filter((t) => t.status === key).length}</span></div>
      ${items.filter((t) => t.status === key).map((t) => `
        <div class="list-row" data-id="${t.id}" style="flex-direction:column;align-items:flex-start;gap:8px">
          <div class="flex-between" style="width:100%"><b style="font-size:13.5px">${esc(t.title)}</b><span class="badge-tag tag-${t.priority}">${t.priority}</span></div>
          <div class="flex gap8 wrap" style="width:100%"><span class="muted" style="font-size:11px">${esc(t.module || 'General')}</span>
            <div class="row-actions" style="margin-left:auto">
              ${key !== 'todo' ? '<button class="btn btn-sm" data-mv="todo">◀</button>' : ''}
              ${key !== 'done' ? `<button class="btn btn-sm" data-mv="${key === 'todo' ? 'in_progress' : 'done'}">▶</button>` : ''}
              <button class="btn btn-sm btn-danger" data-del>✕</button></div></div>
        </div>`).join('') || '<div class="muted" style="padding:12px 0">No tasks</div>'}
    </div>`).join('');
  return {
    html: `<div class="flex-between mb20"><div class="muted">Tasks across all AI co-workers. Drag-free kanban — use arrows to move.</div><button class="btn btn-primary" id="addTask">➕ New Task</button></div>
      <div class="grid grid-3">${board}</div>`,
    init(root, go, reload) {
      $('#addTask', root).addEventListener('click', () => {
        openModal(`<h3>➕ New Task</h3><div class="field"><label>Title</label><input id="tTitle" /></div>
          <div class="field"><label>Priority</label><select id="tPri"><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option></select></div>
          <div class="field"><label>Module</label><input id="tMod" placeholder="e.g. Content & Publishing" /></div>
          <div class="modal-actions"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="tSave">Create</button></div>`);
        $('#tSave').addEventListener('click', async () => {
          if (!$('#tTitle').value) return toast('Enter a title', 'error');
          await API.post('/tasks', { title: $('#tTitle').value, priority: $('#tPri').value, module: $('#tMod').value });
          closeModal(); toast('Task created', 'success'); reload();
        });
      });
      $$('[data-id]', root).forEach((row) => {
        row.querySelectorAll('[data-mv]').forEach((b) => b.addEventListener('click', async () => {
          await API.patch('/tasks/' + row.dataset.id, { status: b.dataset.mv }); reload();
        }));
        row.querySelector('[data-del]')?.addEventListener('click', async () => { await API.del('/tasks/' + row.dataset.id); reload(); });
      });
    },
  };
};

// ---------- SECURITY ----------
Views.security = async () => {
  const { items } = await API.get('/audit');
  const rows = items.map((a) => `<tr><td><span class="badge-tag tag-cyan">${esc(a.action)}</span></td><td>${esc(a.detail || '')}</td><td class="muted">${timeAgo(a.created_at)}</td></tr>`).join('');
  const vs = (window.Voice && Voice.settings) || { enabled: false, wakeWord: 'jarvis', voiceGender: 'female', speakReplies: true };
  return {
    html: `
    <div class="card voice-settings mb20"><div class="card-head"><div><h3>🎙️ Voice Assistant</h3><div class="sub">Hands-free wake word + spoken replies</div></div><span class="badge-tag ${vs.enabled ? 'tag-green' : 'tag-gray'}" id="vsState">${vs.enabled ? 'Active' : 'Off'}</span></div>
      <div class="field-row"><div class="fr-label"><b>Hands-free listening</b><span>Always listen for the wake word</span></div><div class="toggle-sw ${vs.enabled ? 'on' : ''}" id="vsEnabled"></div></div>
      <div class="field-row"><div class="fr-label"><b>Wake word</b><span>Say this to wake the assistant</span></div><select id="vsWake" style="width:160px"><option value="jarvis">Jarvis</option><option value="hey bos">Hey BOS</option><option value="assistant">Assistant</option><option value="computer">Computer</option></select></div>
      <div class="field-row"><div class="fr-label"><b>Voice</b><span>How the assistant speaks</span></div><select id="vsVoice" style="width:160px"><option value="female">Female</option><option value="male">Male</option><option value="default">System default</option></select></div>
      <div class="field-row"><div class="fr-label"><b>Speak replies aloud</b><span>Read answers out loud</span></div><div class="toggle-sw ${vs.speakReplies ? 'on' : ''}" id="vsSpeak"></div></div>
      <div class="field-row"><div class="fr-label"><b>Test it</b><span>Hear the current voice</span></div><button class="btn btn-sm" id="vsTest">🔊 Test voice</button></div>
      <div class="muted mt8" style="font-size:12px">💡 Tip: say <b>"${Voice && Voice.cap ? Voice.cap(vs.wakeWord) : 'Jarvis'}, open the dashboard"</b> or <b>"${Voice && Voice.cap ? Voice.cap(vs.wakeWord) : 'Jarvis'}, any flagged transactions?"</b></div>
    </div>
    <div class="grid grid-2 mb20">
      <div class="card"><div class="card-head"><h3>🛡️ Security Controls</h3></div>
        <div class="list-row"><div class="lr-main"><b>Multi-Factor Authentication</b><span>Extra layer on login</span></div><label class="switch"><input type="checkbox" id="mfaTog" ${API.user.mfa_enabled ? 'checked' : ''} style="width:auto"/> <span class="badge-tag ${API.user.mfa_enabled ? 'tag-green' : 'tag-gray'}" id="mfaLbl">${API.user.mfa_enabled ? 'Enabled' : 'Disabled'}</span></label></div>
        <div class="list-row"><div class="lr-main"><b>End-to-End Encryption</b><span>Data encrypted at rest & in transit</span></div><span class="badge-tag tag-green">Active</span></div>
        <div class="list-row"><div class="lr-main"><b>Role-Based Access Control</b><span>Your role: <b style="color:var(--cyan)">${esc(API.user.role)}</b></span></div><span class="badge-tag tag-green">Enforced</span></div>
        <div class="list-row"><div class="lr-main"><b>Approval Gates</b><span>Publishing, messaging & payments need approval</span></div><span class="badge-tag tag-green">On</span></div>
        <div class="list-row"><div class="lr-main"><b>Data Protection Compliance</b><span>GDPR-ready data handling</span></div><span class="badge-tag tag-green">Compliant</span></div>
      </div>
      <div class="card"><div class="card-head"><h3>🔑 Secure Integrations</h3></div>
        ${['Facebook', 'Instagram', 'X', 'LinkedIn', 'YouTube', 'WhatsApp', 'Telegram'].map((p) => `<div class="list-row"><div class="mc-icon" style="width:34px;height:34px;font-size:15px;margin:0">${PLATFORM_ICON[p] || '🔗'}</div><div class="lr-main"><b>${p}</b><span>OAuth — secure API</span></div><button class="btn btn-sm" data-connect="${p}">Connect</button></div>`).join('')}
      </div>
    </div>
    <div class="card"><div class="card-head"><h3>📜 Activity Log & Audit Trail</h3></div>
      <table><thead><tr><th>Action</th><th>Detail</th><th>When</th></tr></thead><tbody>${rows || ''}</tbody></table>
      ${items.length ? '' : emptyState('No activity yet', '📜')}</div>`,
    init(root) {
      // ---- Voice settings wiring ----
      if (window.Voice) {
        const wake = $('#vsWake', root), voice = $('#vsVoice', root);
        if (wake) wake.value = Voice.settings.wakeWord;
        if (voice) voice.value = Voice.settings.voiceGender;
        $('#vsEnabled', root)?.addEventListener('click', (e) => {
          const on = Voice.toggle();
          e.target.classList.toggle('on', on);
          const st = $('#vsState', root); if (st) { st.textContent = on ? 'Active' : 'Off'; st.className = 'badge-tag ' + (on ? 'tag-green' : 'tag-gray'); }
          toast(on ? 'Voice mode ON' : 'Voice mode off', on ? 'success' : '');
        });
        $('#vsSpeak', root)?.addEventListener('click', (e) => {
          Voice.settings.speakReplies = !Voice.settings.speakReplies; Voice.save();
          e.target.classList.toggle('on', Voice.settings.speakReplies);
        });
        wake?.addEventListener('change', (e) => { Voice.settings.wakeWord = e.target.value; Voice.save(); toast('Wake word: "' + Voice.cap(e.target.value) + '"', 'success'); });
        voice?.addEventListener('change', (e) => { Voice.settings.voiceGender = e.target.value; Voice.save(); Voice.loadVoices(); });
        $('#vsTest', root)?.addEventListener('click', () => { Voice.loadVoices(); Voice.speak('Hello, I am your AI business assistant. Say ' + Voice.settings.wakeWord + ' to give me a command.'); });
      }

      $('#mfaTog', root).addEventListener('change', async (e) => {
        const r = await API.post('/security/mfa', { enabled: e.target.checked });
        API.user.mfa_enabled = r.mfa_enabled; localStorage.setItem('aibos_user', JSON.stringify(API.user));
        $('#mfaLbl', root).textContent = r.mfa_enabled ? 'Enabled' : 'Disabled';
        $('#mfaLbl', root).className = 'badge-tag ' + (r.mfa_enabled ? 'tag-green' : 'tag-gray');
        toast('MFA ' + (r.mfa_enabled ? 'enabled' : 'disabled'), 'success');
      });
      $$('[data-connect]', root).forEach((b) => b.addEventListener('click', () => {
        toast(`Demo: ${b.dataset.connect} OAuth flow would open here`, '');
        b.textContent = 'Connected ✓'; b.classList.add('btn-success');
      }));
    },
  };
};

function emptyState(msg, icon) { return `<div class="empty"><div class="e-icon">${icon}</div>${esc(msg)}</div>`; }
