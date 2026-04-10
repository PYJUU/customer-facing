import { Card } from "@/components/ui/card";

const items = [
  { label: "站点总数", value: "0" },
  { label: "最近扫描", value: "0" },
  { label: "严重问题", value: "0" },
  { label: "平均健康分", value: "--" },
];

export default function DashboardPage() {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">仪表盘</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {items.map((item) => (
          <Card key={item.label}>
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-bold">{item.value}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
