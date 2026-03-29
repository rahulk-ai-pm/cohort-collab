import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Users, FileText, ExternalLink, Linkedin, Sparkles, Heart, CheckCircle, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

function TeamPreferencesPanel({ projectId, members }) {
  const { user } = useAuth();
  const [pref, setPref] = useState({ preferred_teammates: [], skills_offered: [], skills_wanted: [] });
  const [saving, setSaving] = useState(false);
  const [prefCount, setPrefCount] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`${API}/projects/${projectId}/my-preference`, { withCredentials: true })
      .then(res => { if (res.data && res.data.user_id) setPref(res.data); }).catch(() => {});
    axios.get(`${API}/projects/${projectId}/preferences/count`, { withCredentials: true })
      .then(res => setPrefCount(res.data.count)).catch(() => {});
  }, [projectId]);

  const toggleItem = (field, value) => {
    setPref(p => ({
      ...p,
      [field]: p[field]?.includes(value) ? p[field].filter(v => v !== value) : [...(p[field] || []), value]
    }));
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/projects/${projectId}/preferences`, {
        preferred_teammates: pref.preferred_teammates,
        skills_offered: pref.skills_offered,
        skills_wanted: pref.skills_wanted
      }, { withCredentials: true });
      toast.success('Preferences saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const otherMembers = members.filter(m => m.user_id !== user?.user_id);
  const filteredMembers = otherMembers.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.current_role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm text-blue-800"><strong>{prefCount}</strong> members have submitted preferences so far.</p>
      </div>

      {/* Preferred Teammates */}
      <div>
        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-500" /> Preferred Teammates
          <span className="text-xs text-slate-400 font-normal">(select up to 3)</span>
        </h4>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search members..."
          className="w-full mb-3 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50"
          data-testid="pref-search-members"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[240px] overflow-y-auto">
          {filteredMembers.map(m => {
            const selected = pref.preferred_teammates?.includes(m.user_id);
            return (
              <button
                key={m.user_id}
                onClick={() => {
                  if (!selected && (pref.preferred_teammates?.length || 0) >= 3) {
                    toast.error('Max 3 preferred teammates');
                    return;
                  }
                  toggleItem('preferred_teammates', m.user_id);
                }}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                  selected ? 'border-slate-800 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                }`}
                data-testid={`pref-teammate-${m.user_id}`}
              >
                {m.picture ? <img src={m.picture} alt="" className="w-8 h-8 rounded-full" /> :
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold">{m.name?.[0]}</div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{m.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{m.current_role}</p>
                </div>
                {selected && <CheckCircle className="w-4 h-4 text-slate-800 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Skills Offered */}
      <div>
        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> Skills You Bring
        </h4>
        <div className="flex flex-wrap gap-2" data-testid="pref-skills-offered">
          {ALL_SKILLS.map(skill => (
            <button key={skill} onClick={() => toggleItem('skills_offered', skill)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                pref.skills_offered?.includes(skill) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >{skill}</button>
          ))}
        </div>
      </div>

      {/* Skills Wanted */}
      <div>
        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-500" /> Skills You're Looking For
        </h4>
        <div className="flex flex-wrap gap-2" data-testid="pref-skills-wanted">
          {ALL_SKILLS.map(skill => (
            <button key={skill} onClick={() => toggleItem('skills_wanted', skill)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                pref.skills_wanted?.includes(skill) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >{skill}</button>
          ))}
        </div>
      </div>

      <Button onClick={savePreferences} disabled={saving} className="w-full bg-slate-800 hover:bg-slate-900" data-testid="save-preferences-btn">
        {saving ? 'Saving...' : 'Save Preferences'}
      </Button>
    </div>
  );
}

function MyTeamPanel({ projectId }) {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/projects/${projectId}/my-team`, { withCredentials: true })
      .then(res => setTeamData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="py-8 text-center text-sm text-slate-400">Loading...</div>;
  if (!teamData || teamData.status === 'not_published') {
    return (
      <div className="text-center py-12">
        <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Teams haven't been published yet.</p>
        <p className="text-xs text-slate-400 mt-1">Submit your preferences while you wait!</p>
      </div>
    );
  }
  if (teamData.status === 'not_assigned') {
    return <div className="text-center py-12 text-sm text-slate-400">You haven't been assigned to a team yet.</div>;
  }

  const team = teamData.team;
  return (
    <div className="animate-fade-in-up">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-4">
        <h3 className="font-bold text-emerald-900 text-lg">{team.team_name}</h3>
        <p className="text-sm text-emerald-700 mt-1">{team.member_details?.length} members</p>
      </div>
      <div className="space-y-3">
        {team.member_details?.map(m => (
          <div key={m.user_id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3" data-testid={`team-member-${m.user_id}`}>
            {m.picture ? <img src={m.picture} alt="" className="w-10 h-10 rounded-full" /> :
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold">{m.name?.[0]}</div>}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900">{m.name}</p>
              <p className="text-xs text-slate-500">{m.current_role}</p>
              {m.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {m.skills.slice(0, 4).map(s => <Badge key={s} variant="secondary" className="text-[10px] py-0">{s}</Badge>)}
                  {m.skills.length > 4 && <span className="text-[10px] text-slate-400">+{m.skills.length - 4}</span>}
                </div>
              )}
            </div>
            {m.linkedin_url && (
              <a href={m.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                <Linkedin className="w-4 h-4" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, recRes, memRes] = await Promise.all([
          axios.get(`${API}/projects/${id}`, { withCredentials: true }),
          axios.get(`${API}/projects/${id}/recommendations`, { withCredentials: true }),
          axios.get(`${API}/members`, { withCredentials: true }),
        ]);
        setProject(projRes.data);
        setRecommendations(recRes.data);
        setMembers(memRes.data);
      } catch { /* ignore */ }
    };
    fetchData();
  }, [id]);

  if (!project) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="project-detail-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6" data-testid="back-to-projects">
          <ArrowLeft className="w-4 h-4" /> Back to projects
        </Link>

        <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 mb-6 animate-fade-in-up">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{project.title}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {project.group_size && (
                  <Badge variant="outline"><Users className="w-3 h-3 mr-1" /> Group size: {project.group_size}</Badge>
                )}
                {project.skills_required?.map(s => (
                  <Badge key={s} className="bg-blue-50 text-blue-700 border-blue-200 text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          </div>
          <p className="text-slate-600 mt-4 leading-relaxed">{project.description}</p>
          {project.goals && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">Project Goals</p>
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{project.goals}</p>
            </div>
          )}
          {project.context && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Context</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{project.context}</p>
            </div>
          )}
        </div>

        <Tabs defaultValue="my-team" className="animate-fade-in-up stagger-1">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="my-team" data-testid="tab-my-team">
              <Users className="w-4 h-4 mr-1.5" /> My Team
            </TabsTrigger>
            <TabsTrigger value="preferences" data-testid="tab-preferences">
              <Heart className="w-4 h-4 mr-1.5" /> Team Preferences
            </TabsTrigger>
            <TabsTrigger value="recommendations" data-testid="tab-recommendations">
              <Sparkles className="w-4 h-4 mr-1.5" /> Recommended Peers
            </TabsTrigger>
            <TabsTrigger value="files" data-testid="tab-files">
              <FileText className="w-4 h-4 mr-1.5" /> Files
            </TabsTrigger>
            <TabsTrigger value="links" data-testid="tab-links">
              <ExternalLink className="w-4 h-4 mr-1.5" /> Links
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-team" className="mt-4">
            <MyTeamPanel projectId={id} />
          </TabsContent>

          <TabsContent value="preferences" className="mt-4">
            <TeamPreferencesPanel projectId={id} members={members} />
          </TabsContent>

          <TabsContent value="recommendations" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map(m => (
                <div key={m.user_id} className="bg-white border border-slate-200 rounded-xl p-4" data-testid={`rec-${m.user_id}`}>
                  <div className="flex items-center gap-3">
                    {m.picture ? <img src={m.picture} alt="" className="w-10 h-10 rounded-full" /> :
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold">{m.name?.[0]}</div>}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{m.name}</p>
                      <p className="text-xs text-slate-500 truncate">{m.current_role}</p>
                    </div>
                  </div>
                  {m.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {m.skills.slice(0, 4).map(s => <Badge key={s} variant="secondary" className="text-[10px] py-0">{s}</Badge>)}
                    </div>
                  )}
                  {m.linkedin_url && (
                    <a href={m.linkedin_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 mt-2">
                      <Linkedin className="w-3 h-3" /> View Profile
                    </a>
                  )}
                </div>
              ))}
              {recommendations.length === 0 && (
                <div className="col-span-full text-center py-8 text-sm text-slate-400">No recommendations yet</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="files" className="mt-4">
            <div className="space-y-2">
              {project.files?.map(f => (
                <div key={f.file_id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{f.original_filename}</p>
                      <p className="text-xs text-slate-400 font-mono">{(f.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                </div>
              ))}
              {(!project.files || project.files.length === 0) && (
                <div className="text-center py-8 text-sm text-slate-400">No files attached</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="links" className="mt-4">
            <div className="space-y-2">
              {project.links?.map((link, i) => (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                  className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <ExternalLink className="w-4 h-4" /> {link}
                  </div>
                </a>
              ))}
              {(!project.links || project.links.length === 0) && (
                <div className="text-center py-8 text-sm text-slate-400">No links attached</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
