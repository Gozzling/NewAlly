interface StatCardProps {
  label: string
  value: string
  valueClass?: string
  subtext?: string
}

export function StatCard({ label, value, valueClass = 'text-white', subtext }: StatCardProps) {
  return (
    <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-widest text-[#a1a1a1] mb-1">{label}</div>
      <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
      {subtext && <div className="text-[11px] text-[#a1a1a1] mt-1">{subtext}</div>}
    </div>
  )
}
