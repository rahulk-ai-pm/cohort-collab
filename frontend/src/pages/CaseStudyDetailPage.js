import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Send, FileText, ExternalLink, MessageSquare, Info } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CaseStudyDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [study, setStudy] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [csRes, msgRes] = await Promise.all([
          axios.get(`${API}/case-studies/${id}`, { withCredentials: true }),
          axios.get(`${API}/case-studies/${id}/messages`, { withCredentials: true }),
        ]);
        setStudy(csRes.data);
        setMessages(msgRes.data);
      } catch { /* ignore */ }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true);
    try {
      const res = await axios.post(`${API}/case-studies/${id}/messages`, { content: newMsg.trim() }, { withCredentials: true });
      setMessages(prev => [...prev, res.data]);
      setNewMsg('');
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  if (!study) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="case-study-detail-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/case-studies" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6" data-testid="back-to-case-studies">
          <ArrowLeft className="w-4 h-4" /> Back to case studies
        </Link>

        <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 mb-6 animate-fade-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{study.title}</h1>
          <p className="text-slate-600 mt-4 leading-relaxed">{study.description}</p>
          {study.context && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Context</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{study.context}</p>
            </div>
          )}
        </div>

        <Tabs defaultValue="discussion" className="animate-fade-in-up stagger-1">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="discussion" data-testid="tab-discussion">
              <MessageSquare className="w-4 h-4 mr-1.5" /> Discussion
            </TabsTrigger>
            <TabsTrigger value="files" data-testid="tab-cs-files">
              <FileText className="w-4 h-4 mr-1.5" /> Files
            </TabsTrigger>
            <TabsTrigger value="links" data-testid="tab-cs-links">
              <ExternalLink className="w-4 h-4 mr-1.5" /> Links
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discussion" className="mt-4">
            <div className="space-y-3 mb-4">
              {messages.map(m => (
                <div key={m.message_id} className="bg-white border border-slate-200 rounded-xl p-4 animate-slide-in">
                  <div className="flex items-center gap-2.5 mb-2">
                    {m.author_picture ? <img src={m.author_picture} alt="" className="w-7 h-7 rounded-full" /> :
                      <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold">{m.author_name?.[0]}</div>}
                    <span className="text-sm font-medium text-slate-900">{m.author_name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed pl-9">{m.content}</p>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center py-8 text-sm text-slate-400">No discussion messages yet. Start the conversation!</div>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="flex gap-3">
              <Textarea
                data-testid="cs-message-input"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                placeholder="Discuss this case study..."
                className="bg-white border-slate-200 min-h-[80px] flex-1"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />
              <Button
                data-testid="cs-message-send"
                onClick={sendMessage}
                disabled={sending || !newMsg.trim()}
                className="bg-slate-800 hover:bg-slate-900 self-end h-10 w-10 p-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="files" className="mt-4">
            <div className="space-y-2">
              {study.files?.map(f => (
                <div key={f.file_id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{f.original_filename}</p>
                    <p className="text-xs text-slate-400 font-mono">{(f.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              ))}
              {(!study.files || study.files.length === 0) && (
                <div className="text-center py-8 text-sm text-slate-400">No files attached</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="links" className="mt-4">
            <div className="space-y-2">
              {study.links?.map((link, i) => (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                  className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <ExternalLink className="w-4 h-4" /> {link}
                  </div>
                </a>
              ))}
              {(!study.links || study.links.length === 0) && (
                <div className="text-center py-8 text-sm text-slate-400">No links attached</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
