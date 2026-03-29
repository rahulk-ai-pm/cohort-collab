import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Users, Clock, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    axios.get(`${API}/projects`, { withCredentials: true })
      .then(res => setProjects(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="projects-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-slate-500 mt-1">Explore program projects and find team members</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p, i) => (
            <Link
              key={p.project_id}
              to={`/projects/${p.project_id}`}
              className={`group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200 animate-fade-in-up stagger-${(i % 5) + 1}`}
              data-testid={`project-card-${p.project_id}`}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center mb-3">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{p.title}</h3>
              <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">{p.description}</p>
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100">
                {p.group_size && (
                  <Badge variant="outline" className="text-xs">
                    <Users className="w-3 h-3 mr-1" /> {p.group_size} per team
                  </Badge>
                )}
                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {new Date(p.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full text-center py-16 text-sm text-slate-400">No projects added yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
