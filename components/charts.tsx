export function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-extrabold tracking-tight">{title}</h2>
      {subtitle && <p className="mb-4 text-xs text-slate-500">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      {children}
    </section>
  )
}

export function Tile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

export function ColumnChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex gap-1">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1" title={`${d.label}: ${d.value}`}>
          <span className="h-4 text-[10px] font-semibold text-slate-600">{d.value > 0 ? d.value : ''}</span>
          <div className="flex h-28 w-full items-end">
            <div
              className="w-full rounded-t bg-indigo-500"
              style={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 6 : 2)}%`, opacity: d.value > 0 ? 1 : 0.25 }}
            />
          </div>
          <span className="text-[9px] text-slate-500">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export function HBars({
  data,
  max,
  suffix = '',
}: {
  data: { label: string; value: number; note?: string }[]
  max?: number
  suffix?: string
}) {
  if (data.length === 0) return <p className="text-sm text-slate-500">No data yet.</p>
  const top = max ?? Math.max(1, ...data.map((d) => d.value))
  return (
    <ul className="flex flex-col gap-3">
      {data.map((d) => (
        <li key={d.label}>
          <div className="flex justify-between gap-3 text-sm">
            <span className="font-medium">{d.label}</span>
            <span className="text-slate-600">
              {d.value}
              {suffix}
              {d.note ? ` · ${d.note}` : ''}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.min(100, (d.value / top) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function HourStrip({ data }: { data: number[] }) {
  const max = Math.max(1, ...data)
  return (
    <div>
      <div className="flex gap-0.5">
        {data.map((n, h) => (
          <div
            key={h}
            title={`${h}:00 · ${n} uploads`}
            className="h-10 flex-1 rounded-sm bg-indigo-500"
            style={{ opacity: n === 0 ? 0.08 : 0.2 + 0.8 * (n / max) }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>12a</span>
        <span>6a</span>
        <span>12p</span>
        <span>6p</span>
        <span>11p</span>
      </div>
    </div>
  )
}