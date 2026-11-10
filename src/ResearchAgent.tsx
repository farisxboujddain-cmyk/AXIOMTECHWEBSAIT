import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowUpRight, BookOpen, LoaderCircle, Search, Sparkles } from 'lucide-react';
import './research.css';

type ResearchSource = { title: string; url: string; extract: string };
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export default function ResearchAgent() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function research(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = question.trim();
    if (value.length < 5 || loading) return;
    setLoading(true);
    setError('');
    setAnswer('');
    setSources([]);
    setSearchQuery('');
    try {
      const response = await fetch(API_BASE + '/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: value, model: 'openrouter/free' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Research could not be completed.');
      setAnswer(typeof data.answer === 'string' ? data.answer : '');
      setSources(Array.isArray(data.sources) ? data.sources : []);
      setSearchQuery(typeof data.searchQuery === 'string' ? data.searchQuery : '');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="research-section" id="research-agent">
      <div className="research-heading">
        <div>
          <div className="eyebrow"><i /> LANGCHAIN-POWERED RESEARCH</div>
          <h2>Research Agent <em>workspace.</em></h2>
          <p>Turn a question into a structured brief with source links. This first release searches English Wikipedia only.</p>
        </div>
        <span className="research-status"><span /> FIRST RELEASE</span>
      </div>

      <form className="research-form" onSubmit={research}>
        <label htmlFor="research-question">WHAT WOULD YOU LIKE TO RESEARCH?</label>
        <textarea
          id="research-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="e.g. How are AI agents changing software development?"
          maxLength={1000}
          rows={3}
        />
        <div className="research-form-footer">
          <small>Uses a free model route · English Wikipedia sources · Verify important claims</small>
          <button type="submit" disabled={loading || question.trim().length < 5}>
            {loading ? <LoaderCircle size={16} className="research-spinner" /> : <Search size={16} />}
            {loading ? 'Researching…' : 'Start research'}
          </button>
        </div>
      </form>

      {error && <div className="research-error" role="alert">{error}</div>}
      {loading && <div className="research-loading"><Sparkles size={17} /> Planning the search, reading sources and preparing your brief…</div>}

      {answer && (
        <div className="research-results">
          <div className="research-answer">
            <div className="research-result-title"><BookOpen size={17} /> RESEARCH BRIEF</div>
            {searchQuery && <p className="research-query">Search phrase: {searchQuery}</p>}
            <div className="research-answer-text">{answer}</div>
          </div>
          <div className="research-sources">
            <div className="research-result-title">SOURCES <span>{sources.length}</span></div>
            {sources.map((source) => (
              <a className="research-source" href={source.url} target="_blank" rel="noreferrer" key={source.url}>
                <span><BookOpen size={14} /></span>
                <div><b>{source.title}</b><p>{source.extract.slice(0, 210)}{source.extract.length > 210 ? '…' : ''}</p></div>
                <ArrowUpRight size={14} />
              </a>
            ))}
          </div>
        </div>
      )}
      <p className="research-disclaimer">Research Agent v1 · Search coverage is limited to English Wikipedia. Source links are shown so you can check the original pages.</p>
    </section>
  );
}
