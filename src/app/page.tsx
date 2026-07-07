'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Activity, BarChart3, Bell, Building2, CalendarDays, CheckCircle2, Clock3, Download, Edit3, FileText, Filter, Flame, LayoutDashboard, ListTodo, LogOut, MessageCircle, Plus, Search, Settings, ShieldCheck, Sparkles, Target, Trash2, UserPlus, Users, Wand2, Wifi, WifiOff, X } from 'lucide-react';
import { hotels } from '@/lib/hotels';
import { seedTasks } from '@/lib/seed';
import { activeStatuses, categories, checklistPresets, priorities, statuses, Task, Status, Category, User, Role, users } from '@/lib/types';
import { hasSupabase, supabase } from '@/lib/supabase';

type Tab = 'dashboard' | 'kanban' | 'list' | 'hotels' | 'reports' | 'templates' | 'team' | 'admin' | 'settings';
type ManagedUser = User & { active?: boolean; phone?: string; title?: string; dailyTarget?: number };
type Hotel = typeof hotels[number];
type FormState = { id?: string; title: string; hotelId: number; category: Category; priority: Task['priority']; status: Status; assignee: string; manager: string; dueDate: string; description: string; tags: string };
type Template = { id: string; title: string; category: Category; priority: Task['priority']; description: string; checklist: string[]; tags: string[] };

const statusColor: Record<string, CSSProperties> = {
  'جدید': { background:'#e5e7eb', color:'#111827' },
  'در حال پیگیری': { background:'#dbeafe', color:'#1d4ed8' },
  'منتظر پاسخ هتل': { background:'#fef3c7', color:'#92400e' },
  'نیازمند اصلاح': { background:'#ffedd5', color:'#c2410c' },
  'در انتظار تایید': { background:'#ede9fe', color:'#6d28d9' },
  'انجام‌شده': { background:'#dcfce7', color:'#166534' },
  'لغوشده': { background:'#f1f5f9', color:'#475569' }
};
const priorityColor: Record<string, CSSProperties> = {
  'فوری': { background:'#fee2e2', color:'#b91c1c' },
  'بالا': { background:'#ffedd5', color:'#c2410c' },
  'متوسط': { background:'#dbeafe', color:'#1d4ed8' },
  'پایین': { background:'#f3f4f6', color:'#374151' }
};
const roleMap: Record<Role,string> = { admin:'مدیر کل', manager:'سیتی‌منیجر', expert:'کارشناس', content:'پنل/محتوا', capacity:'کنترل ظرفیت' };
const today = () => new Date().toISOString().slice(0,10);
const tomorrow = (days=1) => { const d = new Date(); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); };
const uid = () => (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
const isOverdue = (t: Task) => !['انجام‌شده','لغوشده'].includes(t.status) && t.dueDate < today();
const progress = (t: Task) => t.checklist.length ? Math.round((t.checklist.filter(i => i.done).length / t.checklist.length) * 100) : 0;
const faDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString('fa-IR') : '-';
const normalizeTask = (t: Task): Task => ({
  ...t,
  tags: Array.isArray(t.tags) ? t.tags : [],
  checklist: Array.isArray(t.checklist) ? t.checklist : [],
  comments: Array.isArray(t.comments) ? t.comments : [],
  activities: Array.isArray(t.activities) ? t.activities : [],
  updatedAt: t.updatedAt || new Date().toISOString(),
  createdAt: t.createdAt || new Date().toISOString(),
  dueDate: t.dueDate || today(),
});

const defaultTemplates: Template[] = [
  { id:'tpl-capacity-peak', title:'دریافت ظرفیت پیک', category:'ظرفیت', priority:'فوری', description:'پیگیری ظرفیت باز برای تاریخ‌های پیک و ثبت نتیجه در پنل.', checklist:['تماس با هتل','دریافت تاریخ‌ها','دریافت نوع اتاق و نرخ','ثبت در پنل','تست نمایش در سایت','اعلام نتیجه'], tags:['پیک','ظرفیت'] },
  { id:'tpl-price-check', title:'بررسی اختلاف قیمت', category:'قیمت', priority:'بالا', description:'بررسی نرخ ایران‌هتل با نرخ رقبا و اصلاح در صورت نیاز.', checklist:['بررسی نرخ سایت','بررسی رقیب','ثبت اختلاف','هماهنگی با هتل','اصلاح نرخ','تایید نهایی'], tags:['قیمت','رقبا'] },
  { id:'tpl-contract-renew', title:'تمدید قرارداد', category:'قرارداد', priority:'بالا', description:'پیگیری تمدید قرارداد هتل و دریافت نسخه مهرشده.', checklist:['بررسی وضعیت قرارداد','ارسال فایل','پیگیری امضا','دریافت نسخه مهرشده','ثبت در سیستم','اطلاع به مالی'], tags:['قرارداد'] },
  { id:'tpl-panel-training', title:'آموزش پنل آی‌هتل', category:'پنل', priority:'متوسط', description:'ارسال دسترسی، آموزش اولیه و تست ورود هتل به پنل.', checklist:['تماس با هتل','ارسال دسترسی','آموزش اولیه','تست ورود','ثبت نتیجه'], tags:['پنل','آموزش'] },
  { id:'tpl-content-update', title:'تکمیل محتوای هتل', category:'محتوا', priority:'متوسط', description:'دریافت عکس‌ها، اصلاح امکانات، قوانین و توضیحات هتل.', checklist:['دریافت عکس','بررسی کیفیت','اصلاح امکانات','اصلاح قوانین','تایید محتوا'], tags:['محتوا','عکس'] }
];

export default function App(){
  const [mounted, setMounted] = useState(false);
  const [logged, setLogged] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(users[0]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<ManagedUser[]>(users.map((u:any) => ({...u, active:true, dailyTarget: 8})));
  const [templates, setTemplates] = useState<Template[]>(defaultTemplates);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'همه'|Status>('همه');
  const [assigneeFilter, setAssigneeFilter] = useState('همه');
  const [categoryFilter, setCategoryFilter] = useState<'همه'|Category>('همه');
  const [hotelFilter, setHotelFilter] = useState<Hotel|null>(null);
  const [selected, setSelected] = useState<Task|null>(null);
  const [hotelModal, setHotelModal] = useState<Hotel|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [syncMode, setSyncMode] = useState<'local'|'supabase'>(hasSupabase ? 'supabase' : 'local');
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [form, setForm] = useState<FormState>({ title:'', hotelId:Number(hotels[0]?.id || 1), category:'ظرفیت', priority:'متوسط', status:'جدید', assignee:'', manager:'محمدباقر ذوالفقاری', dueDate:today(), description:'', tags:'' });

  const activeMembers = teamMembers.filter(u => u.active !== false);
  const expertNames = activeMembers.filter(u => !['admin','manager'].includes(u.role)).map(u => u.name);
  const managerNames = activeMembers.filter(u => ['admin','manager'].includes(u.role)).map(u => u.name);
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => { setMounted(true); loadAll(); try{ const raw=sessionStorage.getItem('iho_current_user_v4'); if(raw){ setCurrentUser(JSON.parse(raw)); setLogged(true); } }catch{} }, []);
  useEffect(() => { if (!mounted) return; localStorage.setItem('iho_tasks_v3', JSON.stringify(tasks)); }, [tasks, mounted]);
  useEffect(() => { if (!mounted) return; localStorage.setItem('iho_team_v3', JSON.stringify(teamMembers)); }, [teamMembers, mounted]);
  useEffect(() => { if (!mounted) return; localStorage.setItem('iho_templates_v3', JSON.stringify(templates)); }, [templates, mounted]);
  useEffect(() => {
    if (!hasSupabase || !supabase) return;
    const channel = supabase.channel('iho-v3-realtime')
      .on('postgres_changes', { event:'*', schema:'public', table:'iho_tasks' }, () => loadTasks(false))
      .on('postgres_changes', { event:'*', schema:'public', table:'iho_team_members' }, () => loadTeam())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadAll(){
    await Promise.all([loadTasks(true), loadTeam(), loadTemplates()]);
  }
  async function loadTasks(showLoading = true){
    if(showLoading) setLoading(true);
    try{
      if(hasSupabase && supabase){
        const { data, error } = await supabase.from('iho_tasks').select('id,payload').order('updated_at', { ascending:false });
        if(error) throw error;
        if(data && data.length){ setTasks(data.map((r:any)=>normalizeTask(r.payload as Task))); setSyncMode('supabase'); setLoading(false); return; }
      }
    }catch(e){ console.warn('Supabase task load failed', e); setSyncMode('local'); }
    try{
      const raw = localStorage.getItem('iho_tasks_v3') || localStorage.getItem('iho_tasks_v2') || localStorage.getItem('iho_tasks');
      setTasks(raw ? JSON.parse(raw).map(normalizeTask) : seedTasks.map(normalizeTask));
    }catch{ setTasks(seedTasks.map(normalizeTask)); }
    setLoading(false);
  }
  async function loadTeam(){
    try{
      if(hasSupabase && supabase){
        const { data, error } = await supabase.from('iho_team_members').select('id,payload').order('updated_at', { ascending:false });
        if(!error && data && data.length){ setTeamMembers(data.map((r:any)=>r.payload as ManagedUser)); return; }
      }
    }catch(e){ console.warn('Supabase team load failed', e); }
    try{ const raw = localStorage.getItem('iho_team_v3') || localStorage.getItem('iho_team_members_v25'); if(raw) setTeamMembers(JSON.parse(raw)); }catch{}
  }
  function loadTemplates(){
    try{ const raw = localStorage.getItem('iho_templates_v3'); if(raw) setTemplates(JSON.parse(raw)); }catch{}
  }
  async function saveTeam(next: ManagedUser[]){
    const clean = next.map(({newPassword, ...m}: any) => m) as ManagedUser[];
    setTeamMembers(clean);
    try{
      const res = await fetch('/api/team', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ members: next }) });
      if(!res.ok) throw new Error(await res.text());
      setSyncMode('supabase');
    }catch(e){
      console.warn('Team API save failed, fallback to client upsert', e);
      if(hasSupabase && supabase){
        const results = await Promise.all(clean.map(m => supabase.from('iho_team_members').upsert({ id:m.id, payload:m })));
        const failed = results.find((r:any)=>r.error);
        if(failed) alert('ذخیره آنلاین تیم انجام نشد: '+failed.error.message);
        else setSyncMode('supabase');
      }
    }
  }
  async function upsertTask(task: Task){
    const next = [task, ...tasks.filter(t => t.id !== task.id)];
    setTasks(next);
    if(hasSupabase && supabase){ await supabase.from('iho_tasks').upsert({ id:task.id, payload:task }); setSyncMode('supabase'); }
  }
  async function removeTask(id: string){
    if(!confirm('این تسک حذف شود؟')) return;
    const next = tasks.filter(t => t.id !== id); setTasks(next);
    if(hasSupabase && supabase) await supabase.from('iho_tasks').delete().eq('id', id);
    setSelected(null);
  }
  async function authenticate(userId: string, password: string){
    setLoginError('');
    try{
      const res = await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId, password }) });
      const json = await res.json().catch(()=>({}));
      if(!res.ok || !json.ok) throw new Error(json.error || 'ورود ناموفق بود');
      setCurrentUser(json.user);
      sessionStorage.setItem('iho_current_user_v4', JSON.stringify(json.user));
      setLogged(true);
    }catch(e:any){
      setLoginError(e?.message || 'رمز عبور اشتباه است');
    }
  }
  function scopeAllows(t: Task){
    if(currentUser.role === 'admin') return true;
    if(currentUser.role === 'manager') return t.manager === currentUser.name || currentUser.cityScope?.includes(t.city) || teamMembers.find(m=>m.name===t.assignee)?.team === currentUser.team;
    return t.assignee === currentUser.name || t.createdBy === currentUser.name;
  }
  const visible = useMemo(() => tasks
    .filter(scopeAllows)
    .filter(t => !hotelFilter || t.hotelId === Number(hotelFilter.id))
    .filter(t => statusFilter === 'همه' || t.status === statusFilter)
    .filter(t => assigneeFilter === 'همه' || t.assignee === assigneeFilter)
    .filter(t => categoryFilter === 'همه' || t.category === categoryFilter)
    .filter(t => !q || [t.title,t.hotelName,t.city,t.assignee,t.manager,t.category,t.status,t.priority,...t.tags].join(' ').toLowerCase().includes(q.toLowerCase())),
    [tasks, currentUser, q, hotelFilter, statusFilter, assigneeFilter, categoryFilter, teamMembers]
  );
  const kpi = {
    all: visible.length,
    open: visible.filter(t => activeStatuses.includes(t.status)).length,
    done: visible.filter(t => t.status === 'انجام‌شده').length,
    late: visible.filter(isOverdue).length,
    urgent: visible.filter(t => t.priority === 'فوری').length,
    waiting: visible.filter(t => t.status === 'منتظر پاسخ هتل').length,
    approval: visible.filter(t => t.status === 'در انتظار تایید').length,
  };
  const healthScore = Math.max(0, Math.round(100 - (kpi.late * 6) - (kpi.urgent * 2) + (kpi.done * 1.2)));

  function emptyForm(hotel?: Hotel): FormState { return { title:'', hotelId:Number(hotel?.id || hotels[0]?.id || 1), category:'ظرفیت', priority:'متوسط', status:'جدید', assignee:expertNames[0] || users.find(u=>!['admin','manager'].includes(u.role))?.name || '', manager:managerNames[0] || 'محمدباقر ذوالفقاری', dueDate:today(), description:'', tags:'' }; }
  function openCreate(hotel?: Hotel, tpl?: Template){
    const base = emptyForm(hotel);
    setForm(tpl ? {...base, title:tpl.title, category:tpl.category, priority:tpl.priority, description:tpl.description, tags:tpl.tags.join('، ')} : base);
    setShowForm(true);
  }
  function openEdit(task: Task){
    setForm({ id:task.id, title:task.title, hotelId:task.hotelId, category:task.category, priority:task.priority, status:task.status, assignee:task.assignee, manager:task.manager, dueDate:task.dueDate, description:task.description, tags:task.tags.join('،') });
    setSelected(null); setShowForm(true);
  }
  async function saveForm(){
    const h = hotels.find(x => Number(x.id) === Number(form.hotelId)) || hotels[0];
    const old = tasks.find(t => t.id === form.id);
    const preset = checklistPresets[form.category] || ['اقدام','ثبت نتیجه'];
    const now = new Date().toISOString();
    const task: Task = old ? {
      ...old,
      title: form.title || 'بدون عنوان', hotelId:Number(h.id), hotelName:String((h as any).name), city:String((h as any).city), category:form.category, priority:form.priority, status:form.status, assignee:form.assignee, manager:form.manager, dueDate:form.dueDate, description:form.description,
      tags: form.tags.split(/[،,]/).map(x=>x.trim()).filter(Boolean), updatedAt: now, completedAt: form.status === 'انجام‌شده' ? (old.completedAt || now) : undefined,
      activities:[...old.activities, { id:uid(), user:currentUser.name, action:'تسک ویرایش شد', at:now }]
    } : {
      id:'T-'+Math.floor(10000+Math.random()*90000), title:form.title || 'تسک جدید', hotelId:Number(h.id), hotelName:String((h as any).name), city:String((h as any).city), category:form.category, priority:form.priority, status:form.status, assignee:form.assignee, manager:form.manager, dueDate:form.dueDate, description:form.description,
      checklist: preset.map(title => ({ id:uid(), title, done:false })), comments:[], activities:[{ id:uid(), user:currentUser.name, action:'تسک ایجاد شد', at:now }], createdBy:currentUser.name, createdAt:now, updatedAt:now,
      tags: form.tags.split(/[،,]/).map(x=>x.trim()).filter(Boolean)
    };
    await upsertTask(normalizeTask(task)); setShowForm(false);
  }
  async function patchTask(id: string, patch: Partial<Task>, action: string){
    const old = tasks.find(t => t.id === id); if(!old) return;
    const now = new Date().toISOString();
    const next = normalizeTask({ ...old, ...patch, updatedAt:now, completedAt: patch.status === 'انجام‌شده' ? (old.completedAt || now) : old.completedAt, activities:[...old.activities, { id:uid(), user:currentUser.name, action, at:now }] });
    await upsertTask(next); setSelected(next);
  }
  function exportCsv(){
    const header = ['ID','عنوان','هتل','شهر','دسته','اولویت','وضعیت','مسئول','مدیر','ددلاین','تاریخ ایجاد','توضیحات'];
    const rows = visible.map(t => [t.id,t.title,t.hotelName,t.city,t.category,t.priority,t.status,t.assignee,t.manager,t.dueDate,t.createdAt,t.description]);
    const csv = [header, ...rows].map(r => r.map(x => `"${String(x ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff'+csv], { type:'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `iho-task-center-${today()}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }
  async function createFromTemplate(tpl: Template, selectedHotels: Hotel[], assignee: string, manager: string){
    const now = new Date().toISOString();
    const nextTasks = selectedHotels.slice(0,50).map(h => normalizeTask({
      id:'T-'+Math.floor(10000+Math.random()*90000)+'-'+String(h.id), title:tpl.title, hotelId:Number(h.id), hotelName:String((h as any).name), city:String((h as any).city), category:tpl.category, priority:tpl.priority, status:'جدید', assignee, manager, dueDate:tomorrow(tpl.priority === 'فوری' ? 0 : 2), description:tpl.description,
      checklist:tpl.checklist.map(c=>({id:uid(),title:c,done:false})), comments:[], activities:[{id:uid(),user:currentUser.name,action:'ایجاد گروهی از قالب',at:now}], createdBy:currentUser.name, createdAt:now, updatedAt:now, tags:tpl.tags
    }));
    const merged = [...nextTasks, ...tasks]; setTasks(merged);
    if(hasSupabase && supabase){ await Promise.all(nextTasks.map(t => supabase.from('iho_tasks').upsert({ id:t.id, payload:t }))); }
    alert(`${nextTasks.length} تسک ایجاد شد.`);
  }

  if(!mounted || loading) return <Splash />;
  if(!logged) return <Login users={teamMembers.filter(u=>u.active!==false)} authenticate={authenticate} loginError={loginError} />;

  const tabs: { id:Tab; label:string; icon:any; adminOnly?:boolean }[] = [
    { id:'dashboard', label:'داشبورد Super', icon:<LayoutDashboard size={17}/> },
    { id:'kanban', label:'کارتابل', icon:<ListTodo size={17}/> },
    { id:'list', label:'لیست تسک‌ها', icon:<Filter size={17}/> },
    { id:'hotels', label:'هتل‌ها', icon:<Building2 size={17}/> },
    { id:'reports', label:'گزارش‌ها', icon:<BarChart3 size={17}/> },
    { id:'templates', label:'قالب‌ها', icon:<Wand2 size={17}/>, adminOnly:true },
    { id:'team', label:'تیم', icon:<Users size={17}/> },
    { id:'admin', label:'مدیریت کارشناس‌ها', icon:<ShieldCheck size={17}/>, adminOnly:true },
    { id:'settings', label:'تنظیمات', icon:<Settings size={17}/>, adminOnly:true },
  ].filter(t => !t.adminOnly || isAdmin);

  return <main className="min-h-screen">
    <Header currentUser={currentUser} syncMode={syncMode} logout={()=>{setLogged(false);setTab('dashboard')}} healthScore={healthScore} />
    <div className="max-w-[1500px] mx-auto px-4 py-5">
      <section className="hero card p-5 mb-4">
        <div>
          <p className="text-sm text-teal-700 font-black flex gap-2 items-center"><Sparkles size={18}/> IHO Task Center Enterprise V3</p>
          <h1 className="text-3xl md:text-4xl font-black mt-2">مرکز فرماندهی تیم تأمین ایران‌هتل</h1>
          <p className="text-gray-500 mt-2">تسک، هتل، کارشناس، KPI، پیگیری و گزارش مدیریتی در یک پنل آنلاین.</p>
        </div>
        <div className="heroScore"><span>امتیاز سلامت کارتابل</span><b>{healthScore}</b><small>از ۱۰۰</small></div>
      </section>

      <section className="card p-3 mb-4 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">{tabs.map(t => <button key={t.id} className={'navTab '+(tab===t.id?'active':'')} onClick={()=>setTab(t.id)}>{t.icon}{t.label}</button>)}</div>
        <div className="flex flex-wrap gap-2"><button className="btn" onClick={()=>openCreate()}><Plus size={17}/> تسک جدید</button><button className="btn secondary" onClick={exportCsv}><Download size={17}/> خروجی CSV</button></div>
      </section>

      {['kanban','list','hotels','reports'].includes(tab) && <Filters q={q} setQ={setQ} statusFilter={statusFilter} setStatusFilter={setStatusFilter} assigneeFilter={assigneeFilter} setAssigneeFilter={setAssigneeFilter} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} teamMembers={teamMembers} hotelFilter={hotelFilter} clearHotel={()=>setHotelFilter(null)} />}

      {tab==='dashboard' && <Dashboard visible={visible} tasks={tasks} kpi={kpi} openTask={setSelected} teamMembers={teamMembers} openCreate={openCreate} setTab={setTab} />}
      {tab==='kanban' && <Kanban visible={visible} patchTask={patchTask} openTask={setSelected} />}
      {tab==='list' && <TaskList visible={visible} openTask={setSelected} patchTask={patchTask} />}
      {tab==='hotels' && <HotelsPage q={q} tasks={tasks} openHotel={setHotelModal} openCreate={openCreate} setHotelFilter={setHotelFilter} />}
      {tab==='reports' && <Reports tasks={visible} members={teamMembers} />}
      {tab==='templates' && isAdmin && <TemplatesPage templates={templates} setTemplates={setTemplates} openCreate={openCreate} createFromTemplate={createFromTemplate} teamMembers={teamMembers} />}
      {tab==='team' && <TeamPage tasks={tasks} members={teamMembers} />}
      {tab==='admin' && isAdmin && <AdminTeamPage members={teamMembers} setMembers={saveTeam} tasks={tasks} />}
      {tab==='settings' && isAdmin && <SettingsPage syncMode={syncMode} tasks={tasks} setTasks={setTasks} />}
    </div>
    {showForm && <TaskForm form={form} setForm={setForm} save={saveForm} close={()=>setShowForm(false)} teamMembers={teamMembers} />}
    {selected && <TaskModal task={selected} currentUser={currentUser} patchTask={patchTask} removeTask={removeTask} close={()=>setSelected(null)} openEdit={openEdit} />}
    {hotelModal && <HotelModal hotel={hotelModal} tasks={tasks.filter(t=>t.hotelId===Number(hotelModal.id))} close={()=>setHotelModal(null)} openTask={setSelected} openCreate={openCreate} />}
  </main>;
}

function Splash(){ return <div className="min-h-screen flex items-center justify-center"><div className="card p-8 text-center"><div className="mx-auto w-16 h-16 rounded-3xl bg-teal-50 flex items-center justify-center text-teal-700 mb-4"><Sparkles size={32}/></div><h1 className="text-2xl font-black">در حال آماده‌سازی کارتابل تأمین...</h1><p className="text-gray-500 mt-2">IHO Task Center Enterprise</p></div></div>; }
function Login({users:members,authenticate,loginError}:any){
  const [selectedId,setSelectedId]=useState(members?.[0]?.id || '');
  const [password,setPassword]=useState('');
  const selected = members.find((m:ManagedUser)=>m.id===selectedId) || members[0];
  function submit(e?: any){ e?.preventDefault?.(); if(!selected?.id) return; authenticate(selected.id, password); }
  return <div className="min-h-screen flex items-center justify-center p-4 bgLogin"><div className="card p-7 w-full max-w-4xl"><div className="text-center mb-6"><div className="mx-auto w-16 h-16 rounded-3xl bg-teal-600 text-white flex items-center justify-center mb-4"><Building2 size={31}/></div><h1 className="text-3xl font-black">IHO Task Center Enterprise</h1><p className="text-gray-500 mt-2">کاربر را انتخاب کن و با رمز عبور وارد شو.</p></div><div className="grid lg:grid-cols-2 gap-5"><div className="grid gap-3 max-h-[430px] overflow-auto pl-1">{members.map((u:ManagedUser)=><button key={u.id} type="button" onClick={()=>{setSelectedId(u.id);setPassword('');}} className="loginUser" style={selectedId===u.id?{borderColor:'#0f766e',background:'#ecfeff'}:{}}><div className="flex items-center gap-3"><div className="avatar">{u.name.slice(0,1)}</div><div className="text-right"><b>{u.name}</b><p className="text-sm text-gray-500">{roleMap[u.role]} | {u.team}</p></div></div>{u.role==='admin'&&<span className="badge" style={{background:'#dcfce7',color:'#166534'}}>مدیر</span>}</button>)}</div><form onSubmit={submit} className="card p-5 bg-white"><h2 className="text-xl font-black mb-2">ورود امن</h2><p className="text-gray-500 mb-4">{selected ? selected.name : 'یک کاربر انتخاب کن'}</p><label className="block text-sm font-bold mb-2">رمز عبور</label><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="رمز عبور را وارد کن" autoFocus/><button className="btn w-full mt-4" type="submit"><ShieldCheck size={17}/> ورود به پنل</button>{loginError&&<p className="mt-3 text-red-600 font-bold">{loginError}</p>}<div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-gray-500 leading-7">رمز پیش‌فرض اولیه برای همه کاربران: <b>123456</b><br/>مدیر می‌تواند از بخش مدیریت تیم برای هر نفر رمز جدا تنظیم کند.</div></form></div></div></div>;
}
function Header({currentUser,syncMode,logout,healthScore}:any){ return <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b"><div className="max-w-[1500px] mx-auto px-4 py-3 flex flex-wrap justify-between gap-3 items-center"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center"><Building2/></div><div><b>کارتابل تأمین ایران‌هتل</b><p className="text-xs text-gray-500">{currentUser.name} | {roleMap[currentUser.role]}</p></div></div><div className="flex gap-2 items-center flex-wrap"><span className="badge" style={{background:healthScore>70?'#dcfce7':'#fee2e2', color:healthScore>70?'#166534':'#991b1b'}}><Target size={14}/> Health {healthScore}</span><span className="badge" style={{background:syncMode==='supabase'?'#dcfce7':'#fef3c7', color:syncMode==='supabase'?'#166534':'#92400e'}}>{syncMode==='supabase'?<Wifi size={14}/>:<WifiOff size={14}/>} {syncMode==='supabase'?'Online':'Local'}</span><button className="btn secondary" onClick={logout}><LogOut size={16}/> خروج</button></div></div></header>; }
function Filters(props:any){ const {q,setQ,statusFilter,setStatusFilter,assigneeFilter,setAssigneeFilter,categoryFilter,setCategoryFilter,teamMembers,hotelFilter,clearHotel}=props; return <section className="card p-4 mb-4 grid md:grid-cols-5 gap-3"><div className="relative"><Search className="absolute right-3 top-3 text-gray-400" size={17}/><input className="input pr-9" placeholder="جستجو..." value={q} onChange={e=>setQ(e.target.value)}/></div><select className="input" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>همه</option>{statuses.map(s=><option key={s}>{s}</option>)}</select><select className="input" value={assigneeFilter} onChange={e=>setAssigneeFilter(e.target.value)}><option>همه</option>{teamMembers.filter((m:ManagedUser)=>m.active!==false).map((m:ManagedUser)=><option key={m.id}>{m.name}</option>)}</select><select className="input" value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option>همه</option>{categories.map(c=><option key={c}>{c}</option>)}</select><div>{hotelFilter ? <button className="btn secondary w-full" onClick={clearHotel}><X size={16}/> فیلتر هتل: {String((hotelFilter as any).name)}</button> : <span className="badge h-full w-full justify-center" style={{background:'#f8fafc'}}>بدون فیلتر هتل</span>}</div></section>; }
function Kpi({title,value,icon,danger,accent}:{title:string;value:any;icon:any;danger?:boolean;accent?:boolean}){ return <div className="card p-4"><div className="flex justify-between items-center"><div><p className="text-gray-500 text-sm">{title}</p><b className={(danger?'text-red-600 ':'')+'text-3xl'}>{value}</b></div><div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:danger?'#fee2e2':accent?'#ecfeff':'#f1f5f9',color:danger?'#b91c1c':accent?'#0f766e':'#334155'}}>{icon}</div></div></div>; }
function Dashboard({visible,tasks,kpi,openTask,teamMembers,openCreate,setTab}:any){ const latest=[...visible].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,7); const hotHotels=[...new Set(tasks.filter((t:Task)=>activeStatuses.includes(t.status)).map((t:Task)=>t.hotelName))].slice(0,8); return <><section className="gridDash mb-4"><Kpi title="کل تسک‌ها" value={kpi.all} icon={<LayoutDashboard/>} accent/><Kpi title="باز" value={kpi.open} icon={<Clock3/>}/><Kpi title="عقب‌افتاده" value={kpi.late} icon={<CalendarDays/>} danger/><Kpi title="فوری" value={kpi.urgent} icon={<Flame/>} danger/><Kpi title="در انتظار تایید" value={kpi.approval} icon={<ShieldCheck/>}/><Kpi title="انجام‌شده" value={kpi.done} icon={<CheckCircle2/>} accent/></section><section className="grid lg:grid-cols-3 gap-4"><div className="card p-5 lg:col-span-2"><div className="flex justify-between mb-4"><h2 className="font-black text-xl">Command Center</h2><button className="btn" onClick={()=>openCreate()}><Plus size={16}/> تسک سریع</button></div><div className="grid md:grid-cols-3 gap-3 mb-4"><ActionBox title="تسک‌های عقب‌افتاده" value={kpi.late} text="نیازمند پیگیری فوری"/><ActionBox title="هتل‌های درگیر" value={hotHotels.length} text="با تسک باز"/><ActionBox title="منتظر پاسخ هتل" value={kpi.waiting} text="برای یادآوری"/></div><h3 className="font-black mb-3">آخرین تغییرات</h3>{latest.map((t:Task)=><button key={t.id} onClick={()=>openTask(t)} className="w-full text-right p-3 rounded-2xl border mb-2 hover:bg-gray-50"><div className="flex justify-between gap-2"><b>{t.title}</b><span className="badge" style={statusColor[t.status]}>{t.status}</span></div><p className="text-sm text-gray-500 mt-1">{t.hotelName} | {t.assignee} | {faDate(t.updatedAt)}</p></button>)}</div><div className="card p-5"><h2 className="font-black text-xl mb-4">Leaderboard تیم</h2>{teamMembers.filter((m:ManagedUser)=>m.active!==false && m.role!=='admin').slice(0,10).map((m:ManagedUser)=>{const mt=tasks.filter((t:Task)=>t.assignee===m.name);const done=mt.filter((t:Task)=>t.status==='انجام‌شده').length;const rate=mt.length?Math.round(done/mt.length*100):0;return <div key={m.id} className="mb-4"><div className="flex justify-between text-sm"><span>{m.name}</span><b>{rate}%</b></div><div className="progress"><span style={{width:rate+'%'}}/></div></div>})}<button className="btn secondary w-full mt-2" onClick={()=>setTab('reports')}>مشاهده گزارش کامل</button></div></section></>; }
function ActionBox({title,value,text}:any){return <div className="rounded-3xl bg-slate-50 p-4"><p className="text-gray-500 text-sm">{title}</p><b className="text-2xl">{value}</b><p className="text-xs text-gray-500 mt-1">{text}</p></div>}
function Kanban({visible,patchTask,openTask}:any){ return <section className="kanban">{statuses.map(st=><div className="col" key={st} onDragOver={e=>e.preventDefault()} onDrop={e=>{const id=e.dataTransfer.getData('id'); if(id) patchTask(id,{status:st},`وضعیت به ${st} تغییر کرد`);}}><div className="flex justify-between items-center mb-2"><b>{st}</b><span className="badge" style={statusColor[st]}>{visible.filter((t:Task)=>t.status===st).length}</span></div>{visible.filter((t:Task)=>t.status===st).map((t:Task)=><TaskCard key={t.id} task={t} openTask={openTask}/>)}</div>)}</section>; }
function TaskCard({task,openTask}:{task:Task;openTask:(t:Task)=>void}){ return <article draggable onDragStart={e=>e.dataTransfer.setData('id',task.id)} className="task" onClick={()=>openTask(task)}><div className="flex justify-between gap-2"><b>{task.title}</b><span className="badge" style={priorityColor[task.priority]}>{task.priority}</span></div><p className="text-sm text-gray-600 mt-2">{task.hotelName}</p><div className="flex flex-wrap gap-2 mt-3"><span className="badge" style={{background:'#f3f4f6'}}>{task.city}</span><span className="badge" style={{background:'#ecfeff',color:'#155e75'}}>{task.category}</span>{isOverdue(task)&&<span className="badge" style={{background:'#fee2e2',color:'#b91c1c'}}>عقب‌افتاده</span>}</div><div className="mt-3"><div className="progress"><span style={{width:progress(task)+'%'}}/></div><p className="text-xs text-gray-500 mt-2">{task.assignee} | ددلاین: {task.dueDate}</p></div></article>; }
function TaskList({visible,openTask,patchTask}:any){ return <div className="tableWrap"><table className="tbl"><thead><tr><th>ID</th><th>عنوان</th><th>هتل</th><th>شهر</th><th>دسته</th><th>اولویت</th><th>وضعیت</th><th>مسئول</th><th>ددلاین</th><th>اقدام</th></tr></thead><tbody>{visible.map((t:Task)=><tr key={t.id}><td>{t.id}</td><td><b>{t.title}</b></td><td>{t.hotelName}</td><td>{t.city}</td><td>{t.category}</td><td><span className="badge" style={priorityColor[t.priority]}>{t.priority}</span></td><td><select className="input" value={t.status} onChange={e=>patchTask(t.id,{status:e.target.value as Status},`وضعیت به ${e.target.value} تغییر کرد`)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></td><td>{t.assignee}</td><td className={isOverdue(t)?'text-red-600 font-black':''}>{t.dueDate}</td><td><button className="btn secondary" onClick={()=>openTask(t)}>باز کردن</button></td></tr>)}</tbody></table></div>; }
function HotelsPage({q,openHotel,openCreate,tasks,setHotelFilter}:any){ const shown=hotels.filter(h=>!q||String((h as any).name+(h as any).city+(h as any).province).includes(q)).slice(0,240); return <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">{shown.map(h=><div key={String(h.id)} className="card p-4"><div className="flex justify-between gap-2"><h3 className="font-black">{String((h as any).name)}</h3><span className="badge" style={{background:'#eef2ff',color:'#3730a3'}}>{String((h as any).category || '-')}</span></div><p className="text-sm text-gray-500 mt-2">{String((h as any).city)} | {String((h as any).type || '-')} | ظرفیت: {String((h as any).capacity || '-')}</p><p className="text-xs text-gray-500 mt-1">تسک‌ها: {tasks.filter((t:Task)=>t.hotelId===Number(h.id)).length}</p><div className="flex gap-2 mt-4"><button className="btn secondary" onClick={()=>openHotel(h)}>پرونده</button><button className="btn secondary" onClick={()=>setHotelFilter(h)}>فیلتر</button><button className="btn" onClick={()=>openCreate(h)}>+ تسک</button></div></div>)}</section>; }
function Reports({tasks,members}:{tasks:Task[];members:ManagedUser[]}){ const byCategory=categories.map(c=>({name:c,count:tasks.filter(t=>t.category===c).length})); const byUser=members.filter(m=>m.active!==false).map(m=>{const mt=tasks.filter(t=>t.assignee===m.name);return {m,total:mt.length,done:mt.filter(t=>t.status==='انجام‌شده').length,late:mt.filter(isOverdue).length}}).sort((a,b)=>b.total-a.total); return <section className="grid lg:grid-cols-2 gap-4"><div className="card p-5"><h2 className="font-black text-xl mb-4">گزارش دسته‌بندی تسک‌ها</h2>{byCategory.map(x=><div key={x.name} className="mb-3"><div className="flex justify-between"><span>{x.name}</span><b>{x.count}</b></div><div className="progress"><span style={{width:Math.min(100,x.count*10)+'%'}}/></div></div>)}</div><div className="card p-5"><h2 className="font-black text-xl mb-4">عملکرد افراد</h2><div className="tableWrap"><table className="tbl"><thead><tr><th>نام</th><th>کل</th><th>انجام</th><th>عقب</th><th>نرخ</th></tr></thead><tbody>{byUser.map(x=><tr key={x.m.id}><td>{x.m.name}</td><td>{x.total}</td><td>{x.done}</td><td className={x.late?'text-red-600 font-black':''}>{x.late}</td><td>{x.total?Math.round(x.done/x.total*100):0}%</td></tr>)}</tbody></table></div></div></section>; }
function TeamPage({tasks,members}:{tasks:Task[];members:ManagedUser[]}){ return <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">{members.map(u=>{const ut=tasks.filter(t=>t.assignee===u.name||t.manager===u.name||t.createdBy===u.name);return <div key={u.id} className="card p-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center"><Users/></div><div><h3 className="font-black">{u.name}</h3><p className="text-sm text-gray-500">{roleMap[u.role]} | {u.team}</p></div></div><div className="grid grid-cols-3 gap-2 mt-4 text-center"><div className="p-2 rounded-2xl bg-gray-50"><b>{ut.length}</b><p className="text-xs text-gray-500">کل</p></div><div className="p-2 rounded-2xl bg-red-50"><b>{ut.filter(isOverdue).length}</b><p className="text-xs text-gray-500">عقب</p></div><div className="p-2 rounded-2xl bg-green-50"><b>{ut.filter(t=>t.status==='انجام‌شده').length}</b><p className="text-xs text-gray-500">انجام</p></div></div></div>})}</section>; }
function TemplatesPage({templates,setTemplates,openCreate,createFromTemplate,teamMembers}:any){ const [tpl,setTpl]=useState<Template|null>(null); const [count,setCount]=useState(10); const [city,setCity]=useState('مشهد'); const [assignee,setAssignee]=useState(teamMembers.find((m:ManagedUser)=>!['admin','manager'].includes(m.role))?.name || ''); const [manager,setManager]=useState('محمدباقر ذوالفقاری'); function runBulk(t:Template){ const selected = hotels.filter(h=>String((h as any).city).includes(city)).slice(0,count); if(!selected.length) return alert('برای این شهر هتلی پیدا نشد'); createFromTemplate(t, selected, assignee, manager); } return <section className="space-y-4"><div className="card p-5"><h2 className="text-2xl font-black flex gap-2 items-center"><Wand2/> قالب‌های آماده و ساخت گروهی تسک</h2><p className="text-gray-500 mt-1">برای کمپین‌های پیک، تمدید قرارداد، کنترل قیمت و تکمیل محتوا، با یک کلیک چندین تسک بساز.</p></div><div className="card p-4 grid md:grid-cols-4 gap-3"><input className="input" value={city} onChange={e=>setCity(e.target.value)} placeholder="شهر هدف"/><input className="input" type="number" min={1} max={50} value={count} onChange={e=>setCount(Number(e.target.value))}/><select className="input" value={assignee} onChange={e=>setAssignee(e.target.value)}>{teamMembers.filter((m:ManagedUser)=>!['admin','manager'].includes(m.role)).map((m:ManagedUser)=><option key={m.id}>{m.name}</option>)}</select><select className="input" value={manager} onChange={e=>setManager(e.target.value)}>{teamMembers.filter((m:ManagedUser)=>['admin','manager'].includes(m.role)).map((m:ManagedUser)=><option key={m.id}>{m.name}</option>)}</select></div><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">{templates.map((t:Template)=><div key={t.id} className="card p-4"><div className="flex justify-between"><h3 className="font-black">{t.title}</h3><span className="badge" style={priorityColor[t.priority]}>{t.priority}</span></div><p className="text-sm text-gray-500 mt-2">{t.description}</p><div className="flex flex-wrap gap-2 my-3"><span className="badge" style={{background:'#ecfeff'}}>{t.category}</span>{t.tags.map(tag=><span key={tag} className="badge" style={{background:'#f1f5f9'}}>{tag}</span>)}</div><div className="flex gap-2"><button className="btn" onClick={()=>openCreate(undefined,t)}>تسک تکی</button><button className="btn secondary" onClick={()=>runBulk(t)}>ایجاد گروهی</button><button className="btn secondary" onClick={()=>setTpl(t)}>ویرایش</button></div></div>)}</div>{tpl&&<TemplateModal tpl={tpl} close={()=>setTpl(null)} save={(x:Template)=>{setTemplates(templates.map((t:Template)=>t.id===x.id?x:t));setTpl(null)}}/>}</section>; }
function TemplateModal({tpl,close,save}:any){ const [x,setX]=useState<Template>(tpl); return <div className="modalBack"><div className="modal p-5"><div className="flex justify-between mb-4"><h2 className="font-black text-xl">ویرایش قالب</h2><button className="btn secondary" onClick={close}><X/></button></div><div className="grid md:grid-cols-2 gap-3"><input className="input" value={x.title} onChange={e=>setX({...x,title:e.target.value})}/><select className="input" value={x.category} onChange={e=>setX({...x,category:e.target.value as Category})}>{categories.map(c=><option key={c}>{c}</option>)}</select><select className="input" value={x.priority} onChange={e=>setX({...x,priority:e.target.value as Task['priority']})}>{priorities.map(p=><option key={p}>{p}</option>)}</select><input className="input" value={x.tags.join('،')} onChange={e=>setX({...x,tags:e.target.value.split(/[،,]/).map(v=>v.trim()).filter(Boolean)})}/><textarea className="input md:col-span-2" rows={4} value={x.description} onChange={e=>setX({...x,description:e.target.value})}/><textarea className="input md:col-span-2" rows={4} value={x.checklist.join('\n')} onChange={e=>setX({...x,checklist:e.target.value.split('\n').map(v=>v.trim()).filter(Boolean)})}/></div><button className="btn mt-4" onClick={()=>save(x)}>ذخیره قالب</button></div></div> }
function AdminTeamPage({members,setMembers,tasks}:{members:ManagedUser[];setMembers:(m:ManagedUser[])=>Promise<void>|void;tasks:Task[]}){ const blank: ManagedUser = { id:'u-'+Date.now(), name:'', role:'expert', team:'مرکز', active:true, phone:'', title:'', dailyTarget:8 }; const [editing,setEditing]=useState<(ManagedUser & {newPassword?: string})|null>(null); const [search,setSearch]=useState(''); const [saving,setSaving]=useState(false); const list=members.filter(m=>!search || [m.name,m.team,m.role,m.phone,m.title].join(' ').includes(search)); async function save(){ if(!editing?.name.trim()) return alert('نام کارشناس را وارد کن'); setSaving(true); try{ const exists=members.some(m=>m.id===editing.id); const next=exists?members.map(m=>m.id===editing.id?editing:m):[{...editing,id:editing.id||'u-'+uid()},...members]; await setMembers(next as ManagedUser[]); setEditing(null); } finally { setSaving(false); } } async function toggle(id:string){ await setMembers(members.map(m=>m.id===id?{...m,active:m.active===false}:m)); } async function remove(id:string){ if(confirm('این عضو حذف شود؟')) await setMembers(members.filter(m=>m.id!==id)); } return <section className="space-y-4"><div className="card p-5 bg-gradient-to-l from-teal-50 to-white"><div className="flex flex-wrap justify-between gap-3 items-center"><div><h2 className="text-2xl font-black flex items-center gap-2"><ShieldCheck/> مدیریت کارشناس‌ها و تیم</h2><p className="text-gray-500 mt-1">فقط مدیر کل به این بخش دسترسی دارد. تغییرات این بخش روی Supabase ذخیره می‌شود.</p></div><button className="btn" onClick={()=>setEditing(blank)}><UserPlus size={17}/> افزودن عضو</button></div></div><section className="grid md:grid-cols-4 gap-3"><Kpi title="کل اعضا" value={members.length} icon={<Users/>}/><Kpi title="فعال" value={members.filter(m=>m.active!==false).length} icon={<CheckCircle2/>}/><Kpi title="مدیر/سیتی‌منیجر" value={members.filter(m=>['admin','manager'].includes(m.role)).length} icon={<ShieldCheck/>}/><Kpi title="کارشناس‌ها" value={members.filter(m=>!['admin','manager'].includes(m.role)).length} icon={<ListTodo/>}/></section><div className="card p-4"><input className="input" placeholder="جستجوی نام، تیم، نقش، شماره..." value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="tableWrap"><table className="tbl"><thead><tr><th>نام</th><th>سمت</th><th>نقش</th><th>تیم/زون</th><th>تلفن</th><th>هدف روزانه</th><th>KPI</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{list.map(m=>{const mt=tasks.filter(t=>t.assignee===m.name||t.manager===m.name||t.createdBy===m.name);const done=mt.filter(t=>t.status==='انجام‌شده').length;const late=mt.filter(isOverdue).length;return <tr key={m.id}><td><b>{m.name}</b></td><td>{m.title||'-'}</td><td>{roleMap[m.role]}</td><td>{m.team}</td><td>{m.phone||'-'}</td><td>{m.dailyTarget||'-'}</td><td><span className="badge" style={{background:'#f1f5f9'}}>کل {mt.length}</span> <span className="badge" style={{background:'#dcfce7'}}>انجام {done}</span> <span className="badge" style={{background:'#fee2e2'}}>عقب {late}</span></td><td><span className="badge" style={{background:m.active===false?'#fee2e2':'#dcfce7',color:m.active===false?'#991b1b':'#166534'}}>{m.active===false?'غیرفعال':'فعال'}</span></td><td><div className="flex gap-2"><button className="btn secondary" onClick={()=>setEditing({...m,newPassword:''})}><Edit3 size={15}/></button><button className="btn secondary" onClick={()=>toggle(m.id)}>{m.active===false?'فعال کن':'غیرفعال'}</button>{m.role!=='admin'&&<button className="btn danger" onClick={()=>remove(m.id)}><Trash2 size={15}/></button>}</div></td></tr>})}</tbody></table></div>{editing&&<div className="modalBack"><div className="modal p-5"><div className="flex justify-between mb-4"><h2 className="font-black text-xl">{editing.id.startsWith('u-') && !members.some(m=>m.id===editing.id)?'افزودن عضو':'ویرایش عضو'}</h2><button className="btn secondary" onClick={()=>setEditing(null)}><X/></button></div><div className="grid md:grid-cols-2 gap-3"><input className="input" placeholder="نام" value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/><input className="input" placeholder="سمت" value={editing.title||''} onChange={e=>setEditing({...editing,title:e.target.value})}/><select className="input" value={editing.role} onChange={e=>setEditing({...editing,role:e.target.value as Role})}>{Object.entries(roleMap).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><input className="input" placeholder="تیم/زون" value={editing.team} onChange={e=>setEditing({...editing,team:e.target.value})}/><input className="input" placeholder="شماره تماس" value={editing.phone||''} onChange={e=>setEditing({...editing,phone:e.target.value})}/><input className="input" type="number" placeholder="هدف روزانه" value={editing.dailyTarget||0} onChange={e=>setEditing({...editing,dailyTarget:Number(e.target.value)})}/><input className="input md:col-span-2" type="password" placeholder="رمز جدید؛ خالی بماند یعنی تغییر نکند" value={editing.newPassword||''} onChange={e=>setEditing({...editing,newPassword:e.target.value})}/></div><button className="btn mt-4" onClick={save} disabled={saving}>{saving?'در حال ذخیره...':'ذخیره'}</button></div></div>}</section>; }
function SettingsPage({syncMode,tasks,setTasks}:any){ return <section className="grid lg:grid-cols-2 gap-4"><div className="card p-5"><h2 className="font-black text-xl mb-3">وضعیت سیستم</h2><p className="text-gray-500">حالت ذخیره‌سازی: <b>{syncMode==='supabase'?'Supabase Online':'LocalStorage'}</b></p><p className="text-gray-500 mt-2">تعداد تسک‌های فعلی: <b>{tasks.length}</b></p><button className="btn danger mt-4" onClick={()=>{if(confirm('همه تسک‌های محلی پاک شود؟')){localStorage.removeItem('iho_tasks_v3');setTasks(seedTasks.map(normalizeTask));}}}>ریست دیتای محلی</button></div><div className="card p-5"><h2 className="font-black text-xl mb-3">راهنمای اتصال آنلاین</h2><p className="text-gray-500 leading-8">برای آنلاین واقعی بین همه کارشناسان، در Vercel دو Environment Variable مربوط به Supabase را وارد کن و فایل schema.sql را در Supabase اجرا کن.</p></div></section>; }
function TaskForm({form,setForm,save,close,teamMembers}:any){ return <div className="modalBack"><div className="modal p-5"><div className="flex justify-between mb-4"><h2 className="font-black text-xl">{form.id?'ویرایش تسک':'ایجاد تسک جدید'}</h2><button className="btn secondary" onClick={close}><X/></button></div><div className="grid md:grid-cols-2 gap-3"><input className="input md:col-span-2" placeholder="عنوان تسک" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><select className="input" value={form.hotelId} onChange={e=>setForm({...form,hotelId:Number(e.target.value)})}>{hotels.slice(0,500).map(h=><option key={String(h.id)} value={Number(h.id)}>{String((h as any).name)} - {String((h as any).city)}</option>)}</select><select className="input" value={form.category} onChange={e=>setForm({...form,category:e.target.value as Category})}>{categories.map(c=><option key={c}>{c}</option>)}</select><select className="input" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value as Task['priority']})}>{priorities.map(p=><option key={p}>{p}</option>)}</select><select className="input" value={form.status} onChange={e=>setForm({...form,status:e.target.value as Status})}>{statuses.map(s=><option key={s}>{s}</option>)}</select><select className="input" value={form.assignee} onChange={e=>setForm({...form,assignee:e.target.value})}>{teamMembers.filter((m:ManagedUser)=>m.active!==false&&!['admin','manager'].includes(m.role)).map((m:ManagedUser)=><option key={m.id}>{m.name}</option>)}</select><select className="input" value={form.manager} onChange={e=>setForm({...form,manager:e.target.value})}>{teamMembers.filter((m:ManagedUser)=>m.active!==false&&['admin','manager'].includes(m.role)).map((m:ManagedUser)=><option key={m.id}>{m.name}</option>)}</select><input className="input" type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/><input className="input" placeholder="تگ‌ها" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/><textarea className="input md:col-span-2" rows={5} placeholder="شرح تسک" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div><button className="btn mt-4" onClick={save}>ذخیره تسک</button></div></div>; }
function TaskModal({task,currentUser,patchTask,removeTask,close,openEdit}:any){ const [comment,setComment]=useState(''); function addComment(){ if(!comment.trim()) return; patchTask(task.id,{comments:[...task.comments,{id:uid(),user:currentUser.name,text:comment,at:new Date().toISOString()}]},'کامنت ثبت شد'); setComment(''); } return <div className="modalBack"><div className="modal p-5"><div className="flex justify-between gap-3 mb-4"><div><h2 className="font-black text-2xl">{task.title}</h2><p className="text-gray-500">{task.hotelName} | {task.city} | {task.id}</p></div><button className="btn secondary" onClick={close}><X/></button></div><div className="flex flex-wrap gap-2 mb-4"><span className="badge" style={statusColor[task.status]}>{task.status}</span><span className="badge" style={priorityColor[task.priority]}>{task.priority}</span><span className="badge" style={{background:'#ecfeff'}}>{task.category}</span>{isOverdue(task)&&<span className="badge" style={{background:'#fee2e2',color:'#991b1b'}}>عقب‌افتاده</span>}</div><div className="grid lg:grid-cols-3 gap-4"><div className="lg:col-span-2 space-y-4"><div className="card p-4"><h3 className="font-black mb-2">شرح</h3><p className="text-gray-600 leading-8">{task.description || 'بدون توضیح'}</p></div><div className="card p-4"><h3 className="font-black mb-3">چک‌لیست</h3>{task.checklist.map(item=><label key={item.id} className="flex gap-2 mb-2 items-center"><input type="checkbox" checked={item.done} onChange={()=>patchTask(task.id,{checklist:task.checklist.map(i=>i.id===item.id?{...i,done:!i.done,doneBy:currentUser.name,doneAt:new Date().toISOString()}:i)},'چک‌لیست تغییر کرد')}/><span className={item.done?'line-through text-gray-400':''}>{item.title}</span></label>)}<div className="progress mt-3"><span style={{width:progress(task)+'%'}}/></div></div><div className="card p-4"><h3 className="font-black mb-3">گفتگو</h3><div className="space-y-2 mb-3">{task.comments.map(c=><div key={c.id} className="rounded-2xl bg-slate-50 p-3"><b>{c.user}</b><p className="text-gray-600 mt-1">{c.text}</p><small className="text-gray-400">{faDate(c.at)}</small></div>)}</div><div className="flex gap-2"><input className="input" value={comment} onChange={e=>setComment(e.target.value)} placeholder="ثبت کامنت..."/><button className="btn" onClick={addComment}><MessageCircle size={16}/> ارسال</button></div></div></div><div className="space-y-4"><div className="card p-4"><h3 className="font-black mb-3">اطلاعات</h3><p>مسئول: <b>{task.assignee}</b></p><p>مدیر: <b>{task.manager}</b></p><p>ددلاین: <b className={isOverdue(task)?'text-red-600':''}>{task.dueDate}</b></p><p>ایجادکننده: <b>{task.createdBy}</b></p><div className="grid gap-2 mt-4"><button className="btn secondary" onClick={()=>openEdit(task)}><Edit3 size={16}/> ویرایش</button><button className="btn" onClick={()=>patchTask(task.id,{status:'انجام‌شده'},'تسک انجام شد')}><CheckCircle2 size={16}/> انجام شد</button><button className="btn danger" onClick={()=>removeTask(task.id)}><Trash2 size={16}/> حذف</button></div></div><div className="card p-4"><h3 className="font-black mb-3">Timeline</h3>{task.activities.slice().reverse().map(a=><div key={a.id} className="border-r-2 border-teal-600 pr-3 pb-3"><b>{a.action}</b><p className="text-xs text-gray-500">{a.user} | {faDate(a.at)}</p></div>)}</div></div></div></div></div>; }
function HotelModal({hotel,tasks,close,openTask,openCreate}:any){ return <div className="modalBack"><div className="modal p-5"><div className="flex justify-between mb-4"><div><h2 className="font-black text-2xl">{String((hotel as any).name)}</h2><p className="text-gray-500">{String((hotel as any).city)} | {String((hotel as any).province || '')}</p></div><button className="btn secondary" onClick={close}><X/></button></div><div className="grid md:grid-cols-4 gap-3 mb-4"><Kpi title="تسک‌ها" value={tasks.length} icon={<ListTodo/>}/><Kpi title="باز" value={tasks.filter((t:Task)=>activeStatuses.includes(t.status)).length} icon={<Clock3/>}/><Kpi title="عقب" value={tasks.filter(isOverdue).length} icon={<Bell/>} danger/><Kpi title="انجام" value={tasks.filter((t:Task)=>t.status==='انجام‌شده').length} icon={<CheckCircle2/>}/></div><button className="btn mb-4" onClick={()=>openCreate(hotel)}><Plus size={16}/> ایجاد تسک برای این هتل</button>{tasks.map((t:Task)=><button key={t.id} onClick={()=>openTask(t)} className="w-full text-right p-3 rounded-2xl border mb-2 hover:bg-gray-50"><div className="flex justify-between"><b>{t.title}</b><span className="badge" style={statusColor[t.status]}>{t.status}</span></div><p className="text-sm text-gray-500">{t.assignee} | {t.dueDate}</p></button>)}</div></div>; }
