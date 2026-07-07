'use client';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Bell, Building2, CalendarDays, CheckCircle2, ChevronLeft, Clock3, Download, Edit3, Filter, LayoutDashboard, ListTodo, LogOut, MessageCircle, Plus, Search, ShieldCheck, Trash2, UserPlus, Users, Wifi, WifiOff } from 'lucide-react';
import { hotels } from '@/lib/hotels';
import { seedTasks } from '@/lib/seed';
import { activeStatuses, categories, checklistPresets, experts, managers, priorities, statuses, Task, Status, Category, User, Role, users } from '@/lib/types';
import { hasSupabase, supabase } from '@/lib/supabase';

type Tab = 'dashboard' | 'kanban' | 'list' | 'hotels' | 'team' | 'admin' | 'settings';
type ManagedUser = User & { active?: boolean; phone?: string; title?: string };
type Hotel = typeof hotels[number];

type FormState = {
  id?: string; title: string; hotelId: number; category: Category; priority: Task['priority']; status: Status; assignee: string; manager: string; dueDate: string; description: string; tags: string;
};

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
const today = () => new Date().toISOString().slice(0,10);
const uid = () => (crypto.randomUUID?.() || Math.random().toString(36).slice(2));
const isOverdue = (t: Task) => !['انجام‌شده','لغوشده'].includes(t.status) && t.dueDate < today();
const progress = (t: Task) => t.checklist.length ? Math.round((t.checklist.filter(i => i.done).length / t.checklist.length) * 100) : 0;
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

export default function App(){
  const [logged, setLogged] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(users[0]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<ManagedUser[]>(users.map(u => ({...u, active:true})));
  const [tab, setTab] = useState<Tab>('dashboard');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'همه'|Status>('همه');
  const [assigneeFilter, setAssigneeFilter] = useState('همه');
  const [hotelFilter, setHotelFilter] = useState<Hotel|null>(null);
  const [selected, setSelected] = useState<Task|null>(null);
  const [hotelModal, setHotelModal] = useState<Hotel|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [syncMode, setSyncMode] = useState<'local'|'supabase'>(hasSupabase ? 'supabase' : 'local');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(() => ({ title:'', hotelId:Number(hotels[0]?.id || 1), category:'ظرفیت', priority:'متوسط', status:'جدید', assignee:experts[0], manager:managers[0], dueDate:today(), description:'', tags:'' }));

  useEffect(() => { loadTasks(); loadTeamMembers(); }, []);
  useEffect(() => {
    if (!hasSupabase || !supabase) return;
    const channel = supabase.channel('iho-task-realtime')
      .on('postgres_changes', { event:'*', schema:'public', table:'iho_tasks' }, () => loadTasks(false))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);
  useEffect(() => { if(tasks.length) localStorage.setItem('iho_tasks_v2', JSON.stringify(tasks)); }, [tasks]);

  async function loadTeamMembers(){
    try{
      if(hasSupabase && supabase){
        const { data, error } = await supabase.from('iho_team_members').select('id,payload').order('updated_at', { ascending:false });
        if(!error && data && data.length){ setTeamMembers(data.map((r:any)=>r.payload as ManagedUser)); return; }
      }
    }catch(e){ console.warn('Supabase team load failed', e); }
    const rawUsers = localStorage.getItem('iho_team_members_v25');
    if(rawUsers){ try{ setTeamMembers(JSON.parse(rawUsers)); }catch{} }
  }

  async function loadTasks(showLoading = true){
    if(showLoading) setLoading(true);
    try{
      if(hasSupabase && supabase){
        const { data, error } = await supabase.from('iho_tasks').select('id,payload').order('updated_at', { ascending:false });
        if(error) throw error;
        if(data && data.length){ setTasks(data.map((r:any) => normalizeTask(r.payload as Task))); setSyncMode('supabase'); setLoading(false); return; }
      }
    }catch(e){ console.warn('Supabase load failed, fallback to localStorage', e); setSyncMode('local'); }
    const raw = localStorage.getItem('iho_tasks_v2') || localStorage.getItem('iho_tasks');
    setTasks(raw ? JSON.parse(raw).map(normalizeTask) : seedTasks.map(normalizeTask));
    setLoading(false);
  }

  async function persist(next: Task[]){
    setTasks(next);
    localStorage.setItem('iho_tasks_v2', JSON.stringify(next));
    if(hasSupabase && supabase){
      setSyncMode('supabase');
      await Promise.all(next.map(t => supabase.from('iho_tasks').upsert({ id:t.id, payload:t })));
    }
  }
  async function upsertTask(task: Task){
    const next = [task, ...tasks.filter(t => t.id !== task.id)];
    setTasks(next); localStorage.setItem('iho_tasks_v2', JSON.stringify(next));
    if(hasSupabase && supabase) await supabase.from('iho_tasks').upsert({ id:task.id, payload:task });
  }
  async function removeTask(id: string){
    if(!confirm('این تسک حذف شود؟')) return;
    const next = tasks.filter(t => t.id !== id); setTasks(next); localStorage.setItem('iho_tasks_v2', JSON.stringify(next));
    if(hasSupabase && supabase) await supabase.from('iho_tasks').delete().eq('id', id);
    setSelected(null);
  }
  function scopeAllows(t: Task){
    if(currentUser.role === 'admin') return true;
    if(['manager'].includes(currentUser.role)) return t.manager === currentUser.name || currentUser.cityScope?.includes(t.city);
    return t.assignee === currentUser.name || t.createdBy === currentUser.name;
  }
  const visible = useMemo(() => tasks
    .filter(scopeAllows)
    .filter(t => !hotelFilter || t.hotelId === Number(hotelFilter.id))
    .filter(t => statusFilter === 'همه' || t.status === statusFilter)
    .filter(t => assigneeFilter === 'همه' || t.assignee === assigneeFilter)
    .filter(t => !q || [t.title,t.hotelName,t.city,t.assignee,t.manager,t.category,t.status,t.priority,...t.tags].join(' ').includes(q)),
    [tasks, currentUser, q, hotelFilter, statusFilter, assigneeFilter]
  );
  const expertNames = teamMembers.filter(u => u.active !== false && !['admin','manager'].includes(u.role)).map(u => u.name);
  const managerNames = teamMembers.filter(u => u.active !== false && ['admin','manager'].includes(u.role)).map(u => u.name);
  async function saveTeamMembers(next: ManagedUser[]){ setTeamMembers(next); localStorage.setItem('iho_team_members_v25', JSON.stringify(next)); if(hasSupabase && supabase){ await Promise.all(next.map(m=>supabase.from('iho_team_members').upsert({ id:m.id, payload:m }))); } }
  const kpi = {
    all: visible.length,
    open: visible.filter(t => activeStatuses.includes(t.status)).length,
    done: visible.filter(t => t.status === 'انجام‌شده').length,
    late: visible.filter(isOverdue).length,
    urgent: visible.filter(t => t.priority === 'فوری').length,
    waiting: visible.filter(t => t.status === 'منتظر پاسخ هتل').length
  };
  function emptyForm(): FormState { return { title:'', hotelId:Number(hotels[0]?.id || 1), category:'ظرفیت', priority:'متوسط', status:'جدید', assignee:expertNames[0] || experts[0], manager:managerNames[0] || managers[0], dueDate:today(), description:'', tags:'' }; }
  function openCreate(hotel?: Hotel){ setForm({...emptyForm(), hotelId:Number(hotel?.id || hotels[0]?.id || 1)}); setShowForm(true); }
  function openEdit(task: Task){ setForm({ id:task.id, title:task.title, hotelId:task.hotelId, category:task.category, priority:task.priority, status:task.status, assignee:task.assignee, manager:task.manager, dueDate:task.dueDate, description:task.description, tags:task.tags.join('،') }); setSelected(null); setShowForm(true); }
  async function saveForm(){
    const h = hotels.find(x => Number(x.id) === Number(form.hotelId)) || hotels[0];
    const old = tasks.find(t => t.id === form.id);
    const task: Task = old ? {
      ...old, title:form.title || 'بدون عنوان', hotelId:Number(h.id), hotelName:String(h.name), city:String(h.city), category:form.category, priority:form.priority, status:form.status, assignee:form.assignee, manager:form.manager, dueDate:form.dueDate, description:form.description,
      tags: form.tags.split(/[،,]/).map(x => x.trim()).filter(Boolean), updatedAt:new Date().toISOString(), completedAt: form.status === 'انجام‌شده' ? (old.completedAt || new Date().toISOString()) : undefined,
      activities:[...old.activities, { id:uid(), user:currentUser.name, action:'تسک ویرایش شد', at:new Date().toISOString() }]
    } : {
      id:'T-'+Math.floor(10000+Math.random()*90000), title:form.title || 'تسک جدید', hotelId:Number(h.id), hotelName:String(h.name), city:String(h.city), category:form.category, priority:form.priority, status:form.status, assignee:form.assignee, manager:form.manager, dueDate:form.dueDate, description:form.description,
      checklist: checklistPresets[form.category].map(title => ({ id:uid(), title, done:false })), comments:[], activities:[{ id:uid(), user:currentUser.name, action:'تسک ایجاد شد', at:new Date().toISOString() }], createdBy:currentUser.name, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), tags:form.tags.split(/[،,]/).map(x => x.trim()).filter(Boolean)
    };
    await upsertTask(task); setShowForm(false);
  }
  async function patchTask(id: string, patch: Partial<Task>, action = 'بروزرسانی شد'){
    const old = tasks.find(t => t.id === id); if(!old) return;
    const task: Task = { ...old, ...patch, updatedAt:new Date().toISOString(), activities:[...old.activities, { id:uid(), user:currentUser.name, action, at:new Date().toISOString() }] };
    if(patch.status === 'انجام‌شده') task.completedAt = task.completedAt || new Date().toISOString();
    await upsertTask(task); if(selected?.id === id) setSelected(task);
  }
  function exportCsv(){
    const headers = ['ID','عنوان','هتل','شهر','دسته','اولویت','وضعیت','مسئول','مدیر','ددلاین','درصد چک‌لیست'];
    const rows = visible.map(t => [t.id,t.title,t.hotelName,t.city,t.category,t.priority,t.status,t.assignee,t.manager,t.dueDate,progress(t)+'%']);
    const csv = [headers,...rows].map(r => r.map(x => `"${String(x).replaceAll('"','""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff'+csv], { type:'text/csv;charset=utf-8;' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'iho-task-center.csv'; a.click();
  }
  if(!logged) return <Login currentUser={currentUser} setCurrentUser={setCurrentUser} onLogin={()=>setLogged(true)} syncMode={syncMode}/>;
  return <main className="p-4 lg:p-6 max-w-[1600px] mx-auto">
    <header className="flex flex-wrap justify-between items-center gap-3 mb-5">
      <div><h1 className="text-2xl lg:text-4xl font-black">IHO Task Center | کارتابل تأمین</h1><p className="text-gray-500 mt-1">سلام {currentUser.name}، نقش شما: {roleLabel(currentUser.role)} | {today()}</p></div>
      <div className="flex flex-wrap gap-2"><button className="btn secondary">{syncMode === 'supabase' ? <Wifi size={18}/> : <WifiOff size={18}/>} {syncMode === 'supabase' ? 'آنلاین Supabase' : 'Local Mode'}</button><button className="btn secondary"><Bell size={18}/> {kpi.late + kpi.urgent}</button>{currentUser.role === 'admin' && <button className="btn secondary" onClick={()=>setTab('admin')}><ShieldCheck size={18}/> مدیریت تیم</button>}<button className="btn" onClick={()=>openCreate()}><Plus size={18}/> تسک جدید</button><button className="btn secondary" onClick={()=>setLogged(false)}><LogOut size={18}/> خروج</button></div>
    </header>
    <nav className="flex gap-2 overflow-auto mb-5 pb-1">{tabs.filter(t => !t.adminOnly || currentUser.role === 'admin').map(t => <button key={t.id} onClick={()=>setTab(t.id)} className={`navTab ${tab===t.id?'active':''}`}>{t.title}</button>)}</nav>
    <Filters q={q} setQ={setQ} statusFilter={statusFilter} setStatusFilter={setStatusFilter} assigneeFilter={assigneeFilter} setAssigneeFilter={setAssigneeFilter} hotelFilter={hotelFilter} setHotelFilter={setHotelFilter} exportCsv={exportCsv}/>
    {loading ? <div className="card p-8 text-center">در حال بارگذاری...</div> : <>
      {tab === 'dashboard' && <Dashboard visible={visible} tasks={tasks} kpi={kpi} openTask={setSelected}/>} 
      {tab === 'kanban' && <Kanban visible={visible} patchTask={patchTask} openTask={setSelected}/>} 
      {tab === 'list' && <TaskList visible={visible} openTask={setSelected} patchTask={patchTask}/>} 
      {tab === 'hotels' && <HotelsPage q={q} openHotel={setHotelModal} openCreate={openCreate} tasks={tasks}/>} 
      {tab === 'team' && <TeamPage tasks={visible} members={teamMembers}/>} 
      {tab === 'admin' && currentUser.role === 'admin' && <AdminTeamPage members={teamMembers} setMembers={saveTeamMembers} tasks={tasks}/>} 
      {tab === 'settings' && <SettingsPage/>}
    </>}
    {showForm && <TaskForm form={form} setForm={setForm} save={saveForm} close={()=>setShowForm(false)} expertsList={expertNames} managersList={managerNames}/>} 
    {selected && <TaskModal task={selected} close={()=>setSelected(null)} patchTask={patchTask} removeTask={removeTask} openEdit={openEdit} currentUser={currentUser}/>} 
    {hotelModal && <HotelModal hotel={hotelModal} close={()=>setHotelModal(null)} tasks={tasks.filter(t => t.hotelId === Number(hotelModal.id))} openCreate={openCreate} openTask={setSelected}/>} 
  </main>;
}

const tabs: {id:Tab; title:string; adminOnly?: boolean}[] = [
  {id:'dashboard', title:'داشبورد'}, {id:'kanban', title:'کانبان'}, {id:'list', title:'لیست تسک‌ها'}, {id:'hotels', title:'پرونده هتل‌ها'}, {id:'team', title:'تیم'}, {id:'admin', title:'مدیریت کارشناس‌ها', adminOnly:true}, {id:'settings', title:'تنظیمات'}
];
function roleLabel(r: User['role']){ return ({admin:'مدیر کل',manager:'سیتی‌منیجر',expert:'کارشناس',content:'محتوا/پنل',capacity:'کنترل ظرفیت'} as any)[r]; }
function Login({currentUser,setCurrentUser,onLogin,syncMode}:{currentUser:User;setCurrentUser:(u:User)=>void;onLogin:()=>void;syncMode:string}){return <main className="min-h-screen flex items-center justify-center p-6" style={{background:'linear-gradient(135deg,#062f2b,#0f766e 46%,#eef2f7 46%)'}}><section className="card p-8 w-full max-w-md"><div className="flex items-center gap-3 mb-6"><div className="w-14 h-14 rounded-3xl bg-teal-700 text-white flex items-center justify-center"><Building2/></div><div><h1 className="text-2xl font-black">IHO Task Center</h1><p className="text-gray-500">کارتابل آنلاین تیم تأمین ایران‌هتل</p></div></div><label className="text-sm text-gray-500">انتخاب کاربر نمونه</label><select className="input mt-2 mb-4" value={currentUser.id} onChange={e=>setCurrentUser(users.find(u=>u.id===e.target.value) || users[0])}>{users.map(x=><option key={x.id} value={x.id}>{x.name} - {roleLabel(x.role)} - {x.team}</option>)}</select><button className="btn w-full" onClick={onLogin}>ورود به کارتابل</button><p className="text-xs text-gray-500 mt-4">حالت فعلی: {syncMode === 'supabase' ? 'آنلاین با Supabase' : 'LocalStorage'} — برای اتصال واقعی بین همه کارشناسان، schema.sql را در Supabase اجرا کن و env های Vercel را بگذار.</p></section></main>}
function Filters({q,setQ,statusFilter,setStatusFilter,assigneeFilter,setAssigneeFilter,hotelFilter,setHotelFilter,exportCsv}:any){return <section className="card p-4 mb-5"><div className="flex flex-wrap gap-3 items-center"><div className="relative flex-1 min-w-[260px]"><Search className="absolute right-3 top-3 text-gray-400" size={18}/><input className="input pr-10" placeholder="جستجو: هتل، شهر، کارشناس، دسته، تگ..." value={q} onChange={(e:any)=>setQ(e.target.value)}/></div><select className="input w-auto" value={statusFilter} onChange={(e:any)=>setStatusFilter(e.target.value)}><option>همه</option>{statuses.map(x=><option key={x}>{x}</option>)}</select><select className="input w-auto" value={assigneeFilter} onChange={(e:any)=>setAssigneeFilter(e.target.value)}><option>همه</option>{experts.map(x=><option key={x}>{x}</option>)}</select>{hotelFilter && <button className="btn secondary" onClick={()=>setHotelFilter(null)}><Filter size={16}/> {hotelFilter.name} ×</button>}<button className="btn secondary" onClick={exportCsv}><Download size={16}/> خروجی CSV</button></div></section>}
function Kpi({title,value,icon,danger}:{title:string;value:number;icon:any;danger?:boolean}){return <div className="card p-4 flex justify-between items-center"><div><p className="text-gray-500">{title}</p><b className={danger?'text-3xl text-red-600':'text-3xl'}>{value}</b></div><div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:danger?'#fee2e2':'#ccfbf1',color:danger?'#b91c1c':'#0f766e'}}>{icon}</div></div>}
function Dashboard({visible,tasks,kpi,openTask}:any){const latest=[...visible].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,8);return <><section className="gridDash mb-5"><Kpi title="کل تسک‌ها" value={kpi.all} icon={<LayoutDashboard/>}/><Kpi title="باز" value={kpi.open} icon={<Clock3/>}/><Kpi title="عقب‌افتاده" value={kpi.late} icon={<CalendarDays/>} danger/><Kpi title="فوری" value={kpi.urgent} icon={<Bell/>} danger/><Kpi title="انجام‌شده" value={kpi.done} icon={<CheckCircle2/>}/></section><section className="grid lg:grid-cols-3 gap-4"><div className="card p-4 lg:col-span-2"><h2 className="font-black text-xl mb-4">آخرین تغییرات</h2>{latest.map((t:Task)=><button key={t.id} onClick={()=>openTask(t)} className="w-full text-right p-3 rounded-2xl border mb-2 hover:bg-gray-50"><div className="flex justify-between gap-2"><b>{t.title}</b><span className="badge" style={statusColor[t.status]}>{t.status}</span></div><p className="text-sm text-gray-500 mt-1">{t.hotelName} | {t.assignee} | {new Date(t.updatedAt).toLocaleString('fa-IR')}</p></button>)}</div><div className="card p-4"><h2 className="font-black text-xl mb-4">وضعیت کارشناسان</h2>{experts.map(ex=>{const userTasks=tasks.filter((t:Task)=>t.assignee===ex);const late=userTasks.filter(isOverdue).length;return <div key={ex} className="mb-4"><div className="flex justify-between text-sm"><span>{ex}</span><b>{userTasks.length} / {late} عقب‌افتاده</b></div><div className="progress"><span style={{width:Math.min(100,userTasks.length*12)+'%'}}/></div></div>})}</div></section></>}
function Kanban({visible,patchTask,openTask}:any){return <section className="kanban">{statuses.map(st=><div className="col" key={st} onDragOver={e=>e.preventDefault()} onDrop={e=>{const id=e.dataTransfer.getData('id'); if(id) patchTask(id,{status:st},`وضعیت به ${st} تغییر کرد`);}}><div className="flex justify-between items-center mb-2"><b>{st}</b><span className="badge" style={statusColor[st]}>{visible.filter((t:Task)=>t.status===st).length}</span></div>{visible.filter((t:Task)=>t.status===st).map((t:Task)=><TaskCard key={t.id} task={t} openTask={openTask}/>)}</div>)}</section>}
function TaskCard({task,openTask}:{task:Task;openTask:(t:Task)=>void}){return <article draggable onDragStart={e=>e.dataTransfer.setData('id',task.id)} className="task" onClick={()=>openTask(task)}><div className="flex justify-between gap-2"><b>{task.title}</b><span className="badge" style={priorityColor[task.priority]}>{task.priority}</span></div><p className="text-sm text-gray-600 mt-2">{task.hotelName}</p><div className="flex flex-wrap gap-2 mt-3"><span className="badge" style={{background:'#f3f4f6'}}>{task.city}</span><span className="badge" style={{background:'#ecfeff',color:'#155e75'}}>{task.category}</span>{isOverdue(task)&&<span className="badge" style={{background:'#fee2e2',color:'#b91c1c'}}>عقب‌افتاده</span>}</div><div className="mt-3"><div className="progress"><span style={{width:progress(task)+'%'}}/></div><p className="text-xs text-gray-500 mt-2">{task.assignee} | ددلاین: {task.dueDate}</p></div></article>}
function TaskList({visible,openTask,patchTask}:any){return <div className="tableWrap"><table className="tbl"><thead><tr><th>ID</th><th>عنوان</th><th>هتل</th><th>شهر</th><th>دسته</th><th>اولویت</th><th>وضعیت</th><th>مسئول</th><th>ددلاین</th><th>اقدام</th></tr></thead><tbody>{visible.map((t:Task)=><tr key={t.id}><td>{t.id}</td><td><b>{t.title}</b></td><td>{t.hotelName}</td><td>{t.city}</td><td>{t.category}</td><td><span className="badge" style={priorityColor[t.priority]}>{t.priority}</span></td><td><select className="input" value={t.status} onChange={e=>patchTask(t.id,{status:e.target.value as Status},`وضعیت به ${e.target.value} تغییر کرد`)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></td><td>{t.assignee}</td><td className={isOverdue(t)?'text-red-600 font-black':''}>{t.dueDate}</td><td><button className="btn secondary" onClick={()=>openTask(t)}>باز کردن</button></td></tr>)}</tbody></table></div>}
function HotelsPage({q,openHotel,openCreate,tasks}:any){const shown=hotels.filter(h=>!q||String((h as any).name+(h as any).city+(h as any).province).includes(q)).slice(0,240);return <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">{shown.map(h=><div key={String(h.id)} className="card p-4"><div className="flex justify-between gap-2"><h3 className="font-black">{String((h as any).name)}</h3><span className="badge" style={{background:'#eef2ff',color:'#3730a3'}}>{String((h as any).category || '-')}</span></div><p className="text-sm text-gray-500 mt-2">{String((h as any).city)} | {String((h as any).type || '-')} | ظرفیت: {String((h as any).capacity || '-')}</p><p className="text-xs text-gray-500 mt-1">تسک‌ها: {tasks.filter((t:Task)=>t.hotelId===Number(h.id)).length}</p><div className="flex gap-2 mt-4"><button className="btn secondary" onClick={()=>openHotel(h)}>پرونده</button><button className="btn" onClick={()=>openCreate(h)}>+ تسک</button></div></div>)}</section>}
function TeamPage({tasks,members}:{tasks:Task[];members:ManagedUser[]}){return <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">{members.map(u=>{const ut=tasks.filter(t=>t.assignee===u.name||t.manager===u.name||t.createdBy===u.name);return <div key={u.id} className="card p-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center"><Users/></div><div><h3 className="font-black">{u.name}</h3><p className="text-sm text-gray-500">{roleLabel(u.role)} | {u.team}</p></div></div><div className="grid grid-cols-3 gap-2 mt-4 text-center"><div className="p-2 rounded-2xl bg-gray-50"><b>{ut.length}</b><p className="text-xs text-gray-500">کل</p></div><div className="p-2 rounded-2xl bg-red-50"><b>{ut.filter(isOverdue).length}</b><p className="text-xs text-gray-500">عقب</p></div><div className="p-2 rounded-2xl bg-green-50"><b>{ut.filter(t=>t.status==='انجام‌شده').length}</b><p className="text-xs text-gray-500">انجام</p></div></div></div>})}</section>}

function AdminTeamPage({members,setMembers,tasks}:{members:ManagedUser[];setMembers:(m:ManagedUser[])=>void;tasks:Task[]}){
  const blank: ManagedUser = { id:'u-'+Date.now(), name:'', role:'expert', team:'مرکز', active:true, phone:'', title:'' };
  const [editing,setEditing]=useState<ManagedUser|null>(null);
  const [search,setSearch]=useState('');
  const list=members.filter(m=>!search || [m.name,m.team,m.role,m.phone,m.title].join(' ').includes(search));
  function save(){ if(!editing?.name.trim()) return alert('نام کارشناس را وارد کن'); const exists=members.some(m=>m.id===editing.id); setMembers(exists?members.map(m=>m.id===editing.id?editing:m):[{...editing,id:editing.id||'u-'+uid()},...members]); setEditing(null); }
  function toggle(id:string){ setMembers(members.map(m=>m.id===id?{...m,active:m.active===false}:m)); }
  function remove(id:string){ if(confirm('این عضو حذف شود؟')) setMembers(members.filter(m=>m.id!==id)); }
  function reset(){ if(confirm('لیست تیم به حالت اولیه برگردد؟')) setMembers(users.map(u=>({...u,active:true}))); }
  return <section className="space-y-4">
    <div className="card p-5 bg-gradient-to-l from-teal-50 to-white"><div className="flex flex-wrap justify-between gap-3 items-center"><div><h2 className="text-2xl font-black flex items-center gap-2"><ShieldCheck/> مدیریت کارشناس‌ها و تیم</h2><p className="text-gray-500 mt-1">این صفحه فقط برای مدیر کل نمایش داده می‌شود. از اینجا می‌توانی اعضا، نقش، زون و وضعیت فعال بودن را مدیریت کنی.</p></div><div className="flex gap-2"><button className="btn" onClick={()=>setEditing(blank)}><UserPlus size={17}/> افزودن عضو</button><button className="btn secondary" onClick={reset}>بازگشت به تیم پیش‌فرض</button></div></div></div>
    <section className="grid md:grid-cols-4 gap-3"><Kpi title="کل اعضا" value={members.length} icon={<Users/>}/><Kpi title="فعال" value={members.filter(m=>m.active!==false).length} icon={<CheckCircle2/>}/><Kpi title="مدیر/سیتی‌منیجر" value={members.filter(m=>['admin','manager'].includes(m.role)).length} icon={<ShieldCheck/>}/><Kpi title="کارشناس‌ها" value={members.filter(m=>!['admin','manager'].includes(m.role)).length} icon={<ListTodo/>}/></section>
    <div className="card p-4"><input className="input" placeholder="جستجوی نام، تیم، نقش، شماره..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
    <div className="tableWrap"><table className="tbl"><thead><tr><th>نام</th><th>سمت</th><th>نقش</th><th>تیم/زون</th><th>تلفن</th><th>KPI تسک</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{list.map(m=>{const mt=tasks.filter(t=>t.assignee===m.name||t.manager===m.name||t.createdBy===m.name);const done=mt.filter(t=>t.status==='انجام‌شده').length;const late=mt.filter(isOverdue).length;return <tr key={m.id}><td><b>{m.name}</b></td><td>{m.title||'-'}</td><td>{roleLabel(m.role)}</td><td>{m.team}</td><td>{m.phone||'-'}</td><td><span className="badge" style={{background:'#f1f5f9'}}>کل {mt.length}</span> <span className="badge" style={{background:'#dcfce7'}}>انجام {done}</span> <span className="badge" style={{background:'#fee2e2'}}>عقب {late}</span></td><td><span className="badge" style={{background:m.active===false?'#fee2e2':'#dcfce7',color:m.active===false?'#991b1b':'#166534'}}>{m.active===false?'غیرفعال':'فعال'}</span></td><td><div className="flex gap-2"><button className="btn secondary" onClick={()=>setEditing(m)}><Edit3 size={15}/></button><button className="btn secondary" onClick={()=>toggle(m.id)}>{m.active===false?'فعال کن':'غیرفعال'}</button>{m.role!=='admin'&&<button className="btn danger" onClick={()=>remove(m.id)}><Trash2 size={15}/></button>}</div></td></tr>})}</tbody></table></div>
    <div className="card p-5"><h3 className="font-black mb-3">پیشنهادهای هوشمند مدیریتی</h3><div className="grid md:grid-cols-3 gap-3"><div className="p-4 rounded-3xl bg-red-50"><b>هشدار عقب‌افتادگی</b><p className="text-sm text-gray-600 mt-1">اعضایی که بیش از ۳ تسک عقب‌افتاده دارند را هر روز بررسی کن.</p></div><div className="p-4 rounded-3xl bg-blue-50"><b>بالانس بار کاری</b><p className="text-sm text-gray-600 mt-1">اگر اختلاف تسک باز بین دو کارشناس زیاد شد، بخشی از تسک‌ها را منتقل کن.</p></div><div className="p-4 rounded-3xl bg-green-50"><b>تمرکز روی هتل‌های A/B</b><p className="text-sm text-gray-600 mt-1">تسک فوری هتل‌های مهم فقط به کارشناس فعال و کم‌بار Assign شود.</p></div></div></div>
    {editing&&<div className="modalBack"><div className="modal p-5 max-w-2xl"><div className="flex justify-between items-center mb-4"><h3 className="text-2xl font-black">{members.some(m=>m.id===editing.id)?'ویرایش عضو':'افزودن عضو'}</h3><button className="btn secondary" onClick={()=>setEditing(null)}>×</button></div><div className="grid md:grid-cols-2 gap-3"><Field label="نام کامل"><input className="input" value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/></Field><Field label="سمت داخلی"><input className="input" placeholder="مثلاً کارشناس نرخ و ظرفیت" value={editing.title||''} onChange={e=>setEditing({...editing,title:e.target.value})}/></Field><Field label="نقش"><select className="input" value={editing.role} onChange={e=>setEditing({...editing,role:e.target.value as Role})}><option value="admin">مدیر کل</option><option value="manager">سیتی‌منیجر</option><option value="expert">کارشناس</option><option value="capacity">کنترل ظرفیت</option><option value="content">محتوا/پنل</option></select></Field><Field label="تیم / زون"><select className="input" value={editing.team} onChange={e=>setEditing({...editing,team:e.target.value})}>{['مدیریت تامین','مرکز','شرق و جنوب','شمال و غرب','کنترل ظرفیت','پنل و محتوا','هتل خارجی'].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="شماره تماس"><input className="input" value={editing.phone||''} onChange={e=>setEditing({...editing,phone:e.target.value})}/></Field><Field label="وضعیت"><select className="input" value={editing.active===false?'false':'true'} onChange={e=>setEditing({...editing,active:e.target.value==='true'})}><option value="true">فعال</option><option value="false">غیرفعال</option></select></Field></div><div className="flex gap-2 mt-5"><button className="btn" onClick={save}>ذخیره عضو</button><button className="btn secondary" onClick={()=>setEditing(null)}>انصراف</button></div></div></div>}
  </section>
}

function SettingsPage(){return <section className="grid lg:grid-cols-2 gap-4"><div className="card p-5"><h2 className="text-xl font-black mb-3">راهنمای آنلاین کردن</h2><ol className="list-decimal pr-5 space-y-2 text-gray-700"><li>در Supabase یک Project بساز.</li><li>محتوای فایل <b>src/app/schema.sql</b> را در SQL Editor اجرا کن.</li><li>در Vercel دو Environment Variable بگذار: <b>NEXT_PUBLIC_SUPABASE_URL</b> و <b>NEXT_PUBLIC_SUPABASE_ANON_KEY</b>.</li><li>Redeploy بزن. بعد از آن همه کارشناسان داده مشترک و لحظه‌ای می‌بینند.</li></ol></div><div className="card p-5"><h2 className="text-xl font-black mb-3">وضعیت‌ها و دسته‌ها</h2><p className="text-gray-500 mb-2">وضعیت‌ها: {statuses.join('، ')}</p><p className="text-gray-500">دسته‌بندی‌ها: {categories.join('، ')}</p></div></section>}
function TaskForm({form,setForm,save,close,expertsList,managersList}:any){return <div className="modalBack"><div className="modal p-5"><div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-black">{form.id?'ویرایش تسک':'ایجاد تسک جدید'}</h2><button className="btn secondary" onClick={close}>×</button></div><div className="grid md:grid-cols-2 gap-3"><Field label="عنوان"><input className="input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></Field><Field label="هتل"><select className="input" value={form.hotelId} onChange={e=>setForm({...form,hotelId:Number(e.target.value)})}>{hotels.map(h=><option key={String(h.id)} value={String(h.id)}>{String((h as any).name)} - {String((h as any).city)}</option>)}</select></Field><Field label="دسته"><select className="input" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="اولویت"><select className="input" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>{priorities.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="وضعیت"><select className="input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{statuses.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="مسئول"><select className="input" value={form.assignee} onChange={e=>setForm({...form,assignee:e.target.value})}>{(expertsList?.length?expertsList:experts).map((x:string)=><option key={x}>{x}</option>)}</select></Field><Field label="مدیر / سیتی‌منیجر"><select className="input" value={form.manager} onChange={e=>setForm({...form,manager:e.target.value})}>{(managersList?.length?managersList:managers).map((x:string)=><option key={x}>{x}</option>)}</select></Field><Field label="ددلاین"><input className="input" type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/></Field><Field label="تگ‌ها"><input className="input" placeholder="پیک، قرارداد، A/B" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/></Field><Field label="شرح"><textarea className="input" rows={4} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></Field></div><div className="flex gap-2 mt-5"><button className="btn" onClick={save}>ذخیره</button><button className="btn secondary" onClick={close}>انصراف</button></div></div></div>}
function Field({label,children}:{label:string;children:any}){return <label className="block"><span className="text-sm text-gray-500 mb-1 block">{label}</span>{children}</label>}
function TaskModal({task,close,patchTask,removeTask,openEdit,currentUser}:any){const [comment,setComment]=useState('');const [result,setResult]=useState(task.result||'');async function addComment(){if(!comment.trim()) return; await patchTask(task.id,{comments:[...task.comments,{id:uid(),user:currentUser.name,text:comment,at:new Date().toISOString()}]},'کامنت ثبت شد');setComment('');}async function toggleItem(itemId:string){await patchTask(task.id,{checklist:task.checklist.map((i:any)=>i.id===itemId?{...i,done:!i.done,doneBy:!i.done?currentUser.name:undefined,doneAt:!i.done?new Date().toISOString():undefined}:i)},'چک‌لیست بروزرسانی شد');}return <div className="modalBack"><div className="modal"><div className="p-5 border-b flex justify-between items-start gap-3"><div><h2 className="text-2xl font-black">{task.title}</h2><p className="text-gray-500 mt-1">{task.hotelName} | {task.city} | {task.id}</p></div><button className="btn secondary" onClick={close}>×</button></div><div className="p-5 grid lg:grid-cols-3 gap-4"><div className="lg:col-span-2 space-y-4"><div className="card p-4 shadow-none"><h3 className="font-black mb-2">شرح تسک</h3><p className="text-gray-700 leading-8">{task.description || 'بدون توضیح'}</p><div className="flex flex-wrap gap-2 mt-3">{task.tags.map((x:string)=><span key={x} className="badge" style={{background:'#f1f5f9'}}>{x}</span>)}</div></div><div className="card p-4 shadow-none"><h3 className="font-black mb-3">چک‌لیست ({progress(task)}٪)</h3><div className="progress mb-3"><span style={{width:progress(task)+'%'}}/></div>{task.checklist.map((i:any)=><label key={i.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50"><input type="checkbox" checked={i.done} onChange={()=>toggleItem(i.id)}/><span className={i.done?'line-through text-gray-400':''}>{i.title}</span></label>)}</div><div className="card p-4 shadow-none"><h3 className="font-black mb-3">کامنت و نتیجه پیگیری</h3><div className="space-y-2 mb-3">{task.comments.map((c:any)=><div key={c.id} className="p-3 rounded-2xl bg-gray-50"><b>{c.user}</b><p>{c.text}</p><small className="text-gray-500">{new Date(c.at).toLocaleString('fa-IR')}</small></div>)}</div><div className="flex gap-2"><input className="input" value={comment} onChange={e=>setComment(e.target.value)} placeholder="مثلاً: تماس گرفتم، هتل ظرفیت را تا عصر ارسال می‌کند..."/><button className="btn" onClick={addComment}><MessageCircle size={16}/> ثبت</button></div><textarea className="input mt-3" rows={3} value={result} onChange={e=>setResult(e.target.value)} placeholder="نتیجه نهایی"/><button className="btn secondary mt-2" onClick={()=>patchTask(task.id,{result},'نتیجه نهایی ذخیره شد')}>ذخیره نتیجه</button></div></div><aside className="space-y-3"><div className="card p-4 shadow-none"><h3 className="font-black mb-3">اطلاعات</h3><Info k="وضعیت" v={task.status}/><Info k="اولویت" v={task.priority}/><Info k="دسته" v={task.category}/><Info k="مسئول" v={task.assignee}/><Info k="مدیر" v={task.manager}/><Info k="ددلاین" v={task.dueDate}/><div className="grid gap-2 mt-3">{statuses.map(s=><button key={s} className="btn secondary" onClick={()=>patchTask(task.id,{status:s},`وضعیت به ${s} تغییر کرد`)}>{s}</button>)}</div></div><div className="card p-4 shadow-none"><h3 className="font-black mb-2">Timeline</h3>{task.activities.slice().reverse().map((a:any)=><div key={a.id} className="border-r-2 border-teal-700 pr-3 pb-3"><b className="text-sm">{a.action}</b><p className="text-xs text-gray-500">{a.user} | {new Date(a.at).toLocaleString('fa-IR')}</p></div>)}</div><div className="flex gap-2"><button className="btn secondary flex-1" onClick={()=>openEdit(task)}><Edit3 size={16}/> ویرایش</button><button className="btn danger" onClick={()=>removeTask(task.id)}><Trash2 size={16}/></button></div></aside></div></div></div>}
function Info({k,v}:{k:string;v:string}){return <div className="flex justify-between border-b py-2"><span className="text-gray-500">{k}</span><b>{v}</b></div>}
function HotelModal({hotel,close,tasks,openCreate,openTask}:any){return <div className="modalBack"><div className="modal p-5"><div className="flex justify-between items-start gap-3 mb-4"><div><h2 className="text-2xl font-black">{String(hotel.name)}</h2><p className="text-gray-500">{String(hotel.city)} | {String(hotel.province || '')} | {String(hotel.type || '')}</p></div><button className="btn secondary" onClick={close}>×</button></div><section className="grid md:grid-cols-4 gap-3 mb-4"><Kpi title="تسک‌های هتل" value={tasks.length} icon={<ListTodo/>}/><Kpi title="باز" value={tasks.filter((t:Task)=>activeStatuses.includes(t.status)).length} icon={<Clock3/>}/><Kpi title="عقب‌افتاده" value={tasks.filter(isOverdue).length} icon={<CalendarDays/>} danger/><Kpi title="انجام‌شده" value={tasks.filter((t:Task)=>t.status==='انجام‌شده').length} icon={<CheckCircle2/>}/></section><div className="card p-4 shadow-none mb-4"><h3 className="font-black mb-2">اطلاعات هتل</h3><p className="text-gray-700">ظرفیت: {String(hotel.capacity || '-')} | دسته: {String(hotel.category || '-')} | تلفن: {String(hotel.phone || '-')}</p></div><button className="btn mb-4" onClick={()=>openCreate(hotel)}><Plus size={16}/> ایجاد تسک برای این هتل</button><div className="space-y-2">{tasks.map((t:Task)=><button key={t.id} onClick={()=>openTask(t)} className="w-full text-right p-3 rounded-2xl border hover:bg-gray-50"><div className="flex justify-between"><b>{t.title}</b><ChevronLeft/></div><p className="text-sm text-gray-500">{t.status} | {t.assignee} | {t.dueDate}</p></button>)}</div></div></div>}
