import { useState } from "react";
import { useJournal } from "@/context/JournalContext";
import { Edit2, Save } from "lucide-react";

export default function Today() {
  const { todayEntry, todayPrompt, saveEntry, streak, userName } = useJournal();
  const [isEditing, setIsEditing] = useState(!todayEntry);
  
  const [mood, setMood] = useState<number>(todayEntry?.mood || 3);
  const [energy, setEnergy] = useState<number>(todayEntry?.bodyMetrics?.energy || 3);
  const [sleep, setSleep] = useState<number>(todayEntry?.bodyMetrics?.sleep || 3);
  const [tension, setTension] = useState<number>(todayEntry?.bodyMetrics?.tension || 3);
  const [hydration, setHydration] = useState<number>(todayEntry?.bodyMetrics?.hydration || 3);
  const [response, setResponse] = useState(todayEntry?.response || "");

  const handleSave = async () => {
    await saveEntry({
      response,
      mood,
      bodyMetrics: { energy, sleep, tension, hydration },
      painMarkers: todayEntry?.painMarkers || []
    });
    setIsEditing(false);
  };

  const moodColors = ["bg-[hsl(var(--mood1))]", "bg-[hsl(var(--mood2))]", "bg-[hsl(var(--mood3))]", "bg-[hsl(var(--mood4))]", "bg-[hsl(var(--mood5))]"];
  const moodLabels = ["Drained", "Tired", "Okay", "Energized", "Thriving"];

  return (
    <div className="max-w-md mx-auto p-6 space-y-8 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-medium text-foreground">Hello, {userName || "friend"}.</h1>
          <p className="text-muted-foreground text-sm mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 rounded-full">
            <span className="text-accent text-sm font-medium">{streak} day streak</span>
          </div>
        )}
      </header>

      {isEditing ? (
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Overall Mood</h2>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={`mood-${val}`}
                  onClick={() => setMood(val)}
                  className={`flex-1 flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${mood === val ? 'bg-card shadow-sm scale-105' : 'opacity-70 hover:opacity-100'}`}
                >
                  <div className={`w-8 h-8 rounded-full ${moodColors[val - 1]} transition-transform ${mood === val ? 'scale-110 shadow-md' : ''}`} />
                  <span className={`text-[10px] font-medium ${mood === val ? 'text-foreground' : 'text-muted-foreground'}`}>{moodLabels[val - 1]}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Body Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Energy", state: energy, setState: setEnergy, labels: ["Depleted", "Low", "Moderate", "High", "Radiant"] },
                { label: "Sleep", state: sleep, setState: setSleep, labels: ["Poor", "Restless", "Fair", "Good", "Deep"] },
                { label: "Tension", state: tension, setState: setTension, labels: ["Very High", "High", "Moderate", "Low", "None"] },
                { label: "Hydration", state: hydration, setState: setHydration, labels: ["Parched", "Dry", "Okay", "Good", "Well"] }
              ].map((metric) => (
                <div key={metric.label} className="bg-card p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground text-sm">{metric.label}</span>
                    <span className="text-[10px] text-muted-foreground bg-background px-2 py-1 rounded-md">{metric.labels[metric.state - 1]}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={metric.state}
                    onChange={(e) => metric.setState(Number(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Reflection</h2>
            <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 focus-within:border-primary/50 transition-colors">
              <p className="text-foreground font-serif text-lg leading-snug mb-4">{todayPrompt}</p>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Write your reflection..."
                className="w-full min-h-[120px] bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
              />
            </div>
          </section>

          <button
            onClick={handleSave}
            disabled={!response.trim()}
            className="w-full py-4 bg-primary text-primary-foreground font-medium rounded-xl shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:bg-primary/90"
          >
            <Save size={18} />
            Save Entry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-3xl space-y-6 shadow-sm border border-border/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm ${moodColors[(todayEntry?.mood || 3) - 1]}`}>
                    {moodLabels[(todayEntry?.mood || 3) - 1]}
                 </div>
                 <div>
                    <h3 className="font-medium text-foreground">Today's Check-in</h3>
                    <p className="text-sm text-muted-foreground">Saved</p>
                 </div>
              </div>
              <button onClick={() => setIsEditing(true)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors">
                <Edit2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-border">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Energy</span>
                  <p className="font-medium text-foreground text-sm">{["Depleted", "Low", "Moderate", "High", "Radiant"][(todayEntry?.bodyMetrics?.energy || 3) - 1]}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sleep</span>
                  <p className="font-medium text-foreground text-sm">{["Poor", "Restless", "Fair", "Good", "Deep"][(todayEntry?.bodyMetrics?.sleep || 3) - 1]}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tension</span>
                  <p className="font-medium text-foreground text-sm">{["Very High", "High", "Moderate", "Low", "None"][(todayEntry?.bodyMetrics?.tension || 3) - 1]}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Hydration</span>
                  <p className="font-medium text-foreground text-sm">{["Parched", "Dry", "Okay", "Good", "Well"][(todayEntry?.bodyMetrics?.hydration || 3) - 1]}</p>
                </div>
            </div>

            <div className="pt-4 border-t border-border space-y-3">
               <p className="text-muted-foreground text-sm font-serif italic">"{todayPrompt}"</p>
               <p className="text-foreground whitespace-pre-wrap leading-relaxed">{todayEntry?.response}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
