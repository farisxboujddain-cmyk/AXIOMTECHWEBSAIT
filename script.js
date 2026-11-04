const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const hub = document.createElement('section');
hub.className = 'ai-hub-section';
hub.id = 'ai-hub';
hub.innerHTML = `
  <div class="ai-hub-wrap">
    <div class="ai-hub-heading">
      <div>
        <div class="eyebrow"><span class="eyebrow-line"></span> AXIOMTECH AI HUB</div>
        <h2>One space.<br><span class="muted-heading">Many ways to think.</span></h2>
      </div>
      <p>Explore AI tools for conversation, research, writing, coding and creativity. Start with free access where available.</p>
    </div>
    <div class="ai-hub-notice"><span class="notice-dot"></span><span><strong>Free-first directory</strong> — these tools open on their own websites. Free plans, limits and sign-in requirements are set by each provider and may change.</span></div>
    <div class="ai-hub-controls">
      <label class="ai-search-label" for="ai-search">Find a tool</label>
      <input id="ai-search" class="ai-search" type="search" placeholder="Search tools or tasks…" autocomplete="off">
      <div class="ai-filters" role="group" aria-label="Filter AI tools">
        <button class="ai-filter active" data-filter="all" type="button">All tools</button>
        <button class="ai-filter" data-filter="chat" type="button">Chat & research</button>
        <button class="ai-filter" data-filter="create" type="button">Create</button>
        <button class="ai-filter" data-filter="code" type="button">Coding</button>
      </div>
    </div>
    <div class="ai-tools-grid" id="ai-tools-grid">
      <article class="ai-tool-card" data-category="chat" data-search="chatgpt openai assistant writing questions">
        <span class="ai-tool-type">01 / GENERAL AI</span><h3>ChatGPT</h3><p>Ask questions, brainstorm, summarize and work through ideas.</p><a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Open ChatGPT ↗</a>
      </article>
      <article class="ai-tool-card" data-category="chat" data-search="gemini google research assistant multimodal">
        <span class="ai-tool-type">02 / GENERAL AI</span><h3>Google Gemini</h3><p>Explore ideas, understand information and work with Google's AI assistant.</p><a href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer">Open Gemini ↗</a>
      </article>
      <article class="ai-tool-card" data-category="chat" data-search="perplexity research web sources search">
        <span class="ai-tool-type">03 / RESEARCH</span><h3>Perplexity</h3><p>Research topics and explore answers with linked sources.</p><a href="https://www.perplexity.ai/" target="_blank" rel="noopener noreferrer">Open Perplexity ↗</a>
      </article>
      <article class="ai-tool-card" data-category="chat" data-search="copilot microsoft assistant productivity">
        <span class="ai-tool-type">04 / ASSISTANT</span><h3>Microsoft Copilot</h3><p>Get help with everyday questions, planning and creative tasks.</p><a href="https://copilot.microsoft.com/" target="_blank" rel="noopener noreferrer">Open Copilot ↗</a>
      </article>
      <article class="ai-tool-card" data-category="code" data-search="hugging face spaces open models demos coding">
        <span class="ai-tool-type">05 / OPEN MODELS</span><h3>Hugging Face</h3><p>Discover community AI models and interactive demos in one place.</p><a href="https://huggingface.co/spaces" target="_blank" rel="noopener noreferrer">Explore Spaces ↗</a>
      </article>
      <article class="ai-tool-card" data-category="code" data-search="github copilot coding developer code">
        <span class="ai-tool-type">06 / DEVELOPMENT</span><h3>GitHub Copilot</h3><p>Explore AI-assisted coding tools and developer workflows.</p><a href="https://github.com/features/copilot" target="_blank" rel="noopener noreferrer">Explore Copilot ↗</a>
      </article>
      <article class="ai-tool-card" data-category="create" data-search="Canva design images presentations visual">
        <span class="ai-tool-type">07 / DESIGN</span><h3>Canva AI</h3><p>Experiment with AI-assisted design, layouts and visual content.</p><a href="https://www.canva.com/ai/" target="_blank" rel="noopener noreferrer">Explore Canva AI ↗</a>
      </article>
      <article class="ai-tool-card" data-category="create" data-search="Adobe Firefly image generation creative">
        <span class="ai-tool-type">08 / IMAGE</span><h3>Adobe Firefly</h3><p>Explore image and creative-generation features from Adobe.</p><a href="https://firefly.adobe.com/" target="_blank" rel="noopener noreferrer">Open Firefly ↗</a>
      </article>
    </div>
    <p class="ai-empty" id="ai-empty" hidden>No matching tools. Try another search.</p>
    <div class="prompt-lab">
      <div><div class="eyebrow"><span class="eyebrow-line"></span> PROMPT LAB</div><h3>Start with a better prompt.</h3><p>Build a clear prompt and copy it into the AI tool you choose.</p></div>
      <div class="prompt-form">
        <label for="prompt-task">What do you want the AI to do?</label>
        <input id="prompt-task" type="text" placeholder="e.g. Plan a simple business website">
        <label for="prompt-context">Add useful context (optional)</label>
        <textarea id="prompt-context" rows="3" placeholder="Audience, goals, style or constraints…"></textarea>
        <div class="prompt-actions"><button id="make-prompt" type="button">Build prompt</button><button id="copy-prompt" type="button" class="copy-button" disabled>Copy prompt</button></div>
        <p id="prompt-status" class="prompt-status" aria-live="polite">Your prompt will appear here after you build it.</p>
        <textarea id="prompt-output" rows="5" readonly aria-label="Generated prompt" placeholder="Your ready-to-use prompt…"></textarea>
      </div>
    </div>
    <p class="ai-disclaimer">AXIOMTECH provides this directory as a discovery interface. AI services are operated by their respective providers. Check each provider's age rules, privacy terms, availability and pricing before use. Do not enter passwords, private documents or sensitive personal information into public AI tools.</p>
  </div>`;
const main = document.querySelector('main');
const footer = document.querySelector('footer');
if (main && footer) main.insertBefore(hub, footer);
const mainNav = document.querySelector('.nav');
if (mainNav && !mainNav.querySelector('[href="#ai-hub"]')) {
  const link = document.createElement('a');
  link.href = '#ai-hub';
  link.textContent = 'AI Hub';
  mainNav.insertBefore(link, mainNav.firstChild);
}
const search = document.querySelector('#ai-search');
const filters = [...document.querySelectorAll('.ai-filter')];
const cards = [...document.querySelectorAll('.ai-tool-card')];
let activeFilter = 'all';
function filterTools() {
  const term = (search?.value || '').trim().toLowerCase();
  let visible = 0;
  cards.forEach(card => {
    const matchesCategory = activeFilter === 'all' || card.dataset.category === activeFilter;
    const matchesSearch = !term || (card.dataset.search + ' ' + card.innerText).toLowerCase().includes(term);
    card.hidden = !(matchesCategory && matchesSearch);
    if (!card.hidden) visible++;
  });
  const empty = document.querySelector('#ai-empty');
  if (empty) empty.hidden = visible !== 0;
}
search?.addEventListener('input', filterTools);
filters.forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  filters.forEach(item => item.classList.toggle('active', item === button));
  filterTools();
}));
const task = document.querySelector('#prompt-task');
const context = document.querySelector('#prompt-context');
const output = document.querySelector('#prompt-output');
const copy = document.querySelector('#copy-prompt');
const status = document.querySelector('#prompt-status');
document.querySelector('#make-prompt')?.addEventListener('click', () => {
  const goal = task?.value.trim();
  if (!goal) {
    status.textContent = 'Please describe what you want the AI to do first.';
    task?.focus();
    return;
  }
  output.value = 'Act as a helpful expert. Your task: ' + goal + (context?.value.trim() ? '\\n\\nContext: ' + context.value.trim() : '') + '\\n\\nGive a clear, accurate and well-structured response. If information is uncertain, say so. Ask one focused question if essential information is missing.';
  copy.disabled = false;
  status.textContent = 'Your prompt is ready to copy.';
});
copy?.addEventListener('click', async () => {
  if (!output?.value) return;
  try {
    await navigator.clipboard.writeText(output.value);
    status.textContent = 'Prompt copied. Paste it into your chosen AI tool.';
  } catch {
    output.select();
    status.textContent = 'Select the text above and copy it manually.';
  }
});
