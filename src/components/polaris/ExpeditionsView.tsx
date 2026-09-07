import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import {
  FONT_HEAD, STATIONS, EXP_STATUSES, computeReadiness, uid, currency
} from '../../data/polarisData';
import {
  Badge, Modal, Field, Toolbar, Table, PageHeader, ReadinessBar, inputClass, inputStyle
} from './SharedUI';

export function ExpeditionForm({ t, onSave, onClose, initial }: { t: any; onSave: (f: any) => void; onClose: () => void; initial?: any }) {
  const [f, setF] = useState(initial || { name: "", region: "Antarctica", destination: "", base: "", start: "", end: "", status: "Planning", objectives: "", description: "" });
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  return (
    <Modal title={initial ? "Edit Expedition" : "New Expedition"} onClose={onClose} t={t} wide>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Expedition Name" t={t}><input value={f.name} onChange={set("name")} style={inputStyle(t)} className={inputClass} /></Field>
        <Field label="Region" t={t}>
          <select value={f.region} onChange={set("region")} style={inputStyle(t)} className={inputClass}><option>Antarctica</option><option>Arctic</option></select>
        </Field>
        <Field label="Base / Station" t={t}>
          <select value={f.base} onChange={set("base")} style={inputStyle(t)} className={inputClass}>
            <option value="">Select station</option>
            {STATIONS.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Destination" t={t}><input value={f.destination} onChange={set("destination")} style={inputStyle(t)} className={inputClass} /></Field>
        <Field label="Start Date" t={t}><input type="date" value={f.start} onChange={set("start")} style={inputStyle(t)} className={inputClass} /></Field>
        <Field label="End Date" t={t}><input type="date" value={f.end} onChange={set("end")} style={inputStyle(t)} className={inputClass} /></Field>
        <Field label="Status" t={t}>
          <select value={f.status} onChange={set("status")} style={inputStyle(t)} className={inputClass}>{EXP_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
        </Field>
        <div />
        <div className="col-span-2"><Field label="Objectives" t={t}><textarea value={f.objectives} onChange={set("objectives")} style={inputStyle(t)} className={inputClass} rows={2} /></Field></div>
        <div className="col-span-2"><Field label="Description" t={t}><textarea value={f.description} onChange={set("description")} style={inputStyle(t)} className={inputClass} rows={2} /></Field></div>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} style={{ color: t.textDim }} className="px-4 py-2 text-sm cursor-pointer">Cancel</button>
        <button onClick={() => onSave(f)} disabled={!f.name} style={{ background: t.accent, color: "#04222A" }} className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer">Save Expedition</button>
      </div>
    </Modal>
  );
}

export function Expeditions({ t, db, setDb, openDetail, canEdit }: { t: any; db: any; setDb: React.Dispatch<React.SetStateAction<any>>; openDetail: (id: string) => void; canEdit: boolean }) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const rows = db.expeditions.filter((e: any) => (e.name + e.region + e.status + e.destination).toLowerCase().includes(search.toLowerCase()));

  const addExpedition = (f: any) => {
    const id = uid("EXP", db.expeditions.length + 1);
    setDb((d: any) => ({ ...d, expeditions: [...d.expeditions, { ...f, id, manager: "PER-0001" }] }));
    setShowForm(false);
  };

  return (
    <div>
      <PageHeader t={t} title="Expeditions" subtitle="Plan, monitor and manage every Arctic and Antarctic mission from one place." />
      <Toolbar t={t} search={search} setSearch={setSearch} onAdd={canEdit ? () => setShowForm(true) : null} addLabel="New Expedition" />
      <Table t={t} rows={rows} onRowClick={(r) => openDetail(r.id)} columns={[
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "region", label: "Region" },
        { key: "base", label: "Base" },
        { key: "start", label: "Start" },
        { key: "end", label: "End" },
        { key: "status", label: "Status", render: (r: any) => <Badge status={r.status} t={t} /> },
        { key: "readiness", label: "Readiness", render: (r: any) => `${computeReadiness(r, db).overall}%` },
        { key: "view", label: "", render: () => <ChevronRight size={15} color={t.textFaint} /> },
      ]} />
      {showForm && <ExpeditionForm t={t} onClose={() => setShowForm(false)} onSave={addExpedition} />}
    </div>
  );
}

const EXP_TABS = ["Overview","Timeline","Team","Assets","Inventory","Shipments","Tasks","Maintenance","Expenses","Alerts"];

export function ExpeditionDetail({ t, db, expId, onBack }: { t: any; db: any; expId: string; onBack: () => void }) {
  const [tab, setTab] = useState("Overview");
  const exp = db.expeditions.find((e: any) => e.id === expId);
  if (!exp) return null;

  const readiness = computeReadiness(exp, db);
  const team = db.personnel.filter((p: any) => p.expeditionId === exp.id);
  const linkedAssets = db.assets.filter((a: any) => a.expeditionId === exp.id);
  const linkedShipments = db.shipments.filter((s: any) => s.expeditionId === exp.id);
  const linkedTasks = db.tasks.filter((tk: any) => tk.expeditionId === exp.id);
  const linkedMaint = db.maintenance.filter((m: any) => linkedAssets.some((a: any) => a.id === m.assetId));
  const exp_cost = db.expenses.find((e: any) => e.expeditionId === exp.id);
  const linkedAlerts = db.alerts.filter((a: any) => a.expeditionId === exp.id);
  const costData = exp_cost ? Object.entries(exp_cost).filter(([k]) => k !== "expeditionId").map(([k, v]) => ({ name: k, value: v as number })) : [];

  return (
    <div>
      <button onClick={onBack} style={{ color: t.textDim }} className="flex items-center gap-1 text-sm mb-3 cursor-pointer"><ChevronRight size={14} className="rotate-180" /> Back to Expeditions</button>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-xl font-semibold">{exp.name}</h1>
            <Badge status={exp.status} t={t} />
          </div>
          <p style={{ color: t.textDim }} className="text-sm mt-1">{exp.id} &middot; {exp.region} &middot; {exp.destination} &middot; {exp.start} to {exp.end}</p>
        </div>
      </div>

      <div style={{ background: t.panel, border: `1px solid ${t.border}` }} className="rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <span style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-sm font-semibold">Expedition Readiness Score</span>
          <span style={{ color: readiness.overall > 80 ? t.green : readiness.overall > 60 ? t.amber : t.red, fontFamily: FONT_HEAD }} className="text-xl font-bold">{readiness.overall}%</span>
        </div>
        <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))" }}>
          <ReadinessBar t={t} label="Personnel" value={readiness.personnel} />
          <ReadinessBar t={t} label="Assets" value={readiness.assets} />
          <ReadinessBar t={t} label="Inventory" value={readiness.inventory} />
          <ReadinessBar t={t} label="Transport" value={readiness.transport} />
          <ReadinessBar t={t} label="Maintenance" value={readiness.maintenance} />
        </div>
      </div>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {EXP_TABS.map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{ background: tab === tb ? t.accentSoft : "transparent", color: tab === tb ? t.accent : t.textDim, border: `1px solid ${tab === tb ? t.accent : t.border}` }} className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer">{tb}</button>
        ))}
      </div>

      {tab === "Overview" && (
        <div style={{ background: t.panel, border: `1px solid ${t.border}` }} className="rounded-xl p-5 space-y-3">
          <div><span style={{ color: t.textDim }} className="text-xs">Objectives</span><p style={{ color: t.text }} className="text-sm mt-1">{exp.objectives}</p></div>
          <div><span style={{ color: t.textDim }} className="text-xs">Description</span><p style={{ color: t.text }} className="text-sm mt-1">{exp.description}</p></div>
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div><span style={{ color: t.textDim }} className="text-xs">Base / Station</span><p style={{ color: t.text }} className="text-sm">{exp.base}</p></div>
            <div><span style={{ color: t.textDim }} className="text-xs">Expedition Manager</span><p style={{ color: t.text }} className="text-sm">{db.personnel.find((p: any) => p.id === exp.manager)?.name || exp.manager}</p></div>
            <div><span style={{ color: t.textDim }} className="text-xs">Team Size</span><p style={{ color: t.text }} className="text-sm">{team.length} members</p></div>
          </div>
        </div>
      )}
      {tab === "Timeline" && (
        <div style={{ background: t.panel, border: `1px solid ${t.border}` }} className="rounded-xl p-5">
          {["Planning","Preparation","In Transit","Active","Returning","Completed"].map((stage, i) => {
            const order = EXP_STATUSES.indexOf(exp.status);
            const stageOrder = EXP_STATUSES.indexOf(stage);
            const done = stageOrder <= order;
            return (
              <div key={stage} className="flex items-center gap-3 pb-4 relative">
                {i < 5 && <div style={{ background: done ? t.accent : t.border, left: 7 }} className="absolute top-4 w-0.5 h-full" />}
                <div style={{ background: done ? t.accent : t.bgAlt, border: `2px solid ${done ? t.accent : t.border}` }} className="w-4 h-4 rounded-full shrink-0 z-10" />
                <span style={{ color: done ? t.text : t.textFaint }} className="text-sm">{stage}</span>
              </div>
            );
          })}
        </div>
      )}
      {tab === "Team" && <Table t={t} rows={team} columns={[{key:"id",label:"ID"},{key:"name",label:"Name"},{key:"role",label:"Role"},{key:"department",label:"Dept"},{key:"status",label:"Status",render:(r:any)=><Badge status={r.status} t={t}/>}]} />}
      {tab === "Assets" && <Table t={t} rows={linkedAssets} columns={[{key:"id",label:"ID"},{key:"name",label:"Name"},{key:"category",label:"Category"},{key:"condition",label:"Condition"},{key:"status",label:"Status",render:(r:any)=><Badge status={r.status} t={t}/>}]} />}
      {tab === "Inventory" && <Table t={t} rows={db.inventory.filter((i: any) => i.location.includes(exp.base))} columns={[{key:"id",label:"ID"},{key:"name",label:"Item"},{key:"quantity",label:"Qty",render:(r:any)=>`${r.quantity} ${r.unit}`},{key:"minStock",label:"Min Stock"},{key:"location",label:"Location"}]} />}
      {tab === "Shipments" && <Table t={t} rows={linkedShipments} columns={[{key:"id",label:"ID"},{key:"origin",label:"Origin"},{key:"destination",label:"Destination"},{key:"cargo",label:"Cargo"},{key:"status",label:"Status",render:(r:any)=><Badge status={r.status} t={t}/>}]} />}
      {tab === "Tasks" && <Table t={t} rows={linkedTasks} columns={[{key:"id",label:"ID"},{key:"name",label:"Task"},{key:"priority",label:"Priority"},{key:"deadline",label:"Deadline"},{key:"status",label:"Status",render:(r:any)=><Badge status={r.status} t={t}/>}]} />}
      {tab === "Maintenance" && <Table t={t} rows={linkedMaint} columns={[{key:"id",label:"ID"},{key:"assetName",label:"Asset"},{key:"type",label:"Type"},{key:"status",label:"Status",render:(r:any)=><Badge status={r.status} t={t}/>}]} />}
      {tab === "Expenses" && (
        <div style={{ background: t.panel, border: `1px solid ${t.border}` }} className="rounded-xl p-5">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: t.textFaint, fontSize: 11 }} axisLine={{ stroke: t.border }} tickLine={false} />
              <YAxis tick={{ fill: t.textFaint, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v=>`${v/100000}L`} />
              <Tooltip formatter={(v: any) => currency(Number(v))} contentStyle={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" fill={t.accent} radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <p style={{ color: t.text, fontFamily: FONT_HEAD }} className="text-sm font-semibold mt-2">Total: {currency(costData.reduce((s,c)=>s+c.value,0))}</p>
        </div>
      )}
      {tab === "Alerts" && <Table t={t} rows={linkedAlerts} columns={[{key:"type",label:"Type"},{key:"severity",label:"Severity",render:(r:any)=><Badge status={r.severity} t={t}/>},{key:"description",label:"Description"}]} />}
    </div>
  );
}
