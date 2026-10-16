import React, { useState, useRef, useEffect } from 'react';
import { apiRequest } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Card, Badge, Chip } from '../../components/ui';
import {
  Sparkles,
  Send,
  RefreshCw,
  Book,
  Clock,
  Calendar,
  Award,
  Users,
  CalendarCheck,
  Flag,
  User,
} from 'lucide-react';

interface SourceCard {
  type: 'DEADLINE' | 'EVENT' | 'SCHOLARSHIP' | 'LIBRARY' | 'CLUB' | 'MENTOR' | 'ATTENDANCE' | 'ISSUE';
  title: string;
  detail: string;
  meta?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sources?: SourceCard[];
  timestamp: string;
}

export const AiChatPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello ${user?.fullName?.split(' ')[0] || 'there'}! I am CampusSync AI, your campus assistant. I can answer questions about library seating, upcoming deadlines, scheduled fests, scholarships, student clubs, and your personal attendance. What can I help you check?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(queryText = inputQuery) {
    const trimmed = queryText.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await apiRequest<{ answer: string; sources: SourceCard[] }>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ query: trimmed }),
      });

      const assistantMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        sources: res.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      showToast(err.message || 'AI request failed', 'error');
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: 'I encountered an error querying the campus database. Please try again in a moment.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const promptSuggestions = [
    'How many seats are available in the library right now?',
    'What are my upcoming assignment deadlines?',
    'What is my current attendance percentage?',
    'Tell me about active engineering scholarships',
    'Which clubs are currently active on campus?',
  ];

  return (
    <div className="py-2 space-y-4 max-w-4xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      <PageHeader
        title="CampusSync AI"
        subtitle="Conversational assistant grounded in live university database records."
      />

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[10px] font-semibold text-campus-textDim">
                {m.sender === 'user' ? 'You' : 'CampusSync AI'}
              </span>
              <span className="text-[9px] text-campus-textDim">{m.timestamp}</span>
            </div>

            <div
              className={`max-w-[85%] rounded-[22px] p-4 text-xs leading-relaxed shadow-subtle ${
                m.sender === 'user'
                  ? 'bg-campus-jade-700 text-white rounded-tr-xs'
                  : 'bg-white text-campus-text rounded-tl-xs whitespace-pre-line'
              }`}
            >
              {m.text}

              {/* Source Cards attached to AI Response */}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-black/5 space-y-2">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-campus-textDim">
                    Retrieved Campus Sources ({m.sources.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {m.sources.map((s, idx) => (
                      <div
                        key={idx}
                        className="bg-campus-surface rounded-xl p-2.5 text-left border border-black/5"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge
                            label={s.type}
                            variant={s.type === 'ATTENDANCE' ? 'amber' : s.type === 'LIBRARY' ? 'jade' : 'sage'}
                          />
                          {s.meta && <span className="text-[9px] text-campus-textDim">{s.meta}</span>}
                        </div>
                        <div className="font-semibold text-campus-text text-[11px] truncate">
                          {s.title}
                        </div>
                        <div className="text-[10px] text-campus-textMuted line-clamp-2 mt-0.5">
                          {s.detail}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 text-xs text-campus-textMuted">
            <RefreshCw className="w-4 h-4 text-campus-jade-700 animate-spin" />
            <span>Scanning verified campus database records...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Query Chips */}
      {messages.length < 3 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {promptSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-white text-campus-textMuted hover:text-campus-text hover:bg-white/80 shadow-xs whitespace-nowrap transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 bg-white rounded-full p-1.5 pl-4 shadow-subtle border border-campus-border"
      >
        <input
          type="text"
          placeholder="Ask anything about library seats, deadlines, attendance, clubs..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          disabled={loading}
          className="flex-1 bg-transparent text-xs text-campus-text placeholder:text-campus-textDim outline-hidden"
        />
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="w-9 h-9 rounded-full bg-campus-jade-700 text-white flex items-center justify-center hover:bg-campus-jade-800 disabled:opacity-40 transition-colors flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
