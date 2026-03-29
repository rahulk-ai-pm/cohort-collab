import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, MessageSquare, Clock, ChevronRight } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CaseStudiesPage() {
  const [studies, setStudies] = useState([]);

  useEffect(() => {
    axios.get(`${API}/case-studies`, { withCredentials: true })
      .then(res => setStudies(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="case-studies-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Case Studies</h1>
          <p className="text-slate-500 mt-1">Explore and discuss program case studies</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {studies.map((s, i) => (
            <Link
              key={s.case_study_id}
              to={`/case-studies/${s.case_study_id}`}
              className={`group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200 animate-fade-in-up stagger-${(i % 5) + 1}`}
              data-testid={`case-study-card-${s.case_study_id}`}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{s.title}</h3>
              <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">{s.description}</p>
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {new Date(s.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
          {studies.length === 0 && (
            <div className="col-span-full text-center py-16 text-sm text-slate-400">No case studies added yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
