import { useMemo } from "react";
import { useJournal } from "@/context/JournalContext";
import { Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function History() {
  const { entries, deleteEntry, streak } = useJournal();

  const entriesList = useMemo(() => {
    return Object.values(entries).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries]);

  const stats = useMemo(() => {
    if (entriesList.length === 0) return { days: 0, avgMood: 0 };
    const sum = entriesList.reduce((acc, e) => acc + e.mood, 0);
    return {
      days: entriesList.length,
      avgMood: Math.round((sum / entriesList.length) * 10) / 10
    };
  }, [entriesList]);

  const chartData = useMemo(() => {
    // Last 30 days
    const data = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const entry = entries[dateStr];
      data.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        energy: entry ? entry.bodyMetrics.energy : null,
        tension: entry ? entry.bodyMetrics.tension : null,
      });
    }
    return data;
  }, [entries]);

  const moodColors = ["bg-[hsl(var(--mood1))]", "bg-[hsl(var(--mood2))]", "bg-[hsl(var(--mood3))]", "bg-[hsl(var(--mood4))]", "bg-[hsl(var(--mood5))]"];
  const moodLabels = ["Drained", "Tired", "Okay", "Energized", "Thriving"];

  return (
    <div className="max-w-md mx-auto p-6 space-y-8 pb-8 animate-in fade-in duration-500">
      <header className="space-y-1">
        <h1 className="text-2xl font-serif font-medium text-foreground">History</h1>
        <p className="text-muted-foreground text-sm">Review your journey.</p>
      </header>

      <div className="grid grid-cols-3 gap-3">
         <div className="bg-card rounded-2xl p-4 border border-border flex flex-col items-center justify-center text-center space-y-1">
           <span className="text-2xl font-serif text-foreground">{stats.days}</span>
           <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Entries</span>
         </div>
         <div className="bg-card rounded-2xl p-4 border border-border flex flex-col items-center justify-center text-center space-y-1">
           <span className="text-2xl font-serif text-foreground">{streak}</span>
           <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak</span>
         </div>
         <div className="bg-card rounded-2xl p-4 border border-border flex flex-col items-center justify-center text-center space-y-1">
           <span className="text-2xl font-serif text-foreground">{stats.avgMood}</span>
           <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Mood</span>
         </div>
      </div>

      {entriesList.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Energy & Tension (30d)</h2>
          <div className="bg-card rounded-2xl p-4 border border-border h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" hide />
                <YAxis domain={[1, 5]} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="energy" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="tension" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">All Entries</h2>
        <div className="space-y-3">
          {entriesList.map(entry => (
            <div key={entry.id} className="bg-card rounded-2xl p-5 border border-border space-y-3 group">
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-3">
                   <div className={`w-3 h-3 rounded-full ${moodColors[entry.mood - 1]}`} />
                   <div>
                     <h3 className="font-medium text-sm text-foreground">{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</h3>
                     <p className="text-xs text-muted-foreground">{moodLabels[entry.mood - 1]}</p>
                   </div>
                 </div>
                 <button 
                   onClick={() => deleteEntry(entry.date)}
                   className="p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                   <Trash2 size={16} />
                 </button>
              </div>
              <p className="text-sm text-foreground line-clamp-3 leading-relaxed">{entry.response}</p>
              
              {entry.painMarkers && entry.painMarkers.length > 0 && (
                <div className="flex gap-1.5 flex-wrap pt-2">
                  {entry.painMarkers.map((p, i) => (
                    <span key={i} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-[10px] font-medium capitalize">
                      {p.slug.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {entriesList.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <p>No entries yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
