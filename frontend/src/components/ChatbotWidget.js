import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Trash2, Sparkles } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ChatbotWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && user) {
      axios.get(`${API}/chatbot/history`, { withCredentials: true })
        .then(res => setMessages(res.data))
        .catch(() => {});
    }
  }, [open, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text, message_id: `temp_${Date.now()}` }]);
    setSending(true);
    try {
      const res = await axios.post(`${API}/chatbot/message`, { message: text }, { withCredentials: true });
      setMessages(prev => {
        const updated = prev.filter(m => !m.message_id?.startsWith('temp_'));
        return [...updated, res.data.user_message, res.data.assistant_message];
      });
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.', message_id: `err_${Date.now()}` }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const clearHistory = async () => {
    try {
      await axios.delete(`${API}/chatbot/history`, { withCredentials: true });
      setMessages([]);
    } catch { /* ignore */ }
  };

  if (!user || user.role === 'admin') return null;

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          data-testid="chatbot-fab"
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-6 z-50 w-14 h-14 bg-slate-800 hover:bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-xl"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[380px] h-[520px] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up"
          data-testid="chatbot-window"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900">Cohort Assistant</p>
                <p className="text-[11px] text-slate-400 font-mono">Powered by Gemini</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clearHistory} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors" data-testid="chatbot-clear">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={() => setOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors" data-testid="chatbot-close">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
            <div ref={scrollRef} className="space-y-3 overflow-y-auto" style={{ maxHeight: '370px' }}>
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Ask me anything about the APM program, projects, or case studies.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={m.message_id || i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="chat-bubble-assistant px-4 py-2.5 text-sm">
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="px-4 py-3 border-t border-slate-100">
            <div className="flex gap-2">
              <Input
                data-testid="chatbot-input"
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about the program..."
                className="flex-1 bg-slate-50 border-slate-200 text-sm h-10"
                disabled={sending}
              />
              <Button
                data-testid="chatbot-send"
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                size="sm"
                className="bg-slate-800 hover:bg-slate-900 h-10 w-10 p-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
