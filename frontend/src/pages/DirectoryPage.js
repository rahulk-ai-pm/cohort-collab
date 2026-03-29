import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Linkedin, ExternalLink } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DirectoryPage() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`${API}/members`, { withCredentials: true })
      .then(res => setMembers(res.data))
      .catch(() => {});
  }, []);

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.current_role?.toLowerCase().includes(search.toLowerCase()) ||
    m.aspirations?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50" data-testid="directory-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Cohort Directory</h1>
          <p className="text-slate-500 mt-1">{members.length} members in Batch 06</p>
        </div>

        <div className="relative mb-6 max-w-md animate-fade-in-up stagger-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            data-testid="directory-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, role, or aspirations..."
            className="pl-10 bg-white border-slate-200"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m, i) => (
            <div
              key={m.user_id}
              className={`bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200 animate-fade-in-up stagger-${(i % 5) + 1}`}
              data-testid={`member-card-${m.user_id}`}
            >
              <div className="flex items-start gap-3">
                {m.picture ? (
                  <img src={m.picture} alt="" className="w-11 h-11 rounded-full shrink-0" />
                ) : (
                  <div className="w-11 h-11 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                    {m.name?.[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm truncate">{m.name}</h3>
                  <p className="text-xs text-slate-500 truncate">{m.current_role}</p>
                </div>
              </div>
              {m.aspirations && (
                <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">{m.aspirations}</p>
              )}
              {m.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {m.skills.slice(0, 3).map(s => (
                    <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-md font-medium">{s}</span>
                  ))}
                  {m.skills.length > 3 && <span className="text-[10px] text-slate-400">+{m.skills.length - 3}</span>}
                </div>
              )}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                {m.linkedin_url && (
                  <a href={m.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Linkedin className="w-3 h-3" /> Profile <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-sm text-slate-400">
              {search ? 'No members match your search' : 'No members have joined yet'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
