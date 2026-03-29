import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Bell, FolderKanban, BookOpen, MessageSquare, Users, ChevronRight, Linkedin, ExternalLink, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ALL_SKILLS = [
  "Data Analysis", "Market Research", "Product Strategy", "Financial Modeling",
  "Tech/Prototyping", "UX/Design", "Marketing/GTM", "Business Development",
  "Operations", "Leadership", "Project Management", "Agile/Scrum",
  "Consumer Insights", "Competitive Analysis", "Pricing Strategy",
  "Supply Chain", "Digital Marketing", "Sales Strategy"
];

function ProfileEditDialog({ open, onOpenChange, user, onSaved }) {
  const [form, setForm] = useState({
    professional_experience: user?.professional_experience || '',
    current_role: user?.current_role || '',
    aspirations: user?.aspirations || '',
    linkedin_url: user?.linkedin_url || '',
    skills: user?.skills || []
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        professional_experience: user.professional_experience || '',
        current_role: user.current_role || '',
        aspirations: user.aspirations || '',
        linkedin_url: user.linkedin_url || '',
        skills: user.skills || []
      });
    }
  }, [user, open]);

  const toggleSkill = (skill) => {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill]
    }));
  };

  const handleSave = async () => {
    if (!form.current_role || !form.professional_experience || !form.aspirations) {
      toast.error('Please fill required fields');
      return;
    }
    setSaving(true);
    try {
      const res = await axios.put(`${API}/profile/update`, form, { withCredentials: true });
      onSaved(res.data);
      onOpenChange(false);
      toast.success('Profile updated');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-sm font-semibold text-slate-700">Current Role *</Label>
            <Input value={form.current_role} onChange={e => setForm(f => ({ ...f, current_role: e.target.value }))}
              className="mt-1 bg-slate-50" data-testid="edit-current-role" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-slate-700">Professional Experience *</Label>
            <Textarea value={form.professional_experience} onChange={e => setForm(f => ({ ...f, professional_experience: e.target.value }))}
              className="mt-1 bg-slate-50 min-h-[80px]" data-testid="edit-experience" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-slate-700">Skills</Label>
            <div className="flex flex-wrap gap-1.5 mt-2" data-testid="edit-skills">
              {ALL_SKILLS.map(skill => (
                <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    form.skills.includes(skill) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}>{skill}</button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold text-slate-700">Aspirations *</Label>
            <Textarea value={form.aspirations} onChange={e => setForm(f => ({ ...f, aspirations: e.target.value }))}
              className="mt-1 bg-slate-50 min-h-[60px]" data-testid="edit-aspirations" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-slate-700">LinkedIn URL</Label>
            <Input value={form.linkedin_url} onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))}
              className="mt-1 bg-slate-50" data-testid="edit-linkedin" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full bg-slate-800 hover:bg-slate-900" data-testid="save-profile-btn">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DashboardPage() {
  const { user, setUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ projects: 0, caseStudies: 0, discussions: 0, members: 0 });
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [notifRes, projRes, csRes, discRes, memRes] = await Promise.all([
          axios.get(`${API}/notifications`, { withCredentials: true }),
          axios.get(`${API}/projects`, { withCredentials: true }),
          axios.get(`${API}/case-studies`, { withCredentials: true }),
          axios.get(`${API}/discussions`, { withCredentials: true }),
          axios.get(`${API}/members`, { withCredentials: true }),
        ]);
        setNotifications(notifRes.data);
        setStats({
          projects: projRes.data.length,
          caseStudies: csRes.data.length,
          discussions: discRes.data.length,
          members: memRes.data.length,
        });
      } catch { /* ignore */ }
    };
    fetchData();
  }, []);

  const markRead = async (id) => {
    try {
      await axios.put(`${API}/notifications/${id}/read`, {}, { withCredentials: true });
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, read: true } : n));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API}/notifications/read-all`, {}, { withCredentials: true });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  const unread = notifications.filter(n => !n.read);

  const statCards = [
    { label: 'Projects', value: stats.projects, icon: FolderKanban, to: '/projects', color: 'bg-blue-50 text-blue-700' },
    { label: 'Case Studies', value: stats.caseStudies, icon: BookOpen, to: '/case-studies', color: 'bg-amber-50 text-amber-700' },
    { label: 'Discussions', value: stats.discussions, icon: MessageSquare, to: '/discussions', color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Cohort Members', value: stats.members, icon: Users, to: '/directory', color: 'bg-violet-50 text-violet-700' },
  ];

  return (
    <div className="min-h-screen bg-slate-50" data-testid="member-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-slate-500 mt-1">Your APM Batch 06 cohort hub</p>
        </div>

        {/* Profile Card + Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Profile */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 animate-fade-in-up">
            <div className="flex items-start gap-4">
              {user?.picture ? (
                <img src={user.picture} alt="" className="w-14 h-14 rounded-full" />
              ) : (
                <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center text-lg font-bold text-slate-600">
                  {user?.name?.[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 truncate">{user?.name}</h3>
                  <button onClick={() => setEditOpen(true)} className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors" data-testid="edit-profile-btn" title="Edit profile">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm text-slate-500 truncate">{user?.current_role || 'APM Participant'}</p>
                {user?.linkedin_url && (
                  <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1">
                    <Linkedin className="w-3 h-3" /> LinkedIn <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
            {user?.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t border-slate-100">
                {user.skills.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-md font-medium">{s}</span>
                ))}
              </div>
            )}
            {user?.aspirations && (
              <p className="text-sm text-slate-600 mt-3 border-t border-slate-100 pt-3">{user.aspirations}</p>
            )}
          </div>

          {/* Stats */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statCards.map((s, i) => (
              <Link
                key={s.label}
                to={s.to}
                className={`bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200 animate-fade-in-up stagger-${i + 1}`}
                data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center mb-3`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900 font-mono">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-slate-200 rounded-xl animate-fade-in-up">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-slate-400" />
              <h2 className="font-bold text-slate-900">Notifications</h2>
              {unread.length > 0 && (
                <Badge variant="secondary" className="bg-red-50 text-red-700 text-xs">{unread.length} new</Badge>
              )}
            </div>
            {unread.length > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-slate-500" data-testid="mark-all-read">
                Mark all read
              </Button>
            )}
          </div>
          <ScrollArea className="max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-400">No notifications yet</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map(n => (
                  <div
                    key={n.notification_id}
                    className={`flex items-start gap-3 px-6 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/30' : ''}`}
                    onClick={() => !n.read && markRead(n.notification_id)}
                    data-testid={`notification-${n.notification_id}`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.read ? 'bg-red-500' : 'bg-slate-200'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">
                        {new Date(n.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      to={n.type === 'new_project' || n.type === 'teams_published' ? `/projects/${n.entity_id}` : n.type === 'new_case_study' ? `/case-studies/${n.entity_id}` : `/discussions/${n.entity_id}`}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      <ProfileEditDialog open={editOpen} onOpenChange={setEditOpen} user={user} onSaved={(updated) => setUser(updated)} />
    </div>
  );
}
