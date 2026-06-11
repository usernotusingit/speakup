"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { day: "S", lessons: 0 },
  { day: "M", lessons: 5 },
  { day: "T", lessons: 6 },
  { day: "W", lessons: 3 },
  { day: "T", lessons: 6 },
  { day: "F", lessons: 4 },
  { day: "S", lessons: 0 },
];

export default function LessonsChart() {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barSize={28}>
        <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip
          cursor={{ fill: "#f3f4f6" }}
          contentStyle={{ borderRadius: 8, border: "none", fontSize: 12 }}
        />
        <Bar dataKey="lessons" fill="#5c6bc0" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
