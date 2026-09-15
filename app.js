

let currentActiveView = 'dashboard-view';

function navigateToView(targetView, pushHistory = true) {
  if (!targetView) return;
  if (targetView === currentActiveView && !pushHistory) return;

  document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
  document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));

  const navItem = document.querySelector(`.nav-item[data-view="${targetView}"]`);
  if (navItem) {
    navItem.classList.add('active');
  }

  const panel = document.getElementById(targetView);
  if (panel) {
    panel.classList.add('active');
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.scrollTop = 0;
  }

  if (targetView === 'ai-view' && typeof renderSavedChatHistory === 'function') {
    renderSavedChatHistory();
  }

  if (pushHistory && targetView !== currentActiveView) {
    history.pushState({ view: targetView }, '', '#' + targetView);
  }
  currentActiveView = targetView;
}

window.addEventListener('popstate', (event) => {
  if (event.state && event.state.view) {
    navigateToView(event.state.view, false);
  } else {
    
    navigateToView('dashboard-view', false);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.replace('#', '');
  const initialView = hash && document.getElementById(hash) ? hash : 'dashboard-view';
  history.replaceState({ view: initialView }, '', '#' + initialView);
  navigateToView(initialView, false);
  if (typeof renderSavedChatHistory === 'function') {
    renderSavedChatHistory();
  }
});

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const targetView = item.getAttribute('data-view');
    navigateToView(targetView);
  });
});

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

let transactions = [
  { desc: 'Swiggy order', cat: 'Food', date: '12 Sep', amount: -420, type: 'expense' },
  { desc: 'Salary credit', cat: 'Income', date: '1 Sep', amount: 85000, type: 'income' },
  { desc: 'Electricity bill', cat: 'Utilities', date: '8 Sep', amount: -1850, type: 'expense' },
  { desc: 'Zomato order', cat: 'Food', date: '10 Sep', amount: -610, type: 'expense' },
  { desc: 'Flight booking', cat: 'Travel', date: '5 Sep', amount: -3000, type: 'expense' }
];

function renderTransactions(listToRender = transactions) {
  const tableBody = document.getElementById('transactions-table-body');
  if (!tableBody) return;

  if (listToRender.length === 0) {
    tableBody.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-secondary); font-size: 13px;">No transactions found.</div>`;
    return;
  }

  tableBody.innerHTML = listToRender.map(tx => {
    const isIncome = tx.amount > 0;
    const formattedAmt = (isIncome ? '+₹' : '-₹') + Math.abs(tx.amount).toLocaleString('en-IN');
    const colorStyle = isIncome ? 'color: var(--text-success);' : 'color: var(--text-danger);';
    return `
      <div class="table-row">
        <span>${tx.desc}</span>
        <span style="color: var(--text-secondary);">${tx.cat}</span>
        <span style="color: var(--text-secondary);">${tx.date}</span>
        <span style="text-align: right; ${colorStyle} font-weight: 500;">${formattedAmt}</span>
      </div>
    `;
  }).join('');
}

function filterTransactions() {
  const searchVal = document.getElementById('tx-search-input')?.value.toLowerCase() || '';
  const catVal = document.getElementById('tx-category-filter')?.value || 'all';

  const filtered = transactions.filter(tx => {
    const matchesSearch = tx.desc.toLowerCase().includes(searchVal) || tx.cat.toLowerCase().includes(searchVal);
    const matchesCat = (catVal === 'all') || (tx.cat.toLowerCase() === catVal.toLowerCase());
    return matchesSearch && matchesCat;
  });

  renderTransactions(filtered);
}

async function handleAddTransaction(e) {
  e.preventDefault();
  const desc = document.getElementById('tx-desc').value;
  const cat = document.getElementById('tx-cat').value;
  const rawAmt = parseFloat(document.getElementById('tx-amount').value);
  const type = document.getElementById('tx-type').value;

  const amt = type === 'expense' ? -Math.abs(rawAmt) : Math.abs(rawAmt);
  const newTx = {
    desc,
    cat,
    date: 'Today',
    amount: amt,
    type
  };

  transactions.unshift(newTx);
  renderTransactions();
  updateDashboardRecentTransactions();
  updateDashboardStats();
  closeModal('add-tx-modal');
  document.getElementById('form-add-tx').reset();
  showToast('Transaction saved successfully!');

  const token = getAuthToken();
  if (token) {
    try {
      const res = await fetch(`${BACKEND_API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: desc,
          type,
          category: cat,
          amount: Math.abs(rawAmt),
          paymentMethod: 'UPI'
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        newTx._id = data.data._id;
      }
    } catch (err) {
      console.log('Backend sync offline, kept locally:', err.message);
    }
  }
}

async function fetchTransactionsFromBackend() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const res = await fetch(`${BACKEND_API_URL}/transactions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      transactions = data.data.map(item => ({
        _id: item._id,
        desc: item.title || item.desc || 'Transaction',
        cat: item.category || item.cat || 'General',
        date: item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today',
        amount: item.type === 'expense' ? -Math.abs(item.amount) : Math.abs(item.amount),
        type: item.type || 'expense'
      }));
      renderTransactions();
      updateDashboardRecentTransactions();
      updateDashboardStats();
    }
  } catch (err) {
    console.log('Using local transactions, backend:', err.message);
  }
}

function updateDashboardStats() {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netSavings = totalIncome - totalExpense;
  const monthlyBudgetLimit = 65000;
  const budgetUsedPct = Math.min(Math.round((totalExpense / monthlyBudgetLimit) * 100), 100);

  const incEl = document.getElementById('stat-income-val');
  const expEl = document.getElementById('stat-expenses-val');
  const savEl = document.getElementById('stat-savings-val');
  const budEl = document.getElementById('stat-budget-val');

  if (incEl) incEl.textContent = '₹' + totalIncome.toLocaleString('en-IN');
  if (expEl) expEl.textContent = '₹' + totalExpense.toLocaleString('en-IN');
  if (savEl) {
    savEl.textContent = (netSavings >= 0 ? '₹' : '-₹') + Math.abs(netSavings).toLocaleString('en-IN');
    savEl.className = 'stat-value ' + (netSavings >= 0 ? '' : 'danger');
  }
  if (budEl) budEl.textContent = budgetUsedPct + '%';
}

function updateDashboardRecentTransactions() {
  const list = document.getElementById('dashboard-tx-list');
  if (!list) return;

  const recent = transactions.slice(0, 3);
  list.innerHTML = recent.map(tx => {
    const isIncome = tx.amount > 0;
    const formattedAmt = (isIncome ? '+₹' : '-₹') + Math.abs(tx.amount).toLocaleString('en-IN');
    const cls = isIncome ? 'success' : 'danger';
    return `
      <div class="tx-row">
        <span>${tx.desc}</span>
        <span class="tx-amount ${cls}">${formattedAmt}</span>
      </div>
    `;
  }).join('');

  updateDashboardStats();
}

function showToast(message, duration = 3500) {
  
  return;
}

const GEMINI_CONFIG_KEY = 'finly_gemini_api_key';
const GEMINI_MODEL_KEY = 'finly_gemini_model';

function getGeminiApiKey() {
  return localStorage.getItem(GEMINI_CONFIG_KEY) || '';
}

function getGeminiModel() {
  return localStorage.getItem(GEMINI_MODEL_KEY) || 'gemini-1.5-flash-latest';
}

function updateGeminiStatusUI() {
  const apiKey = getGeminiApiKey();
  const model = getGeminiModel();
  const pill = document.getElementById('gemini-status-pill');
  const text = document.getElementById('gemini-status-text');
  const dot = pill ? pill.querySelector('.status-dot') : null;

  if (pill && text) {
    if (apiKey) {
      text.textContent = `${model.includes('2.0') ? 'Gemini 2.0' : 'Gemini 1.5'} Active`;
      if (dot) dot.style.background = '#10b981';
      pill.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    } else {
      text.textContent = 'Set API Key';
      if (dot) dot.style.background = '#f59e0b';
      pill.style.borderColor = 'rgba(245, 158, 11, 0.4)';
    }
  }

  const settingsInput = document.getElementById('settings-gemini-key');
  const settingsModel = document.getElementById('settings-gemini-model');
  const modalInput = document.getElementById('modal-gemini-key');
  const modalModel = document.getElementById('modal-gemini-model');

  if (settingsInput) settingsInput.value = apiKey;
  if (settingsModel) settingsModel.value = model;
  if (modalInput) modalInput.value = apiKey;
  if (modalModel) modalModel.value = model;
}

function saveGeminiSettings() {
  const input = document.getElementById('settings-gemini-key');
  const modelSelect = document.getElementById('settings-gemini-model');
  if (input && modelSelect) {
    const key = input.value.trim();
    const model = modelSelect.value;
    localStorage.setItem(GEMINI_CONFIG_KEY, key);
    localStorage.setItem(GEMINI_MODEL_KEY, model);
    updateGeminiStatusUI();
    showToast('Gemini settings saved successfully!');
  }
}

function saveGeminiModalSettings() {
  const input = document.getElementById('modal-gemini-key');
  const modelSelect = document.getElementById('modal-gemini-model');
  if (input && modelSelect) {
    const key = input.value.trim();
    const model = modelSelect.value;
    localStorage.setItem(GEMINI_CONFIG_KEY, key);
    localStorage.setItem(GEMINI_MODEL_KEY, model);
    updateGeminiStatusUI();
    closeModal('gemini-setup-modal');
    showToast('Gemini API configured successfully!');
  }
}

function toggleApiKeyVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  if (btn) {
    btn.innerHTML = isPassword ? '<i class="ti ti-eye-off"></i>' : '<i class="ti ti-eye"></i>';
  }
}

let cachedAvailableModels = null;

async function getAvailableGeminiModels(apiKey) {
  if (!apiKey) return null;
  if (cachedAvailableModels && cachedAvailableModels.length > 0) return cachedAvailableModels;

  for (const ver of ['v1beta', 'v1']) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/${ver}/models?key=${apiKey}`);
      const data = await res.json();
      if (res.ok && data.models && Array.isArray(data.models)) {
        const valid = data.models
          .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
          .map(m => m.name.replace(/^models\//, ''));
        if (valid.length > 0) {
          cachedAvailableModels = valid;
          return valid;
        }
      } else if (data.error && data.error.message && data.error.message.toLowerCase().includes('api key not valid')) {
        throw new Error(data.error.message);
      }
    } catch (e) {
      if (e.message && e.message.toLowerCase().includes('api key not valid')) throw e;
    }
  }
  return null;
}

async function callGeminiApiUniversal({ apiKey, preferredModel, contents, systemText = '', maxTokens = 800, temperature = 0.7 }) {
  if (!apiKey) throw new Error('No API key provided. Please enter your Gemini API key in Settings.');

  let available = await getAvailableGeminiModels(apiKey);

  let modelCandidates = [];
  if (available && available.length > 0) {
    if (preferredModel && available.includes(preferredModel)) {
      modelCandidates.push(preferredModel);
    }
    
    const flashModels = available.filter(m => m.includes('flash'));
    const proModels = available.filter(m => m.includes('pro'));
    modelCandidates = [...modelCandidates, ...flashModels, ...proModels, ...available];
  } else {
    modelCandidates = [
      preferredModel,
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro',
      'gemini-pro'
    ];
  }

  modelCandidates = modelCandidates.filter((v, i, a) => v && a.indexOf(v) === i);

  let lastErrorMsg = 'Failed to connect to Google Gemini API.';

  for (const mod of modelCandidates) {
    for (const ver of ['v1beta', 'v1']) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/${ver}/models/${mod}:generateContent?key=${apiKey}`;
        const payloadContents = JSON.parse(JSON.stringify(contents));

        const bodyObj = {
          contents: payloadContents,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens
          }
        };

        if (systemText) {
          if (ver === 'v1beta' && !mod.includes('gemini-pro')) {
            bodyObj.systemInstruction = { parts: [{ text: systemText }] };
          } else {
            if (payloadContents[0]?.parts) {
              payloadContents[0].parts[0].text = `[System Context: ${systemText}]\n\n` + (payloadContents[0].parts[0].text || '');
            }
          }
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyObj)
        });

        const data = await res.json();
        if (res.ok && data.candidates && data.candidates.length > 0) {
          localStorage.setItem(GEMINI_MODEL_KEY, mod);
          return { data, workingModel: mod };
        } else if (data.error) {
          lastErrorMsg = data.error.message || res.statusText;
          if (data.error.code === 400 && lastErrorMsg.toLowerCase().includes('api key not valid')) {
            throw new Error(lastErrorMsg);
          }
        }
      } catch (e) {
        if (e.message && e.message.toLowerCase().includes('api key not valid')) {
          throw e;
        }
        lastErrorMsg = e.message;
      }
    }
  }

  throw new Error(lastErrorMsg);
}

async function testGeminiConnection() {
  const statusDiv = document.getElementById('gemini-test-status');
  const apiKey = document.getElementById('settings-gemini-key')?.value.trim() || getGeminiApiKey();
  const model = document.getElementById('settings-gemini-model')?.value || getGeminiModel();

  if (!apiKey) {
    if (statusDiv) {
      statusDiv.innerHTML = `<span style="color: #ef4444;">Please enter a Gemini API Key first.</span>`;
    }
    return;
  }

  if (statusDiv) {
    statusDiv.innerHTML = `<span style="color: #60a5fa;"><i class="ti ti-loader"></i> Discovering supported models & testing connection...</span>`;
  }

  cachedAvailableModels = null;

  try {
    const result = await callGeminiApiUniversal({
      apiKey,
      preferredModel: model,
      contents: [{ role: 'user', parts: [{ text: 'Reply with "CONNECTED".' }] }],
      maxTokens: 10
    });

    if (statusDiv) {
      statusDiv.innerHTML = `<span style="color: #10b981;">&#10004; Connected successfully to <strong>${result.workingModel}</strong>!</span>`;
    }

    if (cachedAvailableModels && cachedAvailableModels.length > 0) {
      const selects = [document.getElementById('settings-gemini-model'), document.getElementById('modal-gemini-model')];
      selects.forEach(select => {
        if (select) {
          select.innerHTML = cachedAvailableModels.map(m => `<option value="${m}" ${m === result.workingModel ? 'selected' : ''}>${m}</option>`).join('');
        }
      });
    }

    updateGeminiStatusUI();
    showToast(`Connected to ${result.workingModel}!`);
  } catch (err) {
    if (statusDiv) {
      statusDiv.innerHTML = `<span style="color: #ef4444;">Connection failed: ${err.message}</span>`;
    }
  }
}

function buildFinlySystemContext() {
  const user = getAuthUser();
  const userName = user?.name || 'User';
  const userCurrency = user?.currency || 'INR';

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netBalance = totalIncome - totalExpense;
  const recentTx = transactions.slice(0, 6).map(t => `- ${t.date}: ${t.desc} (${t.cat}) -> ${t.amount > 0 ? '+' : '-'}₹${Math.abs(t.amount)}`).join('\n');

  const budgetSummary = (budgets && budgets.length > 0)
    ? budgets.map(b => `${b.category} (₹${b.limit} limit, spent ₹${b.spent || 0})`).join(', ')
    : 'Food (₹10,000), Shopping (₹8,000), Utilities (₹5,000)';

  const emiSummary = (emis && emis.length > 0)
    ? emis.map(e => `${e.name} (₹${e.amount}/mo, ${e.dueDay || 'monthly'})`).join(', ')
    : 'None';

  const loanSummary = (loans && loans.length > 0)
    ? loans.map(l => `${l.loanName} (₹${l.principalAmount} balance, EMI ₹${l.monthlyEmi}/mo)`).join(', ')
    : 'None';

  return `You are Macwatis Co-Pilot, an intelligent, friendly, and precise personal finance advisor integrated directly into the Macwatis dashboard.
User details: ${userName} | Currency: ${userCurrency} (₹)
Current Live Dashboard Snapshot:
- Net Savings / Balance: ₹${netBalance.toLocaleString('en-IN')}
- Total Monthly Income: ₹${totalIncome.toLocaleString('en-IN')}
- Total Monthly Expenses: ₹${totalExpense.toLocaleString('en-IN')}
- Category Budgets: ${budgetSummary}
- Active EMIs: ${emiSummary}
- Active Loans: ${loanSummary}
- Recent Dashboard Transactions:
${recentTx}

Instructions:
1. Provide concise, smart financial insights using clean markdown formatting (bold amounts and key terms, short bullet points). You have real-time access to the user's dashboard data shown above.
2. If the user mentions spending money, buying something, or receiving income (e.g. "Spent 450 on groceries", "Paid wifi 999", "Freelance bonus 15000"), you MUST formulate a conversational reply AND append this exact action token at the end:
[MACWATIS_ACTION: {"action":"add_transaction","desc":"description","amount":-450,"cat":"Food","type":"expense"}]
(Note: Use negative amount for expense, positive for income. Valid categories: Food, Shopping, Utilities, Travel, Income).
3. If analyzing an uploaded receipt/bill, extract the merchant name, total amount, category, and date, summarize it politely, and include the [MACWATIS_ACTION: ...] token so it's logged automatically into the dashboard and backend.`;
}

function formatAiMarkdown(text) {
  if (!text) return '';
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 4px;border-radius:4px;font-size:12px;">$1</code>');

  const lines = formatted.split('\n');
  let inList = false;
  let html = '';

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${trimmed.substring(2)}</li>`;
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (!inList) {
        html += '<ol>';
        inList = true;
      }
      html += `<li>${trimmed.replace(/^\d+\.\s/, '')}</li>`;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      if (trimmed.length > 0) {
        html += `<p>${trimmed}</p>`;
      }
    }
  }

  if (inList) html += '</ul>';
  return html;
}

// Handle Image Attachment State for Chat
let selectedAiImage = null;

function handleAiImageSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    selectedAiImage = {
      name: file.name,
      mimeType: file.type,
      base64: event.target.result.split(',')[1]
    };

    const previewContainer = document.getElementById('ai-image-preview-container');
    const previewName = document.getElementById('ai-image-name');
    if (previewContainer && previewName) {
      previewName.textContent = file.name;
      previewContainer.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
}

function removeAiImagePreview() {
  selectedAiImage = null;
  const input = document.getElementById('ai-image-input');
  if (input) input.value = '';
  const previewContainer = document.getElementById('ai-image-preview-container');
  if (previewContainer) previewContainer.style.display = 'none';
}

// Multi-turn conversation history memory & persistent chat storage
let aiChatHistory = [];
const CHAT_STORE_KEY = 'macwatis_chat_messages';

function getSavedChatMessages() {
  try {
    const raw = localStorage.getItem(CHAT_STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveChatMessage(role, content, html = null) {
  const saved = getSavedChatMessages();
  saved.push({
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    role, // 'user' | 'ai'
    content,
    html: html || formatAiMarkdown(content),
    timestamp: Date.now()
  });
  if (saved.length > 50) saved.shift(); // Keep last 50 messages
  localStorage.setItem(CHAT_STORE_KEY, JSON.stringify(saved));
}

function renderSavedChatHistory() {
  const saved = getSavedChatMessages();
  const heroEmpty = document.getElementById('ai-hero-empty');
  const stream = document.getElementById('chat-messages-stream');
  if (!stream) return;

  if (saved.length === 0) {
    stream.innerHTML = '';
    stream.style.display = 'none';
    if (heroEmpty) heroEmpty.style.display = 'flex';
    return;
  }

  if (heroEmpty) heroEmpty.style.display = 'none';
  stream.style.display = 'flex';
  stream.innerHTML = '';

  saved.forEach(msg => {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${msg.role === 'user' ? 'user' : 'ai'}`;
    bubble.innerHTML = msg.html || formatAiMarkdown(msg.content || '');
    stream.appendChild(bubble);
  });

  const chatBody = document.getElementById('ai-chat-body');
  if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
}

function clearAiChat() {
  aiChatHistory = [];
  localStorage.removeItem(CHAT_STORE_KEY);
  const stream = document.getElementById('chat-messages-stream');
  const hero = document.getElementById('ai-hero-empty');
  if (stream) {
    stream.innerHTML = '';
    stream.style.display = 'none';
  }
  if (hero) hero.style.display = 'flex';
  removeAiImagePreview();
  showToast('Chat history cleared');
}

// AI Assistant Handling
function sendQuickPrompt(text) {
  const input = document.getElementById('ai-prompt-input');
  if (input) {
    input.value = text;
    processAiPrompt(text);
  }
}

function handleAiPromptSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('ai-prompt-input');
  const text = input.value.trim();
  if (!text && !selectedAiImage) return;

  const promptText = text || 'Please analyze this attached receipt and log the expense.';
  processAiPrompt(promptText, selectedAiImage);
  input.value = '';
  removeAiImagePreview();
}

async function processAiPrompt(promptText, attachedImage = null) {
  const heroEmpty = document.getElementById('ai-hero-empty');
  const stream = document.getElementById('chat-messages-stream');
  
  if (heroEmpty) heroEmpty.style.display = 'none';
  if (stream) stream.style.display = 'flex';

  // Append user bubble & save to persistent storage
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  let userHtml = promptText;
  if (attachedImage) {
    userHtml = `<div style="font-size: 11px; opacity: 0.8; margin-bottom: 4px;"><i class="ti ti-photo"></i> [Attached: ${attachedImage.name}]</div>` + promptText;
  }
  userBubble.innerHTML = userHtml;
  stream.appendChild(userBubble);
  saveChatMessage('user', promptText, userHtml);

  // Append loading indicator
  const loadingBubble = document.createElement('div');
  loadingBubble.className = 'chat-bubble ai';
  loadingBubble.id = 'ai-active-loading';
  loadingBubble.innerHTML = `
    <div class="ai-typing-indicator">
      <div class="ai-typing-dot"></div>
      <div class="ai-typing-dot"></div>
      <div class="ai-typing-dot"></div>
    </div>
  `;
  stream.appendChild(loadingBubble);

  const chatBody = document.getElementById('ai-chat-body');
  if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;

  const apiKey = getGeminiApiKey();
  const model = getGeminiModel();

  if (!apiKey) {
    // Graceful offline fallback with key prompt
    setTimeout(() => {
      loadingBubble.remove();
      const aiBubble = document.createElement('div');
      aiBubble.className = 'chat-bubble ai';
      
      const lower = promptText.toLowerCase();
      let responseContent = '';
      if (lower.includes('spent') || lower.includes('expense') || lower.includes('groceries')) {
        const matchNum = promptText.match(/\d+/);
        const amt = matchNum ? parseInt(matchNum[0], 10) : 350;
        responseContent = `Logged <strong>₹${amt}</strong> for <strong>Groceries</strong> under Food. Remaining Food budget is ₹1,030.<br><br><small style="color:var(--text-secondary);"><i class="ti ti-info-circle"></i> Connect your Gemini API Key in Settings for live reasoning.</small>`;
        
        transactions.unshift({
          desc: 'Groceries (AI logged)',
          cat: 'Food',
          date: 'Today',
          amount: -amt,
          type: 'expense'
        });
        renderTransactions();
        updateDashboardRecentTransactions();
        showToast(`✨ Logged ₹${amt} expense under Food`);
      } else {
        responseContent = `To unlock real-time financial intelligence with Google Gemini, please configure your API key.<br><br>
        <button class="btn-ghost-sm" onclick="openModal('gemini-setup-modal')"><i class="ti ti-key"></i> Enter Gemini API Key</button>`;
      }

      aiBubble.innerHTML = responseContent;
      stream.appendChild(aiBubble);
      saveChatMessage('ai', '', responseContent);
      if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
    }, 500);
    return;
  }

  try {
    const userParts = [];
    if (attachedImage) {
      userParts.push({
        inlineData: {
          mimeType: attachedImage.mimeType,
          data: attachedImage.base64
        }
      });
    }
    userParts.push({ text: promptText });

    // Add user turn to conversation history
    aiChatHistory.push({ role: 'user', parts: userParts });

    // Keep history token-friendly (last 10 turns)
    if (aiChatHistory.length > 10) {
      aiChatHistory = aiChatHistory.slice(aiChatHistory.length - 10);
    }

    const result = await callGeminiApiUniversal({
      apiKey,
      preferredModel: model,
      contents: aiChatHistory,
      systemText: buildFinlySystemContext(),
      maxTokens: 800,
      temperature: 0.7
    });

    loadingBubble.remove();

    const candidate = result.data.candidates?.[0];
    let rawText = candidate?.content?.parts?.[0]?.text || "I couldn't process that response.";

    // Append model response to conversation history
    aiChatHistory.push({ role: 'model', parts: [{ text: rawText }] });

    // Parse and handle action tags if present
    const actionRegex = /\[(?:MACWATIS|FINLY)_ACTION:\s*(\{.*?\})\s*\]/s;
    const match = rawText.match(actionRegex);

    if (match) {
      try {
        const actionData = JSON.parse(match[1]);
        if (actionData.action === 'add_transaction') {
          const rawAmt = Math.abs(parseFloat(actionData.amount) || 0);
          const isExpense = actionData.type === 'expense' || actionData.amount < 0;
          const finalAmt = isExpense ? -rawAmt : rawAmt;
          
          const newTx = {
            desc: actionData.desc || 'AI Logged Entry',
            cat: actionData.cat || 'Food',
            date: 'Today',
            amount: finalAmt,
            type: isExpense ? 'expense' : 'income'
          };

          transactions.unshift(newTx);
          renderTransactions();
          updateDashboardRecentTransactions();
          showToast(`✨ Logged ${isExpense ? '-₹' : '+₹'}${rawAmt} for ${actionData.desc}`);

          // Sync AI transaction to Backend API
          const token = getAuthToken();
          if (token) {
            fetch(`${BACKEND_API_URL}/transactions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                title: newTx.desc,
                type: newTx.type,
                category: newTx.cat,
                amount: rawAmt,
                paymentMethod: 'UPI'
              })
            }).catch(e => console.log('AI transaction sync:', e.message));
          }
        }
      } catch (e) {
        console.warn('Could not parse Macwatis action:', e);
      }

      // Remove the raw action tag from the displayed text
      rawText = rawText.replace(actionRegex, '').trim();
    }

    const aiBubble = document.createElement('div');
    aiBubble.className = 'chat-bubble ai';
    const finalHtml = formatAiMarkdown(rawText);
    aiBubble.innerHTML = finalHtml;
    stream.appendChild(aiBubble);
    saveChatMessage('ai', rawText, finalHtml);

  } catch (err) {
    loadingBubble.remove();
    const errorBubble = document.createElement('div');
    errorBubble.className = 'chat-bubble ai';
    const errHtml = `<span style="color: #ef4444;"><i class="ti ti-alert-triangle"></i> Gemini API Error: ${err.message}</span><br><br><button class="btn-ghost-sm" onclick="openModal('gemini-setup-modal')"><i class="ti ti-key"></i> Reconfigure API Key</button>`;
    errorBubble.innerHTML = errHtml;
    stream.appendChild(errorBubble);
  }

  if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
}

// Receipt Scanning directly in Add Transaction Modal
function handleModalReceiptScan(e) {
  const file = e.target.files[0];
  if (!file) return;

  const apiKey = getGeminiApiKey();
  const model = getGeminiModel();

  if (!apiKey) {
    openModal('gemini-setup-modal');
    showToast('Please set your Gemini API key first to use Receipt OCR');
    return;
  }

  showToast('🔍 Analyzing receipt with Gemini Vision...');

  const reader = new FileReader();
  reader.onload = async (event) => {
    const base64Data = event.target.result.split(',')[1];
    try {
      const result = await callGeminiApiUniversal({
        apiKey,
        preferredModel: model,
        contents: [{
          role: 'user',
          parts: [
            {
              text: `Analyze this receipt image and return ONLY a valid JSON object with these exact keys:
{
  "desc": "Short merchant or item name",
  "amount": numeric_total_amount_without_currency_symbol,
  "cat": "One of: Food, Shopping, Utilities, Travel, Income",
  "type": "expense"
}`
            },
            {
              inlineData: {
                mimeType: file.type,
                data: base64Data
              }
            }
          ]
        }],
        maxTokens: 250,
        temperature: 0.1
      });

      const text = result.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.desc) document.getElementById('tx-desc').value = parsed.desc;
        if (parsed.amount) document.getElementById('tx-amount').value = parsed.amount;
        if (parsed.cat) document.getElementById('tx-cat').value = parsed.cat;
        if (parsed.type) document.getElementById('tx-type').value = parsed.type;

        showToast('✅ Receipt details auto-filled by Gemini!');
      }
    } catch (err) {
      showToast('❌ Could not scan receipt: ' + err.message);
    }
  };
  reader.readAsDataURL(file);
}

// ==========================================
// BACKEND API & MONGODB CONTROLLER
// ==========================================
const BACKEND_API_URL = (window.location.port === '5001' ? window.location.origin : 'http://localhost:5001') + '/api';
const AUTH_TOKEN_KEY = 'finly_auth_token';
const AUTH_USER_KEY = 'finly_user';

let currentAuthMode = 'login'; // 'login' | 'register'

function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

function getAuthUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function checkBackendHealth() {
  const statusBadge = document.getElementById('backend-status-badge');
  const statusDot = document.getElementById('backend-status-dot');
  const statusText = document.getElementById('backend-status-text');
  const settingsServer = document.getElementById('settings-backend-server');
  const settingsDb = document.getElementById('settings-db-status');

  try {
    const res = await fetch(`${BACKEND_API_URL}/health`);
    const data = await res.json();
    if (res.ok && data.status === 'ok') {
      if (statusBadge) {
        statusBadge.style.background = 'rgba(16, 185, 129, 0.12)';
        statusBadge.style.color = '#10b981';
        statusBadge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      }
      if (statusDot) statusDot.style.background = '#10b981';
      if (statusText) statusText.textContent = data.dbConnected ? 'MongoDB Online' : 'Backend Online (Ready)';
      if (settingsServer) settingsServer.textContent = `Online (Port ${data.port || 5001})`;
      if (settingsDb) settingsDb.textContent = data.database || (data.dbConnected ? 'MongoDB Connected' : 'In-Memory Store');
      return true;
    }
  } catch (err) {
    if (statusBadge) {
      statusBadge.style.background = 'rgba(239, 68, 68, 0.12)';
      statusBadge.style.color = '#ef4444';
      statusBadge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    }
    if (statusDot) statusDot.style.background = '#ef4444';
    if (statusText) statusText.textContent = 'Backend Offline';
    if (settingsServer) settingsServer.textContent = 'Offline (Port 5001)';
    if (settingsDb) settingsDb.textContent = 'Disconnected';
    return false;
  }
}

function switchAuthTab(mode) {
  currentAuthMode = mode;
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const nameGroup = document.getElementById('auth-name-group');
  const nameInput = document.getElementById('auth-name');
  const heading = document.getElementById('auth-modal-heading');
  const subheading = document.getElementById('auth-modal-subheading');
  const submitBtnText = document.getElementById('auth-submit-btn-text');
  const footerPrompt = document.getElementById('auth-footer-prompt');
  const footerLink = document.getElementById('auth-footer-link');
  const alertBox = document.getElementById('auth-alert-box');

  if (alertBox) alertBox.style.display = 'none';

  if (mode === 'register') {
    if (tabLogin) tabLogin.classList.remove('active');
    if (tabRegister) tabRegister.classList.add('active');
    if (nameGroup) nameGroup.style.display = 'block';
    if (nameInput) nameInput.required = true;
    if (heading) heading.textContent = 'Create an Account';
    if (submitBtnText) submitBtnText.textContent = 'Create Account';
    if (footerPrompt) footerPrompt.textContent = 'Already have an account?';
    if (footerLink) footerLink.textContent = 'Sign in';
  } else {
    if (tabRegister) tabRegister.classList.remove('active');
    if (tabLogin) tabLogin.classList.add('active');
    if (nameGroup) nameGroup.style.display = 'none';
    if (nameInput) nameInput.required = false;
    if (heading) heading.textContent = 'Sign In';
    if (submitBtnText) submitBtnText.textContent = 'Sign In';
    if (footerPrompt) footerPrompt.textContent = "Don't have an account yet?";
    if (footerLink) footerLink.textContent = 'Create account';
  }
}

function toggleAuthMode() {
  switchAuthTab(currentAuthMode === 'login' ? 'register' : 'login');
}

function showAuthAlert(message, type = 'error') {
  if (type === 'success') return; // Suppress success notification popups
  const alertBox = document.getElementById('auth-alert-box');
  if (!alertBox) return;
  alertBox.className = `auth-alert ${type}`;
  alertBox.textContent = message;
  alertBox.style.display = 'block';
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const alertBox = document.getElementById('auth-alert-box');
  if (alertBox) alertBox.style.display = 'none';

  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const name = document.getElementById('auth-name')?.value.trim();

  const isRegister = currentAuthMode === 'register';
  const endpoint = `${BACKEND_API_URL}/auth/${isRegister ? 'register' : 'login'}`;
  const payload = isRegister ? { name, email, password } : { email, password };

  const submitBtn = document.getElementById('auth-submit-btn');
  const submitBtnText = document.getElementById('auth-submit-btn-text');
  const originalText = submitBtnText ? submitBtnText.textContent : 'Submit';

  if (submitBtn) submitBtn.disabled = true;
  if (submitBtnText) submitBtnText.innerHTML = `<i class="ti ti-loader"></i> Processing...`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Authentication failed');
    }

    // Save token and user details in localStorage
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

    showAuthAlert(isRegister ? 'Account created! Entering Macwatis...' : 'Welcome back! Entering Macwatis...', 'success');
    
    setTimeout(() => {
      updateAuthUI();
      checkBackendHealth();
      showToast(`Welcome, ${data.user.name}!`);
      // Sync user data
      fetchTransactionsFromBackend();
      fetchBudgetsFromBackend();
      fetchLoansFromBackend();
    }, 450);

  } catch (err) {
    showAuthAlert(err.message || 'Unable to connect to backend on port 5001.');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (submitBtnText) submitBtnText.textContent = originalText;
  }
}

function autoFillTestUser() {
  const emailInput = document.getElementById('auth-email');
  const passInput = document.getElementById('auth-password');
  const nameInput = document.getElementById('auth-name');
  if (emailInput) emailInput.value = 'alex@example.com';
  if (passInput) passInput.value = 'password123';
  if (nameInput) nameInput.value = 'Alex Morgan';
}

async function handleLogout() {
  const token = getAuthToken();
  if (token) {
    try {
      await fetch(`${BACKEND_API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (e) {
      console.log('Backend logout call:', e.message);
    }
  }

  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  
  // Clear any auth form inputs
  const emailInput = document.getElementById('auth-email');
  const passInput = document.getElementById('auth-password');
  const nameInput = document.getElementById('auth-name');
  if (emailInput) emailInput.value = '';
  if (passInput) passInput.value = '';
  if (nameInput) nameInput.value = '';

  updateAuthUI();
  showToast('Signed out successfully.');
}

function handleUserProfileClick() {
  handleLogout();
}

function handleSettingsAuthBtnClick() {
  const token = getAuthToken();
  if (token) {
    handleLogout();
  } else {
    updateAuthUI();
  }
}

function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else if (hour >= 17 && hour < 22) {
    return 'Good evening';
  } else {
    return 'Good night';
  }
}

function updateAuthUI() {
  const user = getAuthUser();
  const token = getAuthToken();

  const authScreen = document.getElementById('auth-page-screen');
  const appContainer = document.getElementById('app-main-container');

  const sidebarAvatar = document.getElementById('sidebar-user-avatar');
  const sidebarName = document.getElementById('sidebar-user-name');
  const sidebarIcon = document.getElementById('sidebar-auth-icon');

  const settingsName = document.getElementById('settings-user-name');
  const settingsEmail = document.getElementById('settings-user-email');
  const settingsCurrency = document.getElementById('settings-user-currency');
  const settingsStatus = document.getElementById('settings-auth-status');
  const settingsBtnText = document.getElementById('settings-auth-btn-text');

  const greeting = getTimeBasedGreeting();

  if (token && user) {
    // 🔓 LOGGED IN: Reveal Main Dashboard & Hide Auth Screen
    if (authScreen) authScreen.style.display = 'none';
    if (appContainer) appContainer.style.display = 'flex';

    // Generate initials (e.g. "Alex Morgan" -> "AM")
    const initials = user.name
      ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
      : 'US';

    if (sidebarAvatar) sidebarAvatar.textContent = initials;
    if (sidebarName) sidebarName.textContent = user.name;
    if (sidebarIcon) {
      sidebarIcon.className = 'ti ti-logout';
      sidebarIcon.title = 'Click to Logout';
    }

    const greetingEl = document.getElementById('dashboard-greeting');
    if (greetingEl) {
      const firstName = user.name ? user.name.split(' ')[0] : 'User';
      greetingEl.textContent = `${greeting}, ${firstName}`;
    }

    if (settingsName) settingsName.textContent = user.name;
    if (settingsEmail) settingsEmail.textContent = user.email;
    if (settingsCurrency) settingsCurrency.textContent = `${user.currency || 'INR'} (₹)`;
    if (settingsStatus) {
      settingsStatus.innerHTML = `<span style="color: #10b981;">&#10004; Authenticated</span>`;
    }
    if (settingsBtnText) settingsBtnText.textContent = 'Sign Out';

  } else {
    // 🔒 NOT LOGGED IN: Lock App & Show Full-Page Login
    if (appContainer) appContainer.style.display = 'none';
    if (authScreen) authScreen.style.display = 'flex';

    const greetingEl = document.getElementById('dashboard-greeting');
    if (greetingEl) greetingEl.textContent = greeting;

    if (sidebarName) sidebarName.textContent = 'Guest';
    if (sidebarAvatar) sidebarAvatar.textContent = 'G';

    if (settingsName) settingsName.textContent = 'Guest User';
    if (settingsEmail) settingsEmail.textContent = 'Not logged in';
    if (settingsStatus) {
      settingsStatus.innerHTML = `<span style="color: #94a3b8;">Guest / Offline</span>`;
    }
    if (settingsBtnText) settingsBtnText.textContent = 'Sign In';

    if (sidebarIcon) {
      sidebarIcon.className = 'ti ti-login';
      sidebarIcon.title = 'Click to Sign In';
    }
  }
}

async function checkAuthSession() {
  const token = getAuthToken();
  if (!token) {
    updateAuthUI();
    return;
  }

  try {
    const res = await fetch(`${BACKEND_API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    } else {
      // Token expired or invalid
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch (err) {
    console.log('Backend server check on startup:', err.message);
  }

  updateAuthUI();
}

// ==========================================
// BUDGETS CONTROLLER
// ==========================================
let budgets = [
  { _id: 'bg_1', category: 'Food and dining', limit: 10000, spent: 8620 },
  { _id: 'bg_2', category: 'Travel', limit: 8000, spent: 3000 },
  { _id: 'bg_3', category: 'Shopping', limit: 8000, spent: 9200 },
  { _id: 'bg_4', category: 'Utilities', limit: 12000, spent: 5020 }
];

function renderBudgets() {
  const container = document.getElementById('budgets-container');
  if (!container) return;

  if (budgets.length === 0) {
    container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-secondary); font-size: 13px;">No category budgets set. Click "Set budget" above.</div>`;
    return;
  }

  container.innerHTML = budgets.map(b => {
    const spent = Number(b.spent || 0);
    const limit = Number(b.limit || 1);
    const pct = Math.min(Math.round((spent / limit) * 100), 100);
    const isOver = spent > limit;
    const fillClass = isOver ? 'progress-fill-danger' : (pct > 75 ? 'progress-fill-warning' : 'progress-fill-success');
    const overAmt = isOver ? (spent - limit) : 0;

    return `
      <div class="budget-item-card">
        <div class="budget-header">
          <span>${b.category}</span>
          <span style="${isOver ? 'color: var(--text-danger);' : 'color: var(--text-secondary);'}; font-weight: 500;">
            ₹${spent.toLocaleString('en-IN')} / ₹${limit.toLocaleString('en-IN')}
          </span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill ${fillClass}" style="width: ${pct}%;"></div>
        </div>
        ${isOver ? `<p class="over-budget-warning">₹${overAmt.toLocaleString('en-IN')} over budget</p>` : ''}
      </div>
    `;
  }).join('');
}

async function fetchBudgetsFromBackend() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const res = await fetch(`${BACKEND_API_URL}/budgets`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      budgets = data.data;
      renderBudgets();
    }
  } catch (err) {
    console.log('Using default budgets, backend:', err.message);
  }
}

async function handleAddBudget(e) {
  e.preventDefault();
  const category = document.getElementById('budget-category')?.value.trim();
  const limit = parseFloat(document.getElementById('budget-limit')?.value);

  if (!category || isNaN(limit) || limit <= 0) {
    showToast('Please enter a valid category name and limit');
    return;
  }

  const existingIdx = budgets.findIndex(b => b.category.toLowerCase() === category.toLowerCase());
  if (existingIdx !== -1) {
    budgets[existingIdx].limit = limit;
  } else {
    budgets.unshift({ _id: 'bg_' + Date.now(), category, limit, spent: 0 });
  }

  renderBudgets();
  closeModal('add-budget-modal');
  document.getElementById('form-add-budget')?.reset();
  showToast(`Budget for "${category}" saved!`);

  const token = getAuthToken();
  if (token) {
    try {
      await fetch(`${BACKEND_API_URL}/budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ category, limit })
      });
    } catch (err) {
      console.log('Budget saved locally, backend offline:', err.message);
    }
  }
}

// ==========================================
// LOANS & EMIS & FMEX CONTROLLER
// ==========================================
let loans = JSON.parse(localStorage.getItem('finly_loans') || 'null') || [
  { _id: 'ln_1', loanName: 'Car loan', principalAmount: 600000, interestRate: 7.2, tenureMonths: 36, monthlyEmi: 18580 }
];

let emis = JSON.parse(localStorage.getItem('finly_emis') || 'null') || [
  { _id: 'emi_1', name: 'Phone EMI', amount: 2100, dueDay: 'Due 18 Sep', installments: '8 of 12 installments paid' },
  { _id: 'emi_2', name: 'Laptop EMI', amount: 3400, dueDay: 'Due 22 Sep', installments: '4 of 10 installments paid' }
];

let fmex = JSON.parse(localStorage.getItem('finly_fmex') || 'null') || [
  { _id: 'fmex_1', name: 'House Rent', amount: 18000, dueDay: 'Due 1st of each month', subtitle: 'Direct Bank Transfer • Apartment 402' },
  { _id: 'fmex_2', name: 'OTT Subscriptions (Netflix, Prime)', amount: 650, dueDay: 'Due 15th of each month', subtitle: 'Credit Card Auto-debit' },
  { _id: 'fmex_3', name: 'Spotify Premium', amount: 300, dueDay: 'Due 20th of each month', subtitle: 'UPI AutoPay' }
];

// ─── LOANS LOGIC ───
function renderLoans() {
  const container = document.getElementById('loans-container');
  const statActive = document.getElementById('loans-stat-active');
  const statTotal = document.getElementById('loans-stat-total');
  const statMonthly = document.getElementById('loans-stat-monthly');

  // Dynamically update the Loan stats cards
  const totalPrincipal = loans.reduce((acc, l) => acc + Number(l.principalAmount || 0), 0);
  const totalMonthlyEmi = loans.reduce((acc, l) => acc + Number(l.monthlyEmi || Math.round((l.principalAmount || 0) / (l.tenureMonths || 12))), 0);

  if (statActive) statActive.textContent = loans.length;
  if (statTotal) statTotal.textContent = `₹${totalPrincipal.toLocaleString('en-IN')}`;
  if (statMonthly) statMonthly.textContent = `₹${totalMonthlyEmi.toLocaleString('en-IN')}`;

  if (!container) return;

  if (loans.length === 0) {
    container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-secondary); font-size: 13px;">No loans recorded yet. Click "Add loan" above.</div>`;
    return;
  }

  // Graphical lines (progress bars) completely removed per user request
  container.innerHTML = loans.map(l => {
    const principal = Number(l.principalAmount || 0);
    const emi = Number(l.monthlyEmi || Math.round(principal / (l.tenureMonths || 12)));
    return `
      <div class="budget-item-card" style="padding: 1.1rem 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div class="icon-badge">
              <i class="ti ti-receipt-2"></i>
            </div>
            <div>
              <p class="item-title" style="font-weight: 600; font-size: 14px;">${l.loanName || 'Loan'}</p>
              <p class="item-subtitle" style="color: var(--text-secondary); font-size: 12px; margin-top: 3px;">
                ${l.interestRate || 8}% interest • ${l.tenureMonths || 12} mo tenure • Monthly EMI: <strong>₹${emi.toLocaleString('en-IN')}</strong>
              </p>
            </div>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0;">₹${principal.toLocaleString('en-IN')}</p>
            <span style="font-size: 11px; color: var(--text-secondary);">Principal</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function fetchLoansFromBackend() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const res = await fetch(`${BACKEND_API_URL}/loans`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      loans = data.data;
      localStorage.setItem('finly_loans', JSON.stringify(loans));
      renderLoans();
    }
  } catch (err) {
    console.log('Using cached loans, backend:', err.message);
  }
}

async function handleAddLoan(e) {
  e.preventDefault();
  const loanName = document.getElementById('loan-name')?.value.trim();
  const principalAmount = parseFloat(document.getElementById('loan-principal')?.value);
  const interestRate = parseFloat(document.getElementById('loan-rate')?.value);
  const tenureMonths = parseInt(document.getElementById('loan-tenure')?.value) || 36;

  if (!loanName || isNaN(principalAmount) || isNaN(interestRate)) {
    showToast('Please fill out all loan details');
    return;
  }

  const p = principalAmount;
  const r = (interestRate / 12) / 100;
  const n = tenureMonths;
  const emi = r === 0 ? Math.round(p / n) : Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));

  const newLoan = {
    _id: 'ln_' + Date.now(),
    loanName,
    principalAmount: p,
    interestRate,
    tenureMonths: n,
    monthlyEmi: emi
  };

  loans.unshift(newLoan);
  localStorage.setItem('finly_loans', JSON.stringify(loans));
  renderLoans();
  closeModal('add-loan-modal');
  document.getElementById('form-add-loan')?.reset();
  showToast(`Loan "${loanName}" added successfully!`);

  const token = getAuthToken();
  if (token) {
    try {
      await fetch(`${BACKEND_API_URL}/loans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ loanName, principalAmount, interestRate, tenureMonths })
      });
    } catch (err) {
      console.log('Loan saved locally, backend offline:', err.message);
    }
  }
}

// ─── EMIS LOGIC ───
function renderEmis() {
  const container = document.getElementById('emis-container');
  const statCount = document.getElementById('emis-stat-count');
  const statTotal = document.getElementById('emis-stat-total');
  const statNext = document.getElementById('emis-stat-next');

  const totalEmi = emis.reduce((acc, item) => acc + Number(item.amount || 0), 0);

  if (statCount) statCount.textContent = emis.length;
  if (statTotal) statTotal.textContent = `₹${totalEmi.toLocaleString('en-IN')}`;
  if (statNext) statNext.textContent = emis[0]?.dueDay?.replace('Due ', '') || '18 Sep';

  if (!container) return;

  if (emis.length === 0) {
    container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-secondary); font-size: 13px;">No active EMIs found. Click "Add EMI" above.</div>`;
    return;
  }

  container.innerHTML = emis.map(item => `
    <div class="emi-item">
      <div class="item-left">
        <div class="icon-badge"><i class="ti ti-device-mobile"></i></div>
        <div>
          <p class="item-title">${item.name}</p>
          <p class="item-subtitle">${item.installments || 'Active installment'}</p>
        </div>
      </div>
      <div class="item-right">
        <p class="item-amount">₹${Number(item.amount).toLocaleString('en-IN')}/mo</p>
        <p class="item-date">${item.dueDay || 'Active'}</p>
      </div>
    </div>
  `).join('');
}

async function fetchEmisFromBackend() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const res = await fetch(`${BACKEND_API_URL}/emis`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      emis = data.data;
      localStorage.setItem('finly_emis', JSON.stringify(emis));
      renderEmis();
    }
  } catch (err) {
    console.log('Using cached EMIs, backend:', err.message);
  }
}

async function handleAddEMI(e) {
  e.preventDefault();
  const name = document.getElementById('emi-name')?.value.trim();
  const amount = parseFloat(document.getElementById('emi-amount')?.value);
  const dueDay = document.getElementById('emi-due-day')?.value.trim();

  if (!name || isNaN(amount)) {
    showToast('Please fill out product name and monthly EMI');
    return;
  }

  const newEmi = {
    _id: 'emi_' + Date.now(),
    name,
    amount,
    dueDay: dueDay ? `Due ${dueDay}` : 'Monthly payment',
    installments: 'Ongoing installment plan'
  };

  emis.unshift(newEmi);
  localStorage.setItem('finly_emis', JSON.stringify(emis));
  renderEmis();
  closeModal('add-emi-modal');
  document.getElementById('form-add-emi')?.reset();
  showToast(`EMI for "${name}" added and saved!`);

  const token = getAuthToken();
  if (token) {
    try {
      await fetch(`${BACKEND_API_URL}/emis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEmi)
      });
    } catch (err) {
      console.log('EMI saved in localStorage, backend offline:', err.message);
    }
  }
}

// ─── FIXED MONTHLY EXPENSES (FMEX) LOGIC ───
function renderFmex() {
  const container = document.getElementById('fmex-container');
  const statTotal = document.getElementById('fmex-stat-total');
  const statCount = document.getElementById('fmex-stat-count');
  const statNext = document.getElementById('fmex-stat-next');

  const total = fmex.reduce((acc, item) => acc + Number(item.amount || 0), 0);

  if (statTotal) statTotal.textContent = `₹${total.toLocaleString('en-IN')}/mo`;
  if (statCount) statCount.textContent = fmex.length;
  if (statNext) statNext.textContent = fmex[0]?.dueDay?.replace('Due ', '') || '1 Oct';

  if (!container) return;

  if (fmex.length === 0) {
    container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-secondary); font-size: 13px;">No fixed expenses set. Click "Add expense" above.</div>`;
    return;
  }

  container.innerHTML = fmex.map(item => `
    <div class="emi-item">
      <div class="item-left">
        <div class="icon-badge"><i class="ti ti-receipt"></i></div>
        <div>
          <p class="item-title">${item.name}</p>
          <p class="item-subtitle">${item.subtitle || 'Recurring monthly commitment'}</p>
        </div>
      </div>
      <div class="item-right">
        <p class="item-amount">₹${Number(item.amount).toLocaleString('en-IN')}/mo</p>
        <p class="item-date">${item.dueDay || 'Recurring'}</p>
      </div>
    </div>
  `).join('');
}

async function fetchFmexFromBackend() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const res = await fetch(`${BACKEND_API_URL}/fmex`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      fmex = data.data;
      localStorage.setItem('finly_fmex', JSON.stringify(fmex));
      renderFmex();
    }
  } catch (err) {
    console.log('Using cached FMEX, backend:', err.message);
  }
}

async function handleAddFMEX(e) {
  e.preventDefault();
  const name = document.getElementById('fmex-name')?.value.trim();
  const amount = parseFloat(document.getElementById('fmex-amount')?.value);
  const due = document.getElementById('fmex-due')?.value.trim();

  if (!name || isNaN(amount)) {
    showToast('Please fill out expense name and amount');
    return;
  }

  const newItem = {
    _id: 'fmex_' + Date.now(),
    name,
    amount,
    dueDay: due ? `Due ${due}` : 'Monthly',
    subtitle: 'Recurring commitment'
  };

  fmex.unshift(newItem);
  localStorage.setItem('finly_fmex', JSON.stringify(fmex));
  renderFmex();
  closeModal('add-fmex-modal');
  document.getElementById('form-add-fmex')?.reset();
  showToast(`Fixed expense "${name}" saved!`);

  const token = getAuthToken();
  if (token) {
    try {
      await fetch(`${BACKEND_API_URL}/fmex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newItem)
      });
    } catch (err) {
      console.log('FMEX saved in localStorage, backend offline:', err.message);
    }
  }
}

// Initial render setup
window.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  renderTransactions();
  renderBudgets();
  renderLoans();
  renderEmis();
  renderFmex();
  updateDashboardRecentTransactions();
  updateGeminiStatusUI();
  checkBackendHealth();
  checkAuthSession();

  // Load user data if logged in
  if (getAuthToken()) {
    fetchTransactionsFromBackend();
    fetchBudgetsFromBackend();
    fetchLoansFromBackend();
    fetchEmisFromBackend();
    fetchFmexFromBackend();
  }

  // Periodic health check
  setInterval(checkBackendHealth, 15000);
});

