import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, Send, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DiscussionDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [discussion, setDiscussion] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText, setEditText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [discRes, msgRes] = await Promise.all([
          axios.get(`${API}/discussions`, { withCredentials: true }),
          axios.get(`${API}/discussions/${id}/messages`, { withCredentials: true }),
        ]);
        const disc = discRes.data.find(d => d.discussion_id === id);
        setDiscussion(disc);
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
      const res = await axios.post(`${API}/discussions/${id}/messages`, { content: newMsg.trim() }, { withCredentials: true });
      setMessages(prev => [...prev, res.data]);
      setNewMsg('');
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  const startEdit = (msg) => {
    setEditingMsg(msg.message_id);
    setEditText(msg.content);
  };

  const saveEdit = async (msgId) => {
    if (!editText.trim()) return;
    try {
      const res = await axios.put(`${API}/discussions/${id}/messages/${msgId}`, { content: editText.trim() }, { withCredentials: true });
      setMessages(prev => prev.map(m => m.message_id === msgId ? res.data : m));
      setEditingMsg(null);
      setEditText('');
      toast.success('Message updated');
    } catch { toast.error('Update failed'); }
  };

  const deleteMessage = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await axios.delete(`${API}/discussions/${id}/messages/${msgId}`, { withCredentials: true });
      setMessages(prev => prev.filter(m => m.message_id !== msgId));
      toast.success('Message deleted');
    } catch (err) { toast.error(err.response?.data?.detail || 'Delete failed'); }
  };

  const canModify = (msg) => msg.author_id === user?.user_id || user?.role === 'admin';

  if (!discussion) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="discussion-detail-page">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/discussions" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6" data-testid="back-to-discussions">
          <ArrowLeft className="w-4 h-4" /> Back to discussions
        </Link>

        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 animate-fade-in-up">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{discussion.title}</h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{discussion.content}</p>
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
            {discussion.author_picture && <img src={discussion.author_picture} alt="" className="w-7 h-7 rounded-full" />}
            <span className="text-xs text-slate-500">{discussion.author_name} &middot; {new Date(discussion.created_at).toLocaleDateString()}</span>
            {discussion.edited_at && <span className="text-xs text-slate-400">(edited)</span>}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {messages.map(m => (
            <div key={m.message_id} className="bg-white border border-slate-200 rounded-xl p-4 animate-slide-in" data-testid={`msg-${m.message_id}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  {m.author_picture ? (
                    <img src={m.author_picture} alt="" className="w-7 h-7 rounded-full" />
                  ) : (
                    <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600">
                      {m.author_name?.[0]}
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-900">{m.author_name}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{new Date(m.created_at).toLocaleString()}</span>
                  {m.edited_at && <span className="text-[10px] text-slate-300">(edited)</span>}
                </div>
                {canModify(m) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600" data-testid={`msg-menu-${m.message_id}`}>
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {m.author_id === user?.user_id && (
                        <DropdownMenuItem onClick={() => startEdit(m)} className="cursor-pointer" data-testid={`edit-msg-${m.message_id}`}>
                          <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => deleteMessage(m.message_id)} className="text-red-600 cursor-pointer" data-testid={`delete-msg-${m.message_id}`}>
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {editingMsg === m.message_id ? (
                <div className="pl-9 space-y-2">
                  <Textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    className="bg-slate-50 border-slate-200 min-h-[60px] text-sm"
                    data-testid={`edit-msg-textarea-${m.message_id}`}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(m.message_id)} className="bg-slate-800 hover:bg-slate-900 text-xs" data-testid={`save-msg-edit-${m.message_id}`}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingMsg(null)} className="text-xs">Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed pl-9">{m.content}</p>
              )}
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center py-8 text-sm text-slate-400">No replies yet</div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="sticky bottom-0 bg-slate-50 pt-4 pb-2">
          <div className="flex gap-3">
            <Textarea
              data-testid="discussion-reply-input"
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              placeholder="Write a reply..."
              className="bg-white border-slate-200 min-h-[80px] flex-1"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            />
            <Button
              data-testid="discussion-reply-send"
              onClick={sendMessage}
              disabled={sending || !newMsg.trim()}
              className="bg-slate-800 hover:bg-slate-900 self-end h-10 w-10 p-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
