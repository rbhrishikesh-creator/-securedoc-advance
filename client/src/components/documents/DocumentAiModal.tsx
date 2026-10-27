import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Shield,
  AlertTriangle,
  Tag,
  CheckCircle2,
  Send,
  Bot,
  User as UserIcon,
  RefreshCw,
  X,
  FileText,
  HelpCircle,
  Hash,
  Lightbulb,
} from 'lucide-react';
import { aiApi, DocumentAiMetadata } from '../../api/ai';
import { DocumentItem } from '../../types';
import { useToast } from '../../context/ToastContext';

interface DocumentAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  onTagsUpdated?: (newTags: string[]) => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export const DocumentAiModal: React.FC<DocumentAiModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  onTagsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'ask'>('insights');
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState<DocumentAiMetadata | null>(doc?.aiMetadata || null);

  // Ask AI Chat state
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { showToast } = useToast();

  useEffect(() => {
    if (doc) {
      setAiData(doc.aiMetadata || null);
      setChatHistory([
        {
          role: 'model',
          content: `Hello! I am your SecureDoc AI assistant. I have reviewed "${doc.name}". You can ask me any question regarding this document's contents, security implications, or key points.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // If document doesn't have AI metadata yet, trigger analysis automatically
      if (!doc.aiMetadata) {
        handleAnalyze();
      }
    }
  }, [doc?._id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, asking]);

  if (!isOpen || !doc) return null;

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      const res = await aiApi.analyzeDocument(doc._id);
      setAiData(res.aiMetadata);
      if (res.tags && onTagsUpdated) {
        onTagsUpdated(res.tags);
      }
      showToast({
        type: 'success',
        title: 'AI Analysis Complete',
        message: 'Intelligence synthesis and risk score updated.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'AI Analysis Failed',
        message: err.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async (promptText?: string) => {
    const q = promptText || question;
    if (!q.trim() || asking) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setQuestion('');
    setAsking(true);

    try {
      const historyForBackend = chatHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await aiApi.askDocumentAi(doc._id, q.trim(), historyForBackend);

      const botMsg: ChatMessage = {
        role: 'model',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistory((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'model',
          content: 'Sorry, I encountered an issue processing your query. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setAsking(false);
    }
  };

  const getRiskColor = (score: number = 0) => {
    if (score < 30) return '#10b981'; // Green
    if (score < 70) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const getClassificationBadgeClass = (classification: string = 'Internal') => {
    switch (classification) {
      case 'Confidential':
      case 'Restricted':
        return 'badge-rose';
      case 'Financial':
        return 'badge-amber';
      case 'Legal':
        return 'badge-indigo';
      case 'Technical':
        return 'badge-emerald';
      default:
        return 'badge-blue';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Sparkles size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>SecureDoc AI Intelligence</h2>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#818cf8',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    letterSpacing: '0.05em',
                  }}
                >
                  GEMINI 3.8 FLASH
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                {doc.name} • {doc.mimeType}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              title="Re-run Gemini AI analysis on this document"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Analyzing...' : 'Re-Analyze'}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            padding: '0 24px',
          }}
        >
          <button
            onClick={() => setActiveTab('insights')}
            style={{
              padding: '14px 18px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'insights' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'insights' ? 700 : 500,
              fontSize: 13,
              cursor: 'pointer',
              borderBottom: activeTab === 'insights' ? '2px solid var(--primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <Lightbulb size={16} /> Intelligence & Risk Analysis
          </button>
          <button
            onClick={() => setActiveTab('ask')}
            style={{
              padding: '14px 18px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'ask' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'ask' ? 700 : 500,
              fontSize: 13,
              cursor: 'pointer',
              borderBottom: activeTab === 'ask' ? '2px solid var(--primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <Bot size={16} /> Ask SecureDoc AI ({chatHistory.length - 1} queries)
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {activeTab === 'insights' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Sensitivity & Risk Dial Header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 16,
                }}
              >
                {/* Security Classification */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                    SECURITY CLASSIFICATION
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      className={`badge ${getClassificationBadgeClass(aiData?.classification)}`}
                      style={{ fontSize: 14, padding: '4px 12px' }}
                    >
                      {aiData?.classification || 'Internal'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
                    Automated data loss prevention policy tier
                  </div>
                </div>

                {/* Risk Score */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>RISK RATING</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: getRiskColor(aiData?.riskScore) }}>
                      {aiData?.riskScore || 15} / 100
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div
                    style={{
                      height: 8,
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${aiData?.riskScore || 15}%`,
                        background: getRiskColor(aiData?.riskScore),
                        borderRadius: 4,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
                    {aiData && (aiData.riskScore || 0) > 60
                      ? 'Elevated confidentiality: Download restrictions recommended.'
                      : 'Standard organizational risk level.'}
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(99, 102, 241, 0.06)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <FileText size={18} color="var(--primary)" />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>Executive Summary</h3>
                </div>
                <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6, margin: 0 }}>
                  {aiData?.summary ||
                    'Click "Re-Analyze" above to generate a synthesized executive summary of this encrypted document.'}
                </p>
              </div>

              {/* Key Insights */}
              {aiData?.keyInsights && aiData.keyInsights.length > 0 && (
                <div
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <CheckCircle2 size={18} color="#10b981" />
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>Key Takeaways & Compliance</h3>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {aiData.keyInsights.map((insight, idx) => (
                      <li key={idx} style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Named Entities & Tags Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {/* Entities */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Hash size={14} /> IDENTIFIED ENTITIES
                  </div>
                  {aiData?.entities && aiData.entities.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {aiData.entities.map((ent, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: 11,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid var(--border-color)',
                            color: '#94a3b8',
                          }}
                        >
                          <strong style={{ color: '#e2e8f0' }}>{ent.name}</strong> ({ent.type})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No explicit entities identified.</span>
                  )}
                </div>

                {/* Suggested Tags */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Tag size={14} /> AI SUGGESTED TAGS
                  </div>
                  {aiData?.suggestedTags && aiData.suggestedTags.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {aiData.suggestedTags.map((tag, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: 11,
                            padding: '3px 10px',
                            borderRadius: 999,
                            background: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            color: '#818cf8',
                            fontWeight: 600,
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No tags available.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ask' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 380 }}>
              {/* Suggested Questions Pills */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                  QUICK PROMPTS:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    'Summarize main points in 3 bullets',
                    'Does this document contain sensitive PII?',
                    'What security compliance level applies?',
                    'Who are the parties involved?',
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAsk(p)}
                      disabled={asking}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 999,
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'var(--text-secondary)',
                        fontSize: 11,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Thread */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  overflowY: 'auto',
                  maxHeight: '360px',
                  paddingRight: 6,
                }}
              >
                {chatHistory.map((msg, idx) => {
                  const isBot = msg.role === 'model';
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'flex-start',
                        justifyContent: isBot ? 'flex-start' : 'flex-end',
                      }}
                    >
                      {isBot && (
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          <Bot size={16} color="#ffffff" />
                        </div>
                      )}

                      <div
                        style={{
                          maxWidth: '75%',
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-md)',
                          background: isBot ? 'rgba(255, 255, 255, 0.05)' : 'var(--primary)',
                          border: isBot ? '1px solid var(--border-color)' : 'none',
                          color: '#ffffff',
                          fontSize: 13,
                          lineHeight: 1.5,
                        }}
                      >
                        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                        <div
                          style={{
                            fontSize: 10,
                            color: isBot ? 'var(--text-muted)' : 'rgba(255, 255, 255, 0.7)',
                            marginTop: 4,
                            textAlign: 'right',
                          }}
                        >
                          {msg.timestamp}
                        </div>
                      </div>

                      {!isBot && (
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          <UserIcon size={16} color="#ffffff" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {asking && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Bot size={16} color="#ffffff" />
                    </div>
                    <div
                      style={{
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <RefreshCw size={12} className="animate-spin" />
                      Gemini is analyzing document context...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAsk();
                }}
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 16,
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: 12,
                }}
              >
                <input
                  type="text"
                  className="input-control"
                  placeholder="Ask a question about this document..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={asking}
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={asking || !question.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px' }}
                >
                  <Send size={15} /> Ask
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
