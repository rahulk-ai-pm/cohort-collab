import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  FolderKanban, BookOpen, BarChart3, Plus, Trash2, Upload, Users, MessageSquare, FileText, X
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function ProjectForm({ onCreated, editData }) {
  const [form, setForm] = useState(editData || { title: '', description: '', context: '', group_size: '', links: [] });
  const [linkInput, setLinkInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, group_size: form.group_size ? parseInt(form.group_size) : null };
      if (editData?.project_id) {
        await axios.put(`${API}/admin/projects/${editData.project_id}`, payload, { withCredentials: true });
        toast.success('Project updated');
      } else {
        await axios.post(`${API}/admin/projects`, payload, { withCredentials: true });
        toast.success('Project created');
      }
      onCreated?.();
    } catch { toast.error('Failed to save project'); }
    finally { setSaving(false); }
  };

  const addLink = () => {
    if (linkInput.trim()) {
      setForm(f => ({ ...f, links: [...f.links, linkInput.trim()] }));
      setLinkInput('');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold">Title *</Label>
        <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1 bg-slate-50" data-testid="admin-project-title" />
      </div>
      <div>
        <Label className="text-sm font-semibold">Description</Label>
        <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 bg-slate-50 min-h-[80px]" data-testid="admin-project-description" />
      </div>
      <div>
        <Label className="text-sm font-semibold">Context (for chatbot)</Label>
        <Textarea value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} className="mt-1 bg-slate-50 min-h-[80px]" placeholder="Add context the AI chatbot can use to answer questions about this project..." data-testid="admin-project-context" />
      </div>
      <div>
        <Label className="text-sm font-semibold">Group Size</Label>
        <Input type="number" value={form.group_size} onChange={e => setForm(f => ({ ...f, group_size: e.target.value }))} className="mt-1 bg-slate-50 w-32" data-testid="admin-project-group-size" />
      </div>
      <div>
        <Label className="text-sm font-semibold">Links</Label>
        <div className="flex gap-2 mt-1">
          <Input value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="https://..." className="bg-slate-50" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLink())} />
          <Button variant="outline" onClick={addLink} size="sm">Add</Button>
        </div>
        {form.links.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.links.map((l, i) => (
              <Badge key={i} variant="secondary" className="text-xs gap-1">
                {l.substring(0, 30)}...
                <button onClick={() => setForm(f => ({ ...f, links: f.links.filter((_, idx) => idx !== i) }))}><X className="w-3 h-3" /></button>
              </Badge>
            ))}
          </div>
        )}
      </div>
      <Button onClick={handleSubmit} disabled={saving} className="w-full bg-slate-800 hover:bg-slate-900" data-testid="admin-project-submit">
        {saving ? 'Saving...' : editData?.project_id ? 'Update Project' : 'Create Project'}
      </Button>
    </div>
  );
}

function CaseStudyForm({ onCreated, editData }) {
  const [form, setForm] = useState(editData || { title: '', description: '', context: '', links: [] });
  const [linkInput, setLinkInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      if (editData?.case_study_id) {
        await axios.put(`${API}/admin/case-studies/${editData.case_study_id}`, form, { withCredentials: true });
        toast.success('Case study updated');
      } else {
        await axios.post(`${API}/admin/case-studies`, form, { withCredentials: true });
        toast.success('Case study created');
      }
      onCreated?.();
    } catch { toast.error('Failed to save case study'); }
    finally { setSaving(false); }
  };

  const addLink = () => {
    if (linkInput.trim()) {
      setForm(f => ({ ...f, links: [...f.links, linkInput.trim()] }));
      setLinkInput('');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold">Title *</Label>
        <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1 bg-slate-50" data-testid="admin-cs-title" />
      </div>
      <div>
        <Label className="text-sm font-semibold">Description</Label>
        <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 bg-slate-50 min-h-[80px]" data-testid="admin-cs-description" />
      </div>
      <div>
        <Label className="text-sm font-semibold">Context (for chatbot)</Label>
        <Textarea value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} className="mt-1 bg-slate-50 min-h-[80px]" placeholder="Add context the AI chatbot can use..." data-testid="admin-cs-context" />
      </div>
      <div>
        <Label className="text-sm font-semibold">Links</Label>
        <div className="flex gap-2 mt-1">
          <Input value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="https://..." className="bg-slate-50" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLink())} />
          <Button variant="outline" onClick={addLink} size="sm">Add</Button>
        </div>
        {form.links.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.links.map((l, i) => (
              <Badge key={i} variant="secondary" className="text-xs gap-1">
                {l.substring(0, 30)}...
                <button onClick={() => setForm(f => ({ ...f, links: f.links.filter((_, idx) => idx !== i) }))}><X className="w-3 h-3" /></button>
              </Badge>
            ))}
          </div>
        )}
      </div>
      <Button onClick={handleSubmit} disabled={saving} className="w-full bg-slate-800 hover:bg-slate-900" data-testid="admin-cs-submit">
        {saving ? 'Saving...' : editData?.case_study_id ? 'Update Case Study' : 'Create Case Study'}
      </Button>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [caseStudies, setCaseStudies] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [projDialogOpen, setProjDialogOpen] = useState(false);
  const [csDialogOpen, setCsDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);

  const fetchData = async () => {
    try {
      const [projRes, csRes, analyticsRes] = await Promise.all([
        axios.get(`${API}/projects`, { withCredentials: true }),
        axios.get(`${API}/case-studies`, { withCredentials: true }),
        axios.get(`${API}/admin/analytics`, { withCredentials: true }),
      ]);
      setProjects(projRes.data);
      setCaseStudies(csRes.data);
      setAnalytics(analyticsRes.data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchData(); }, []);

  const uploadFile = async (entityType, entityId, file) => {
    setUploadingFile(`${entityType}_${entityId}`);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post(`${API}/admin/${entityType}/${entityId}/files`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('File uploaded');
    } catch { toast.error('Upload failed'); }
    finally { setUploadingFile(null); }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await axios.delete(`${API}/admin/projects/${id}`, { withCredentials: true });
      setProjects(p => p.filter(x => x.project_id !== id));
      toast.success('Project deleted');
    } catch { toast.error('Delete failed'); }
  };

  const deleteCaseStudy = async (id) => {
    if (!window.confirm('Delete this case study?')) return;
    try {
      await axios.delete(`${API}/admin/case-studies/${id}`, { withCredentials: true });
      setCaseStudies(cs => cs.filter(x => x.case_study_id !== id));
      toast.success('Case study deleted');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage projects, case studies, and view analytics</p>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in-up">
            {[
              { label: 'Members', value: analytics.total_members, sub: `${analytics.onboarded_members} onboarded` },
              { label: 'Chatbot Queries', value: analytics.total_chatbot_queries },
              { label: 'Discussions', value: analytics.total_discussions, sub: `${analytics.total_discussion_messages} messages` },
              { label: 'Content', value: analytics.total_projects + analytics.total_case_studies, sub: `${analytics.total_projects} proj + ${analytics.total_case_studies} CS` },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-3xl font-bold text-slate-900 font-mono">{s.value}</p>
                <p className="text-sm font-semibold text-slate-700 mt-1">{s.label}</p>
                {s.sub && <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>}
              </div>
            ))}
          </div>
        )}

        <Tabs defaultValue="projects" className="animate-fade-in-up stagger-1">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="projects"><FolderKanban className="w-4 h-4 mr-1.5" /> Projects</TabsTrigger>
            <TabsTrigger value="case-studies"><BookOpen className="w-4 h-4 mr-1.5" /> Case Studies</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 className="w-4 h-4 mr-1.5" /> Member Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-4">
            <div className="flex justify-end mb-4">
              <Dialog open={projDialogOpen} onOpenChange={setProjDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-slate-800 hover:bg-slate-900" data-testid="admin-add-project-btn">
                    <Plus className="w-4 h-4 mr-2" /> Add Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
                  <ProjectForm onCreated={() => { setProjDialogOpen(false); fetchData(); }} />
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-3">
              {projects.map(p => (
                <div key={p.project_id} className="bg-white border border-slate-200 rounded-xl p-5" data-testid={`admin-project-${p.project_id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{p.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                      {p.group_size && <Badge variant="outline" className="mt-2 text-xs"><Users className="w-3 h-3 mr-1" /> {p.group_size} per team</Badge>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="cursor-pointer">
                        <input type="file" className="hidden" onChange={e => e.target.files?.[0] && uploadFile('projects', p.project_id, e.target.files[0])} />
                        <div className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                          <Upload className="w-4 h-4" />
                        </div>
                      </label>
                      <button onClick={() => deleteProject(p.project_id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors" data-testid={`delete-project-${p.project_id}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && <div className="text-center py-12 text-sm text-slate-400">No projects yet</div>}
            </div>
          </TabsContent>

          <TabsContent value="case-studies" className="mt-4">
            <div className="flex justify-end mb-4">
              <Dialog open={csDialogOpen} onOpenChange={setCsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-slate-800 hover:bg-slate-900" data-testid="admin-add-cs-btn">
                    <Plus className="w-4 h-4 mr-2" /> Add Case Study
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Create Case Study</DialogTitle></DialogHeader>
                  <CaseStudyForm onCreated={() => { setCsDialogOpen(false); fetchData(); }} />
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-3">
              {caseStudies.map(cs => (
                <div key={cs.case_study_id} className="bg-white border border-slate-200 rounded-xl p-5" data-testid={`admin-cs-${cs.case_study_id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{cs.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{cs.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="cursor-pointer">
                        <input type="file" className="hidden" onChange={e => e.target.files?.[0] && uploadFile('case-studies', cs.case_study_id, e.target.files[0])} />
                        <div className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                          <Upload className="w-4 h-4" />
                        </div>
                      </label>
                      <button onClick={() => deleteCaseStudy(cs.case_study_id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors" data-testid={`delete-cs-${cs.case_study_id}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {caseStudies.length === 0 && <div className="text-center py-12 text-sm text-slate-400">No case studies yet</div>}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            {analytics ? (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900">Member Activity</h3>
                </div>
                <ScrollArea className="max-h-[500px]">
                  <table className="w-full" data-testid="admin-activity-table">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Member</th>
                        <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Chatbot</th>
                        <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Discussions</th>
                        <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Case Study</th>
                        <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {analytics.member_activity.map(m => (
                        <tr key={m.user_id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3">
                            <p className="text-sm font-medium text-slate-900">{m.name}</p>
                            <p className="text-xs text-slate-400">{m.email}</p>
                          </td>
                          <td className="text-center px-4 py-3 font-mono text-sm">{m.chatbot_queries}</td>
                          <td className="text-center px-4 py-3 font-mono text-sm">{m.discussion_messages}</td>
                          <td className="text-center px-4 py-3 font-mono text-sm">{m.case_study_messages}</td>
                          <td className="text-center px-4 py-3 font-mono text-sm font-bold">{m.total_activity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {analytics.member_activity.length === 0 && (
                    <div className="text-center py-12 text-sm text-slate-400">No member activity yet</div>
                  )}
                </ScrollArea>
              </div>
            ) : (
              <div className="text-center py-12 text-sm text-slate-400">Loading analytics...</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
