import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import {
  Users, MessageSquare, Bot, FileText, TrendingUp, Activity,
  UserCheck, UserX, BookOpen, FolderKanban
} from 'lucide-react';

const CHART_COLORS = ['#1e293b', '#475569', '#94a3b8', '#cbd5e1', '#e2e8f0'];
const PIE_COLORS = ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9'];

function StatCard({ label, value, sub, icon: Icon, trend }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold text-slate-900 font-mono tracking-tight">{value}</p>
          <p className="text-sm font-semibold text-slate-700 mt-1">{label}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-medium text-emerald-600">{trend}% engagement</span>
        </div>
      )}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-900 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-slate-600">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-mono font-bold text-slate-900">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function AdminAnalytics({ analytics }) {
  if (!analytics) {
    return <div className="text-center py-12 text-sm text-slate-400">Loading analytics...</div>;
  }

  const {
    total_members, onboarded_members, pending_members, blocked_members,
    total_projects, total_case_studies, total_discussions, total_chatbot_queries,
    total_discussion_messages, total_cs_messages, total_files,
    engagement_rate, active_members,
    member_activity, recent_chatbot_queries, daily_activity, skills_distribution
  } = analytics;

  const onboardingData = [
    { name: 'Onboarded', value: onboarded_members },
    { name: 'Pending', value: pending_members },
    { name: 'Blocked', value: blocked_members },
  ];

  return (
    <div className="space-y-6" data-testid="admin-analytics">
      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Members" value={total_members} sub={`${onboarded_members} onboarded`} icon={Users} />
        <StatCard label="Chatbot Queries" value={total_chatbot_queries} icon={Bot} />
        <StatCard label="Discussions" value={total_discussions} sub={`${total_discussion_messages} messages`} icon={MessageSquare} />
        <StatCard label="Engagement" value={`${engagement_rate}%`} sub={`${active_members} active members`} icon={Activity} trend={engagement_rate} />
        <StatCard label="Content" value={total_projects + total_case_studies} sub={`${total_projects} projects, ${total_case_studies} case studies`} icon={FolderKanban} />
      </div>

      {/* Activity Trend + Onboarding Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Trend (spans 2) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6" data-testid="activity-trend-chart">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Activity Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">Last 30 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-800" />Chatbot</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" />Discussions</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-200" />Case Studies</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={daily_activity}>
              <defs>
                <linearGradient id="chatbotGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e293b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1e293b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="discGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="chatbot" name="Chatbot" stroke="#1e293b" strokeWidth={2} fill="url(#chatbotGrad)" />
              <Area type="monotone" dataKey="discussions" name="Discussions" stroke="#94a3b8" strokeWidth={2} fill="url(#discGrad)" />
              <Area type="monotone" dataKey="case_studies" name="Case Studies" stroke="#cbd5e1" strokeWidth={1.5} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Onboarding Funnel */}
        <div className="bg-white border border-slate-200 rounded-xl p-6" data-testid="onboarding-funnel">
          <h3 className="font-semibold text-slate-900 mb-1">Member Status</h3>
          <p className="text-xs text-slate-400 mb-4">Onboarding breakdown</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={onboardingData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>
                {onboardingData.map((entry, i) => (
                  <Cell key={i} fill={['#1e293b', '#94a3b8', '#ef4444'][i]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs mt-2">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-800" />Onboarded ({onboarded_members})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" />Pending ({pending_members})</span>
            {blocked_members > 0 && <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />Blocked ({blocked_members})</span>}
          </div>
        </div>
      </div>

      {/* Skills Distribution + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skills Distribution */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6" data-testid="skills-distribution-chart">
          <h3 className="font-semibold text-slate-900 mb-1">Skills Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">Most common skills across cohort members</p>
          {skills_distribution?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={skills_distribution.slice(0, 12)} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="skill" tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={false} width={120} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Members" fill="#1e293b" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-sm text-slate-400">No skills data yet</div>
          )}
        </div>

        {/* Content Stats */}
        <div className="bg-white border border-slate-200 rounded-xl p-6" data-testid="content-stats">
          <h3 className="font-semibold text-slate-900 mb-4">Content Summary</h3>
          <div className="space-y-4">
            {[
              { icon: FolderKanban, label: 'Projects', value: total_projects, color: 'bg-slate-800' },
              { icon: BookOpen, label: 'Case Studies', value: total_case_studies, color: 'bg-slate-600' },
              { icon: MessageSquare, label: 'Discussions', value: total_discussions, color: 'bg-slate-500' },
              { icon: FileText, label: 'Files Uploaded', value: total_files, color: 'bg-slate-400' },
              { icon: Bot, label: 'AI Queries', value: total_chatbot_queries, color: 'bg-slate-300' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center`}>
                    <item.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-slate-700">{item.label}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 text-lg">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Member Activity Table + Recent Chatbot Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Activity */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" data-testid="member-activity-table">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Member Activity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ranked by total engagement</p>
            </div>
            <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs">{member_activity?.length || 0} members</Badge>
          </div>
          <ScrollArea className="max-h-[420px]">
            <table className="w-full" data-testid="admin-activity-table">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">Member</th>
                  <th className="text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500" title="Chatbot"><Bot className="w-3.5 h-3.5 mx-auto" /></th>
                  <th className="text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500" title="Discussions"><MessageSquare className="w-3.5 h-3.5 mx-auto" /></th>
                  <th className="text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500" title="Case Studies"><BookOpen className="w-3.5 h-3.5 mx-auto" /></th>
                  <th className="text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {member_activity?.map((m, idx) => (
                  <tr key={m.user_id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-mono text-slate-400 w-4">{idx + 1}</span>
                        {m.picture ? <img src={m.picture} alt="" className="w-7 h-7 rounded-full" /> :
                          <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold">{m.name?.[0]}</div>}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{m.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center px-3 py-2.5 font-mono text-sm text-slate-600">{m.chatbot_queries}</td>
                    <td className="text-center px-3 py-2.5 font-mono text-sm text-slate-600">{m.discussion_messages + (m.discussions_created || 0)}</td>
                    <td className="text-center px-3 py-2.5 font-mono text-sm text-slate-600">{m.case_study_messages}</td>
                    <td className="text-center px-3 py-2.5">
                      <span className={`font-mono text-sm font-bold ${m.total_activity > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                        {m.total_activity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!member_activity || member_activity.length === 0) && (
              <div className="text-center py-12 text-sm text-slate-400">No member activity yet</div>
            )}
          </ScrollArea>
        </div>

        {/* Recent Chatbot Queries */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" data-testid="recent-chatbot-queries">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Recent Chatbot Queries</h3>
            <p className="text-xs text-slate-400 mt-0.5">Latest AI assistant interactions</p>
          </div>
          <ScrollArea className="max-h-[420px]">
            <div className="divide-y divide-slate-50">
              {recent_chatbot_queries?.map((q, i) => (
                <div key={i} className="px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                    {q.user_picture ? <img src={q.user_picture} alt="" className="w-7 h-7 rounded-full mt-0.5 shrink-0" /> :
                      <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{q.user_name?.[0]}</div>}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-700">{q.user_name}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {q.created_at ? new Date(q.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{q.query}</p>
                    </div>
                  </div>
                </div>
              ))}
              {(!recent_chatbot_queries || recent_chatbot_queries.length === 0) && (
                <div className="text-center py-12 text-sm text-slate-400">No chatbot queries yet</div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
