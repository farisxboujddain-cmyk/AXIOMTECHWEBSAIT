import { useEffect, useMemo, useState } from 'react';
import { Bot, Check, ChevronDown, Copy, LoaderCircle, MessageSquarePlus, Send, Sparkles, User, Cloud, Laptop } from 'lucide-react';
import './chat.css';

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type Model = { id: string; name: string };
type Provider = 'cloud' | 'local';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const DEFAULT_OLLAMA_URL = 'http://localhost:11434';

export default function ChatWorkspace() {
  const [provider, setProvider] = useState<Provider>('cloud');
  const [cloudModels, setCloudModels] = useState<Model[]>([{ id: 'openrouter/free', name: 'Auto · Free model' }]);
  const [localModels, setLocalModels] = useState<Model[]>([]);
  const [model, setModel] = useState('openrouter/free');
  const [ollamaUrl, setOllamaUrl] = useState(() => {
    try { return localStorage.getItem('axiomtech-ollama-url') || DEFAULT_OLLAMA_URL; }
    catch { return DEFAULT_OLLAMA_URL; }
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(-1);

  useEffect(() => {
    if (!API_BASE) return;
    const controller = new AbortController();
    setModelsLoading(true);
    fetch(API_BASE + '/api/models', { signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load cloud models.');
        if (Array.isArray(data.models)) {
          const available = [{ id: 'openrouter/free', name: 'Auto · Free model' }, ...data.models];
          setCloudModels(available);
          setModel(current => available.some(item => item.id === current) ? current : 'openrouter/free');
        }
      })
      .catch(reason => {
        if (reason.name !== 'AbortError') setError('Cloud model list is unavailable. Check the Vercel API connection.');
      })
      .finally(() => setModelsLoading(false));
    return () => controller.abort();
  }, []);

  const activeModels = provider === 'cloud' ? cloudModels : localModels;
  const canSend = useMemo(() => Boolean(draft.trim()) && !loading, [draft, loading]);

  async function loadLocalModels(endpoint = ollamaUrl) {
    const base = endpoint.trim().replace(/\/$/, '');
    if (!base) { setError('Enter the Ollama address first.'); return; }
    setModelsLoading(true);
    setError('');
    try {
      const response = await fetch(base + '/api/tags');
      const data = await response.json() as { models?: Array<{ name?: string; model?: string }> };
      if (!response.ok || !Array.isArray(data.models)) throw new Error('Ollama did not return a model list.');
      const available = data.models
        .map(item => ({ id: item.name || item.model || '', name: item.name || item.model || '' }))
        .filter(item => item.id);
      setLocalModels(available);
      if (available.length) setModel(available[0].id);
      else setError('Ollama is connected, but no models are installed yet.');
    } catch {
      setError('Cannot reach Ollama. Make sure Ollama is running, a model is installed, and browser access is allowed for this site.');
      setLocalModels([]);
    } finally {
      setModelsLoading(false);
    }
  }

  function chooseProvider(next: Provider) {
    setProvider(next);
    setError('');
    if (next === 'cloud') {
      setModel(current => cloudModels.some(item => item.id === current) ? current : 'openrouter/free');
    } else if (!localModels.length) {
      void loadLocalModels();
    } else {
      setModel(localModels[0].id);
    }
  }

  async function sendMessage() {
    const content = draft.trim();
    if (!content || loading) return;
    if (provider === 'cloud' && !API_BASE) {
      setError('Cloud AI is not connected. Configure VITE_API_BASE_URL in the site build settings.');
      return;
    }
    if (provider === 'local' && !localModels.some(item => item.id === model)) {
      setError('Connect Ollama and select an installed local model first.');
      return;
    }
    const conversation = [...messages, { role: 'user' as const, content }];
    setMessages(conversation);
    setDraft('');
    setError('');
    setLoading(true);
    try {
      let reply = '';
      if (provider === 'cloud') {
        const response = await fetch(API_BASE + '/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages: conversation }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'The cloud AI request could not be completed.');
        if (typeof data.reply !== 'string') throw new Error('The cloud model returned an empty response.');
        reply = data.reply;
      } else {
        const response = await fetch(ollamaUrl.trim().replace(/\/$/, '') + '/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages: conversation, stream: false }),
        });
        const data = await response.json() as { message?: { content?: string }; error?: string };
        if (!response.ok) throw new Error(data.error || 'The local model request failed.');
        if (typeof data.message?.content !== 'string') throw new Error('The local model returned an empty response.');
        reply = data.message.content;
      }
      setMessages([...conversation, { role: 'assistant', content: reply }]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function copyMessage(content: string, index: number) {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(index);
      window.setTimeout(() => setCopied(-1), 1800);
    } catch {
      setError('Clipboard access is unavailable in this browser.');
    }
  }

  function startNewChat() {
    setMessages([]);
    setError('');
    setDraft('');
  }

  function saveOllamaUrl(value: string) {
    setOllamaUrl(value);
    try { localStorage.setItem('axiomtech-ollama-url', value); } catch { /* Storage is optional. */ }
  }

  return (
    <section className="ai-chat-section" id="ai-chat">
      <div className="ai-chat-heading">
        <div>
          <div className="eyebrow"><span className="ai-chat-dot" /> HYBRID AI WORKSPACE</div>
          <h2>AI Chat <em>workspace.</em></h2>
          <p>Switch between hosted free models and models running on your own computer.</p>
        </div>
        <button className="ai-new-chat" onClick={startNewChat}><MessageSquarePlus size={15} /> New chat</button>
      </div>

      <div className="ai-provider-switch" role="group" aria-label="AI provider">
        <button className={provider === 'cloud' ? 'selected' : ''} onClick={() => chooseProvider('cloud')}><Cloud size={15} /> Cloud AI <small>OpenRouter</small></button>
        <button className={provider === 'local' ? 'selected' : ''} onClick={() => chooseProvider('local')}><Laptop size={15} /> Local AI <small>Ollama</small></button>
      </div>

      {provider === 'local' && (
        <div className="ai-local-settings">
          <label htmlFor="ollama-url">OLLAMA ADDRESS</label>
          <input id="ollama-url" value={ollamaUrl} onChange={event => saveOllamaUrl(event.target.value)} onBlur={() => { if (ollamaUrl.trim()) void loadLocalModels(); }} placeholder={DEFAULT_OLLAMA_URL} />
          <button onClick={() => void loadLocalModels()} disabled={modelsLoading}>{modelsLoading ? <LoaderCircle size={14} /> : 'Connect & refresh'}</button>
          <small>Runs on your computer. Ollama must be installed and running.</small>
        </div>
      )}

      <div className="ai-model-bar">
        <label htmlFor="ai-model-select">MODEL</label>
        <div className="ai-model-select-wrap">
          <Sparkles size={14} />
          <select id="ai-model-select" value={model} onChange={event => setModel(event.target.value)}>
            {activeModels.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
          <ChevronDown size={13} />
        </div>
        <span>{modelsLoading ? 'Loading models…' : provider === 'cloud' ? 'Free cloud routes · Availability may vary' : localModels.length ? localModels.length + ' local model(s) found' : 'No local models connected'}</span>
      </div>

      <div className="ai-chat-window" aria-live="polite">
        {messages.length === 0 ? (
          <div className="ai-chat-empty">
            <div className="ai-chat-orb"><Bot size={29} /></div>
            <h3>What would you like to explore?</h3>
            <p>{provider === 'cloud' ? 'Send a prompt to a free hosted model.' : 'Send a prompt to a model running on your computer.'}</p>
            <div className="ai-chat-suggestions">
              {['Explain a difficult concept simply', 'Help me plan a new project', 'Review and improve my writing'].map(text =>
                <button key={text} onClick={() => setDraft(text)}>{text}</button>
              )}
            </div>
          </div>
        ) : (
          <div className="ai-chat-messages">
            {messages.map((message, index) => (
              <article className={'ai-message ' + message.role} key={index}>
                <span className="ai-message-avatar">{message.role === 'assistant' ? <Sparkles size={15} /> : <User size={15} />}</span>
                <div className="ai-message-body">
                  <small>{message.role === 'assistant' ? 'AXIOMTECH AI' : 'YOU'}</small>
                  <p>{message.content}</p>
                  {message.role === 'assistant' && <button className="ai-copy" onClick={() => void copyMessage(message.content, index)}>{copied === index ? <Check size={13} /> : <Copy size={13} />}{copied === index ? 'Copied' : 'Copy answer'}</button>}
                </div>
              </article>
            ))}
            {loading && <article className="ai-message assistant"><span className="ai-message-avatar"><Sparkles size={15} /></span><div className="ai-message-body"><small>AXIOMTECH AI</small><p className="ai-thinking"><LoaderCircle size={15} /> Thinking…</p></div></article>}
          </div>
        )}
      </div>

      {error && <div className="ai-chat-error" role="alert">{error}</div>}
      <div className="ai-composer">
        <textarea
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }}
          placeholder="Message AXIOMTECH AI…"
          rows={2}
          maxLength={8000}
          aria-label="Your message"
        />
        <button onClick={() => void sendMessage()} disabled={!canSend} aria-label="Send message">
          {loading ? <LoaderCircle size={17} /> : <Send size={17} />}
        </button>
        <small>Enter to send · Shift + Enter for a new line · Verify important information.</small>
      </div>
    </section>
  );
}
