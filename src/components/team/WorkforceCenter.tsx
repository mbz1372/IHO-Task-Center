'use client';

import { useState } from 'react';
import { Building2, Edit3, Eye, MoreHorizontal, Plus, Trash2, Users } from 'lucide-react';

export type WorkforceDepartment = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  manager_id?: string;
  is_active: boolean;
};

type WorkforceUser = {
  id: string;
  full_name: string;
  username: string;
  email?: string;
  avatar?: string;
  role?: string;
  role_id?: string;
  team?: string;
  zone?: string;
  department_id?: string;
  department_name?: string;
  is_active: boolean;
};

type WorkforceRole = { id: string; title: string };
type WorkforceTask = { id: string; assigned_to?: string; assigned_name?: string; status: string; department_id?: string };

type WorkforceCenterProps = {
  users: WorkforceUser[];
  roles: WorkforceRole[];
  tasks: WorkforceTask[];
  departments: WorkforceDepartment[];
  profile: (user: WorkforceUser) => void;
  edit: (user: WorkforceUser) => void;
  add: () => void;
  remove: (id: string) => void;
  addDepartment: () => void;
  editDepartment: (department: WorkforceDepartment) => void;
};

const normalize = (value: string | undefined) => String(value || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('fa');
const doneStatuses = new Set(['انجام شد', 'بسته شده', 'تایید شده']);
const reviewStatuses = new Set(['ارسال برای تایید', 'در انتظار تایید', 'بازبینی', 'نیازمند اصلاح']);

function UserAvatar({ user, size = 'normal' }: { user: WorkforceUser; size?: 'normal' | 'mini' | 'xl' }) {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(user.avatar && !failed);
  return (
    <span className={`avatar workforceAvatar ${size} ${hasImage ? 'hasImage' : ''}`} aria-hidden="true">
      {hasImage ? <img src={user.avatar} alt="" onError={() => setFailed(true)} /> : user.full_name?.slice(0, 1) || 'U'}
    </span>
  );
}

export function WorkforceCenter({ users, roles, tasks, departments, profile, edit, add, remove, addDepartment, editDepartment }: WorkforceCenterProps) {
  const [view, setView] = useState<'activity' | 'list'>('activity');
  const [departmentId, setDepartmentId] = useState('all');
  const activeDepartments = departments.filter(department => department.is_active);
  const selectedDepartment = activeDepartments.find(department => department.id === departmentId);
  const visibleUsers = departmentId === 'all' ? users : users.filter(user => user.department_id === departmentId);
  const active = visibleUsers.filter(user => user.is_active).length;
  const roleTitle = (user: WorkforceUser) => roles.find(role => role.id === user.role_id)?.title || user.role || 'کاربر';
  const departmentTitle = (user: WorkforceUser) => user.department_name || activeDepartments.find(department => department.id === user.department_id)?.name || user.team || 'بدون دپارتمان';
  const ownedTasks = (user: WorkforceUser) => tasks.filter(task => task.assigned_to === user.id || (!task.assigned_to && normalize(task.assigned_name) === normalize(user.full_name)));
  const statsFor = (user: WorkforceUser) => {
    const owned = ownedTasks(user);
    return {
      total: owned.length,
      backlog: owned.filter(task => !doneStatuses.has(task.status) && !reviewStatuses.has(task.status)).length,
      inReview: owned.filter(task => reviewStatuses.has(task.status)).length,
      done: owned.filter(task => doneStatuses.has(task.status)).length,
    };
  };
  const maxWorkload = Math.max(1, ...visibleUsers.map(user => statsFor(user).total));
  const chartUsers = [...visibleUsers].sort((a, b) => statsFor(b).total - statsFor(a).total).slice(0, 12);

  return (
    <div className="employeesPage workforceCenterV22">
      <section className="departmentCenterV22" aria-labelledby="department-center-title">
        <header className="departmentCenterHeadV22">
          <div>
            <span className="sectionEyebrowV22">ساختار سازمانی</span>
            <h2 id="department-center-title">دپارتمان‌ها</h2>
            <p>کارشناسان و تسک‌ها را بر اساس واحد سازمانی مدیریت و مقایسه کن.</p>
          </div>
          <div className="actions">
            <select aria-label="انتخاب دپارتمان" value={departmentId} onChange={event => setDepartmentId(event.target.value)}>
              <option value="all">همه دپارتمان‌ها</option>
              {activeDepartments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
            <button className="btn primary" onClick={addDepartment}><Plus /> دپارتمان جدید</button>
          </div>
        </header>
        <div className="departmentCardsV22">
          {activeDepartments.map(department => {
            const departmentUsers = users.filter(user => user.department_id === department.id);
            const departmentTasks = tasks.filter(task => task.department_id === department.id || departmentUsers.some(user => user.id === task.assigned_to));
            const openTasks = departmentTasks.filter(task => !doneStatuses.has(task.status)).length;
            return (
              <article className={departmentId === department.id ? 'selected' : ''} key={department.id}>
                <button type="button" className="departmentSelectV22" onClick={() => setDepartmentId(department.id)} aria-pressed={departmentId === department.id}>
                  <span className="departmentIconV22" style={{ backgroundColor: `${department.color || '#2563eb'}1a`, color: department.color || '#2563eb' }}><Building2 /></span>
                  <span><b>{department.name}</b><small>{department.description || 'بدون توضیح'}</small></span>
                  <strong>{departmentUsers.length.toLocaleString('fa-IR')}<small>کارشناس</small></strong>
                  <strong>{openTasks.toLocaleString('fa-IR')}<small>تسک باز</small></strong>
                </button>
                <button type="button" className="departmentEditV22" aria-label={`ویرایش دپارتمان ${department.name}`} onClick={() => editDepartment(department)}><Edit3 /></button>
              </article>
            );
          })}
          {!activeDepartments.length && <div className="emptyDepartmentV22"><Building2 /><b>هنوز دپارتمانی تعریف نشده است</b><span>برای شروع «دپارتمان جدید» را بزن.</span></div>}
        </div>
      </section>

      <section className="workloadChartV22 card" aria-labelledby="workload-title">
        <header>
          <div><span className="sectionEyebrowV22">Workload analytics</span><h3 id="workload-title">نمودار بار کاری کارشناسان</h3></div>
          <span>{selectedDepartment?.name || 'همه دپارتمان‌ها'} · {visibleUsers.length.toLocaleString('fa-IR')} نفر</span>
        </header>
        <div className="workloadLegendV22"><span><i className="open" /> باز</span><span><i className="review" /> بازبینی</span><span><i className="done" /> تکمیل‌شده</span></div>
        <div className="workloadRowsV22">
          {chartUsers.map(user => {
            const stats = statsFor(user);
            return <div className="workloadRowV22" key={user.id}>
              <UserAvatar user={user} size="mini" />
              <span className="workloadIdentityV22"><b>{user.full_name}</b><small>{departmentTitle(user)}</small></span>
              <div className="workloadTrackV22" aria-label={`${stats.total} تسک برای ${user.full_name}`}>
                <i className="open" style={{ width: `${stats.backlog / maxWorkload * 100}%` }} />
                <i className="review" style={{ width: `${stats.inReview / maxWorkload * 100}%` }} />
                <i className="done" style={{ width: `${stats.done / maxWorkload * 100}%` }} />
              </div>
              <b className="workloadTotalV22">{stats.total.toLocaleString('fa-IR')}</b>
            </div>;
          })}
          {!chartUsers.length && <div className="emptyChartV22"><Users /><span>برای این دپارتمان هنوز کارشناسی ثبت نشده است.</span></div>}
        </div>
      </section>

      <div className="employeesHead">
        <div><h2>کارشناسان ({visibleUsers.length.toLocaleString('fa-IR')})</h2><p className="muted">تصویر پروفایل، دپارتمان، نقش و وضعیت بار کاری هر کارشناس</p></div>
        <div className="actions"><div className="seg" role="group" aria-label="نوع نمایش کارشناسان"><button aria-pressed={view === 'list'} className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>فهرست</button><button aria-pressed={view === 'activity'} className={view === 'activity' ? 'on' : ''} onClick={() => setView('activity')}>عملکرد</button></div><button className="btn primary" onClick={add}><Plus /> افزودن کارشناس</button></div>
      </div>

      {view === 'activity' ? <div className="employeeCards">{visibleUsers.map(user => {
        const stats = statsFor(user);
        return <article className={`employeeCard ${!user.is_active ? 'sleep' : ''}`} key={user.id}>
          <div className="profileBand"><UserAvatar user={user} /><h3>{user.full_name}</h3><p>{roleTitle(user)}</p><span>{departmentTitle(user)}</span></div>
          <div className="employeeStats"><div><b>{stats.backlog}</b><small>صف انتظار</small></div><div><b>{stats.inReview}</b><small>در بازبینی</small></div><div><b>{stats.done}</b><small>تکمیل‌شده</small></div></div>
          <div className="actions center"><button className="btn primary" onClick={() => profile(user)}><Eye /> پروفایل</button><button className="btn ghost" onClick={() => edit(user)}><Edit3 /> ویرایش</button><button className="iconBtn dangerBtn" aria-label={`حذف کارشناس ${user.full_name}`} onClick={() => remove(user.id)}><Trash2 /></button></div>
        </article>;
      })}</div> : <div className="employeeList">{visibleUsers.map(user => <div className="employeeRow workforceRowV22" key={user.id}>
        <UserAvatar user={user} size="mini" /><div><b>{user.full_name}</b><small>{user.email || user.username}</small></div><span>دپارتمان<br /><b>{departmentTitle(user)}</b></span><span>تیم<br /><b>{user.team || '—'}</b></span><span>منطقه<br /><b>{user.zone || '—'}</b></span><span>سمت<br /><b>{roleTitle(user)}</b></span><button className="iconBtn" aria-label={`مشاهده پروفایل ${user.full_name}`} onClick={() => profile(user)}><Eye /></button><button className="iconBtn" aria-label={`ویرایش ${user.full_name}`} onClick={() => edit(user)}><MoreHorizontal /></button>
      </div>)}</div>}
      <div className="profilePreview card"><div><h3>نمای سازمانی کارشناسان</h3><p>با انتخاب هر دپارتمان، اعضا و بار کاری همان واحد را مشاهده کن.</p></div><div className="profileMetrics"><span><b>{active}</b>فعال</span><span><b>{activeDepartments.length}</b>دپارتمان</span><span><b>{visibleUsers.length - active}</b>غیرفعال</span></div></div>
    </div>
  );
}
