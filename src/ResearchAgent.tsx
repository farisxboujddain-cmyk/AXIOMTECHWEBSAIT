import { useState } from 'react';
import type { FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowUpRight, BookOpen, LoaderCircle, Search, Sparkles } from 'lucide-react';
import './research.css';

type ResearchSource = {
  title: string;
  url: string;
  extract: string;
  provider?: string;
  year?: number;
};
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
      const response = await fetch((API_BASE || '') + '/api/research', {
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
          <p>Build a structured brief from relevance-filtered Wikipedia and OpenAlex sources, with links you can verify.</p>
        </div>
        <span className="research-status"><span /> MULTI-SOURCE BETA</span>
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
          <small>Free model route · Wikipedia + OpenAlex · Verify important claims</small>
          <button type="submit" disabled={loading || question.trim().length < 5}>
            {loading ? <LoaderCircle size={16} className="research-spinner" /> : <Search size={16} />}
            {loading ? 'Researching…' : 'Start research'}
          </button>
        </div>
      </form>

      {error && <div className="research-error" role="alert">{error}</div>}
      {loading && <div className="research-loading"><Sparkles size={17} /> Planning the search, checking two source indexes and preparing your brief…</div>}

      {answer && (
        <div className="research-results">
          <div className="research-answer">
            <div className="research-result-title"><BookOpen size={17} /> RESEARCH BRIEF</div>
            {searchQuery && <p className="research-query">Search phrase: {searchQuery}</p>}
            <div className="research-answer-text research-markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
                }}
              >
                {answer}
              </ReactMarkdown>
            </div>
          </div>
          <div className="research-sources">
            <div className="research-result-title">SOURCES <span>{sources.length}</span></div>
            {sources.map((source) => (
              <a className="research-source" href={source.url} target="_blank" rel="noreferrer" key={source.url}>
                <span><BookOpen size={14} /></span>
                <div>
                  <b>{source.title}</b>
                  <small className="research-source-meta">{source.provider || 'Source'}{source.year ? ' · ' + source.year : ''}</small>
                  <p>{source.extract.slice(0, 210)}{source.extract.length > 210 ? '…' : ''}</p>
                </div>
                <ArrowUpRight size={14} />
              </a>
            ))}
            {sources.length === 0 && <p className="research-empty-sources">No source records were returned for this report.</p>}
          </div>
        </div>
      )}
      <p className="research-disclaimer">Research Agent v2 · Sources are retrieved from English Wikipedia and OpenAlex. Coverage and abstracts vary by topic; check original sources before relying on claims.</p>
    </section>
  );
}
