import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Plus, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DiscussionsPage() {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    axios.get(`${API}/discussions`, { withCredentials: true })
      .then(res => setDiscussions(res.data))
      .catch(() => {});
  }, []);

  const createDiscussion = async () => {
    if (!title.trim() || !content.trim()) { toast.error('Fill in all fields'); return; }
    setCreating(true);
    try {
      const res = await axios.post(`${API}/discussions`, { title, content }, { withCredentials: true });
      setDiscussions(prev => [{ ...res.data, message_count: 0 }, ...prev]);
      setOpen(false);
      setTitle('');
      setContent('');
      toast.success('Discussion created');
    } catch { toast.error('Failed to create discussion'); }
    finally { setCreating(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="discussions-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Discussions</h1>
            <p className="text-slate-500 mt-1">Discuss topics with your cohort</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-800 hover:bg-slate-900 text-white" data-testid="create-discussion-btn">
                <Plus className="w-4 h-4 mr-2" /> New Topic
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Start a Discussion</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  data-testid="discussion-title-input"
                  placeholder="Discussion topic..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="bg-slate-50"
                />
                <Textarea
                  data-testid="discussion-content-input"
                  placeholder="What would you like to discuss?"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="bg-slate-50 min-h-[120px]"
                />
                <Button
                  data-testid="discussion-submit-btn"
                  onClick={createDiscussion}
                  disabled={creating}
                  className="w-full bg-slate-800 hover:bg-slate-900"
                >
                  {creating ? 'Creating...' : 'Post Discussion'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {discussions.map((d, i) => (
            <Link
              key={d.discussion_id}
              to={`/discussions/${d.discussion_id}`}
              className={`block bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200 animate-fade-in-up stagger-${(i % 5) + 1}`}
              data-testid={`discussion-${d.discussion_id}`}
            >
              <h3 className="font-semibold text-slate-900">{d.title}</h3>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{d.content}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {d.author_name}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> {d.message_count || 0} replies
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {new Date(d.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
          {discussions.length === 0 && (
            <div className="text-center py-16 text-sm text-slate-400">No discussions yet. Be the first to start one!</div>
          )}
        </div>
      </div>
    </div>
  );
}
