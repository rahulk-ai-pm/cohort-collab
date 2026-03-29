import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, FileText, ExternalLink, Linkedin, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, recRes] = await Promise.all([
          axios.get(`${API}/projects/${id}`, { withCredentials: true }),
          axios.get(`${API}/projects/${id}/recommendations`, { withCredentials: true }),
        ]);
        setProject(projRes.data);
        setRecommendations(recRes.data);
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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{project.title}</h1>
              {project.group_size && (
                <Badge variant="outline" className="mt-2">
                  <Users className="w-3 h-3 mr-1" /> Group size: {project.group_size}
                </Badge>
              )}
            </div>
          </div>
          <p className="text-slate-600 mt-4 leading-relaxed">{project.description}</p>
          {project.context && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Context</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{project.context}</p>
            </div>
          )}
        </div>

        <Tabs defaultValue="recommendations" className="animate-fade-in-up stagger-1">
          <TabsList className="bg-white border border-slate-200">
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
                  {m.aspirations && <p className="text-xs text-slate-600 mt-2 line-clamp-2">{m.aspirations}</p>}
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
