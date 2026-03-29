import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ALL_SKILLS = [
  "Data Analysis", "Market Research", "Product Strategy", "Financial Modeling",
  "Tech/Prototyping", "UX/Design", "Marketing/GTM", "Business Development",
  "Operations", "Leadership", "Project Management", "Agile/Scrum",
  "Consumer Insights", "Competitive Analysis", "Pricing Strategy",
  "Supply Chain", "Digital Marketing", "Sales Strategy"
];

export default function OnboardingPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    professional_experience: '',
    current_role: '',
    aspirations: '',
    linkedin_url: '',
    skills: []
  });
  const [saving, setSaving] = useState(false);

  const toggleSkill = (skill) => {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.professional_experience || !form.current_role || !form.aspirations) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (form.skills.length === 0) {
      toast.error('Please select at least one skill');
      return;
    }
    setSaving(true);
    try {
      const res = await axios.put(`${API}/profile/onboarding`, form, { withCredentials: true });
      setUser(res.data);
      toast.success('Profile completed!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg animate-fade-in-up">
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">Step 1 of 1</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Tell us about yourself
          </h1>
          <p className="text-slate-500 mt-2">This helps your cohort mates get to know you and form better project teams.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            {user?.name && (
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                {user.picture && <img src={user.picture} alt="" className="w-10 h-10 rounded-full" />}
                <div>
                  <p className="font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm font-semibold text-slate-700">Current Role *</Label>
              <Input
                data-testid="onboarding-current-role"
                className="mt-1.5 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-slate-800"
                placeholder="e.g. Senior Product Manager at Google"
                value={form.current_role}
                onChange={e => setForm(f => ({ ...f, current_role: e.target.value }))}
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-slate-700">Professional Experience *</Label>
              <Textarea
                data-testid="onboarding-experience"
                className="mt-1.5 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-slate-800 min-h-[100px]"
                placeholder="Briefly describe your professional background..."
                value={form.professional_experience}
                onChange={e => setForm(f => ({ ...f, professional_experience: e.target.value }))}
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-slate-700">Your Skills *</Label>
              <p className="text-xs text-slate-400 mt-1 mb-2">Select skills or type your own</p>
              <div className="flex flex-wrap gap-2" data-testid="onboarding-skills">
                {ALL_SKILLS.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
                      form.skills.includes(skill)
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                    data-testid={`skill-${skill.toLowerCase().replace(/[\/\s]/g, '-')}`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              {/* Custom skills that aren't in the predefined list */}
              {form.skills.filter(s => !ALL_SKILLS.includes(s)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.skills.filter(s => !ALL_SKILLS.includes(s)).map(s => (
                    <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-white rounded-lg text-xs font-medium">
                      {s}
                      <button type="button" onClick={() => toggleSkill(s)} className="hover:text-slate-300">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Input
                  data-testid="custom-skill-input"
                  placeholder="Type a custom skill and press Enter..."
                  className="bg-slate-50 border-slate-200 text-sm"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = e.target.value.trim();
                      if (val && !form.skills.includes(val)) {
                        setForm(f => ({ ...f, skills: [...f.skills, val] }));
                        e.target.value = '';
                      }
                    }
                  }}
                />
              </div>
              {form.skills.length > 0 && (
                <p className="text-xs text-slate-500 mt-2">{form.skills.length} selected</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-semibold text-slate-700">Aspirations *</Label>
              <Textarea
                data-testid="onboarding-aspirations"
                className="mt-1.5 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-slate-800 min-h-[80px]"
                placeholder="What do you hope to achieve through this program?"
                value={form.aspirations}
                onChange={e => setForm(f => ({ ...f, aspirations: e.target.value }))}
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-slate-700">LinkedIn Profile URL</Label>
              <Input
                data-testid="onboarding-linkedin"
                className="mt-1.5 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-slate-800"
                placeholder="https://linkedin.com/in/yourprofile"
                value={form.linkedin_url}
                onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))}
              />
            </div>
          </div>

          <Button
            data-testid="onboarding-submit"
            type="submit"
            disabled={saving}
            className="w-full h-12 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lg"
          >
            {saving ? 'Saving...' : 'Complete Profile'}
          </Button>
        </form>
      </div>
    </div>
  );
}
