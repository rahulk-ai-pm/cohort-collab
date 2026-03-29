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
  FolderKanban, BookOpen, BarChart3, Plus, Trash2, Upload, Users, MessageSquare, FileText, X,
  Wand2, Send, Shuffle, Eye, ShieldBan, UserX, Unlock, Search
} from 'lucide-react';
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

function ProjectForm({ onCreated, editData }) {
  const [form, setForm] = useState(editData || { title: '', description: '', context: '', group_size: '', links: [], goals: '', skills_required: [] });
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

  const toggleSkill = (skill) => {
    setForm(f => ({
      ...f,
      skills_required: f.skills_required?.includes(skill)
        ? f.skills_required.filter(s => s !== skill)
        : [...(f.skills_required || []), skill]
    }));
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
        <Label className="text-sm font-semibold">Project Goals</Label>
        <Textarea value={form.goals} onChange={e => setForm(f => ({ ...f, goals: e.target.value }))} className="mt-1 bg-slate-50 min-h-[80px]" placeholder="What should the project achieve? What outcomes are expected?" data-testid="admin-project-goals" />
      </div>
      <div>
        <Label className="text-sm font-semibold">Skills Required</Label>
        <p className="text-xs text-slate-400 mt-1 mb-2">Select skills needed for this project (used for team formation)</p>
        <div className="flex flex-wrap gap-1.5" data-testid="admin-project-skills">
          {ALL_SKILLS.map(skill => (
            <button key={skill} type="button" onClick={() => toggleSkill(skill)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                form.skills_required?.includes(skill) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >{skill}</button>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-sm font-semibold">Context (for chatbot)</Label>
        <Textarea value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} className="mt-1 bg-slate-50 min-h-[80px]" placeholder="Add context the AI chatbot can use to answer questions about this project..." data-testid="admin-project-context" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-semibold">Group Size</Label>
          <Input type="number" value={form.group_size} onChange={e => setForm(f => ({ ...f, group_size: e.target.value }))} className="mt-1 bg-slate-50" data-testid="admin-project-group-size" />
        </div>
      </div>
      <div>
        <Label className="text-sm font-semibold">Links</Label>
        <div className="flex gap-2 mt-1">
          <Input value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="https://..." className="bg-slate-50" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLink())} />
          <Button variant="outline" onClick={addLink} size="sm">Add</Button>
        </div>
        {form.links?.length > 0 && (
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
        {form.links?.length > 0 && (
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

function TeamManagement({ project, onRefresh }) {
  const [teams, setTeams] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [prefCount, setPrefCount] = useState(0);

  const fetchTeams = async () => {
    try {
      const res = await axios.get(`${API}/admin/projects/${project.project_id}/teams`, { withCredentials: true });
      setTeams(res.data);
    } catch { setTeams(null); }
  };

  useEffect(() => {
    fetchTeams();
    axios.get(`${API}/admin/projects/${project.project_id}/preferences`, { withCredentials: true })
      .then(res => setPrefCount(res.data.length)).catch(() => {});
  }, [project.project_id]);

  const generateTeams = async () => {
    setGenerating(true);
    try {
      const res = await axios.post(`${API}/admin/projects/${project.project_id}/generate-teams`, {}, { withCredentials: true });
      setTeams(res.data);
      toast.success('Teams generated! Review and publish.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Generation failed');
    }
    finally { setGenerating(false); }
  };

  const publishTeams = async () => {
    if (!window.confirm('Publish these teams? All members will be notified.')) return;
    setPublishing(true);
    try {
      await axios.post(`${API}/admin/projects/${project.project_id}/publish-teams`, {}, { withCredentials: true });
      toast.success('Teams published!');
      fetchTeams();
    } catch { toast.error('Publish failed'); }
    finally { setPublishing(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Team Formation</h3>
          <p className="text-xs text-slate-500 mt-0.5">{prefCount} member preferences received</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateTeams} disabled={generating} variant="outline" size="sm" data-testid="generate-teams-btn">
            <Wand2 className="w-4 h-4 mr-1.5" /> {generating ? 'Generating...' : 'Generate Teams'}
          </Button>
          {teams && teams.status === 'draft' && (
            <Button onClick={publishTeams} disabled={publishing} size="sm" className="bg-emerald-600 hover:bg-emerald-700" data-testid="publish-teams-btn">
              <Send className="w-4 h-4 mr-1.5" /> {publishing ? 'Publishing...' : 'Publish Teams'}
            </Button>
          )}
        </div>
      </div>

      {teams && teams.status && (
        <Badge className={teams.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
          {teams.status === 'published' ? 'Published' : 'Draft - Review before publishing'}
        </Badge>
      )}

      {teams?.teams ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.teams.map((team, idx) => (
            <div key={team.team_id} className="bg-white border border-slate-200 rounded-xl p-4" data-testid={`admin-team-${team.team_id}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm text-slate-900">{team.team_name}</h4>
                <Badge variant="outline" className="text-xs">{team.member_details?.length || team.members?.length} members</Badge>
              </div>
              <div className="space-y-2">
                {(team.member_details || []).map(m => (
                  <div key={m.user_id} className="flex items-center gap-2 py-1">
                    {m.picture ? <img src={m.picture} alt="" className="w-6 h-6 rounded-full" /> :
                      <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold">{m.name?.[0]}</div>}
                    <span className="text-sm text-slate-700">{m.name}</span>
                    {m.skills?.length > 0 && (
                      <div className="flex gap-1 ml-auto">
                        {m.skills.slice(0, 2).map(s => <Badge key={s} variant="secondary" className="text-[9px] py-0">{s}</Badge>)}
                      </div>
                    )}
                  </div>
                ))}
                {!team.member_details && team.members?.map(uid => (
                  <div key={uid} className="text-xs text-slate-400 py-1">{uid}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-slate-400">
          No teams generated yet. Click "Generate Teams" to use AI-powered team formation.
        </div>
      )}
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
  const [teamMgmtProject, setTeamMgmtProject] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');

  const fetchData = async () => {
    try {
      const [projRes, csRes, analyticsRes, discRes, memRes] = await Promise.all([
        axios.get(`${API}/projects`, { withCredentials: true }),
        axios.get(`${API}/case-studies`, { withCredentials: true }),
        axios.get(`${API}/admin/analytics`, { withCredentials: true }),
        axios.get(`${API}/discussions`, { withCredentials: true }),
        axios.get(`${API}/admin/members`, { withCredentials: true }),
      ]);
      setProjects(projRes.data);
      setCaseStudies(csRes.data);
      setAnalytics(analyticsRes.data);
      setDiscussions(discRes.data);
      setMembers(memRes.data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchData(); }, []);

  const uploadFile = async (entityType, entityId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post(`${API}/admin/${entityType}/${entityId}/files`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('File uploaded');
    } catch { toast.error('Upload failed'); }
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

  const deleteDiscussion = async (id) => {
    if (!window.confirm('Delete this discussion and all its messages?')) return;
    try {
      await axios.delete(`${API}/admin/discussions/${id}`, { withCredentials: true });
      setDiscussions(d => d.filter(x => x.discussion_id !== id));
      toast.success('Discussion deleted');
    } catch { toast.error('Delete failed'); }
  };

  const removeMember = async (userId, name) => {
    if (!window.confirm(`Remove ${name}? This will delete their account and all associated data permanently.`)) return;
    try {
      await axios.delete(`${API}/admin/members/${userId}`, { withCredentials: true });
      setMembers(m => m.filter(x => x.user_id !== userId));
      toast.success(`${name} removed`);
    } catch (err) { toast.error(err.response?.data?.detail || 'Remove failed'); }
  };

  const blockMember = async (userId, name) => {
    if (!window.confirm(`Block ${name}? They will be logged out and unable to sign in again.`)) return;
    try {
      await axios.post(`${API}/admin/members/${userId}/block`, {}, { withCredentials: true });
      setMembers(m => m.map(x => x.user_id === userId ? { ...x, is_blocked: true } : x));
      toast.success(`${name} blocked`);
    } catch (err) { toast.error(err.response?.data?.detail || 'Block failed'); }
  };

  const unblockMember = async (userId, name) => {
    try {
      await axios.delete(`${API}/admin/members/${userId}/block`, { withCredentials: true });
      setMembers(m => m.map(x => x.user_id === userId ? { ...x, is_blocked: false } : x));
      toast.success(`${name} unblocked`);
    } catch { toast.error('Unblock failed'); }
  };

  const filteredMembers = members.filter(m =>
    m.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.current_role?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage projects, case studies, teams, and view analytics</p>
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
          <TabsList className="bg-white border border-slate-200 flex-wrap h-auto gap-0">
            <TabsTrigger value="projects"><FolderKanban className="w-4 h-4 mr-1.5" /> Projects</TabsTrigger>
            <TabsTrigger value="case-studies"><BookOpen className="w-4 h-4 mr-1.5" /> Case Studies</TabsTrigger>
            <TabsTrigger value="discussions" data-testid="admin-tab-discussions"><MessageSquare className="w-4 h-4 mr-1.5" /> Discussions</TabsTrigger>
            <TabsTrigger value="members" data-testid="admin-tab-members"><Users className="w-4 h-4 mr-1.5" /> Members</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 className="w-4 h-4 mr-1.5" /> Activity</TabsTrigger>
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

            {/* Team Management Dialog */}
            <Dialog open={!!teamMgmtProject} onOpenChange={(open) => { if (!open) setTeamMgmtProject(null); }}>
              <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Team Formation: {teamMgmtProject?.title}</DialogTitle></DialogHeader>
                {teamMgmtProject && <TeamManagement project={teamMgmtProject} onRefresh={fetchData} />}
              </DialogContent>
            </Dialog>

            <div className="space-y-3">
              {projects.map(p => (
                <div key={p.project_id} className="bg-white border border-slate-200 rounded-xl p-5" data-testid={`admin-project-${p.project_id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900">{p.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {p.group_size && <Badge variant="outline" className="text-xs"><Users className="w-3 h-3 mr-1" /> {p.group_size} per team</Badge>}
                        {p.skills_required?.map(s => <Badge key={s} className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">{s}</Badge>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      <button onClick={() => setTeamMgmtProject(p)} className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors" title="Manage Teams" data-testid={`manage-teams-${p.project_id}`}>
                        <Users className="w-4 h-4" />
                      </button>
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
                    <div className="flex items-center gap-1 shrink-0">
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

          {/* Discussions Tab */}
          <TabsContent value="discussions" className="mt-4">
            <div className="space-y-3">
              {discussions.map(d => (
                <div key={d.discussion_id} className="bg-white border border-slate-200 rounded-xl p-5" data-testid={`admin-disc-${d.discussion_id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900">{d.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{d.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span>By {d.author_name}</span>
                        <span>{d.message_count || 0} replies</span>
                        <span>{new Date(d.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteDiscussion(d.discussion_id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors shrink-0 ml-4"
                      title="Delete discussion"
                      data-testid={`delete-disc-${d.discussion_id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {discussions.length === 0 && <div className="text-center py-12 text-sm text-slate-400">No discussions yet</div>}
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-4">
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  placeholder="Search members..."
                  className="pl-10 bg-white border-slate-200"
                  data-testid="admin-member-search"
                />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <ScrollArea className="max-h-[600px]">
                <table className="w-full" data-testid="admin-members-table">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Member</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                      <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Joined</th>
                      <th className="text-right px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredMembers.map(m => (
                      <tr key={m.user_id} className={`hover:bg-slate-50/50 ${m.is_blocked ? 'opacity-60' : ''}`}>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            {m.picture ? <img src={m.picture} alt="" className="w-8 h-8 rounded-full" /> :
                              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold">{m.name?.[0]}</div>}
                            <div>
                              <p className="text-sm font-medium text-slate-900">{m.name}</p>
                              <p className="text-xs text-slate-400">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{m.current_role || '-'}</td>
                        <td className="text-center px-4 py-3">
                          {m.is_blocked ? (
                            <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">Blocked</Badge>
                          ) : m.onboarding_complete ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Active</Badge>
                          ) : (
                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">Pending</Badge>
                          )}
                        </td>
                        <td className="text-center px-4 py-3 text-xs text-slate-400 font-mono">
                          {new Date(m.created_at).toLocaleDateString()}
                        </td>
                        <td className="text-right px-6 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {m.is_blocked ? (
                              <button
                                onClick={() => unblockMember(m.user_id, m.name)}
                                className="p-2 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors"
                                title="Unblock member"
                                data-testid={`unblock-member-${m.user_id}`}
                              >
                                <Unlock className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => blockMember(m.user_id, m.name)}
                                className="p-2 hover:bg-amber-50 rounded-lg text-slate-400 hover:text-amber-600 transition-colors"
                                title="Block member"
                                data-testid={`block-member-${m.user_id}`}
                              >
                                <ShieldBan className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => removeMember(m.user_id, m.name)}
                              className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                              title="Remove member permanently"
                              data-testid={`remove-member-${m.user_id}`}
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredMembers.length === 0 && (
                  <div className="text-center py-12 text-sm text-slate-400">
                    {memberSearch ? 'No members match your search' : 'No members yet'}
                  </div>
                )}
              </ScrollArea>
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
