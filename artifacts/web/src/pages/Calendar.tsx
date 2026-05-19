import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useJournal } from "@/context/JournalContext";
import { BottomSheet } from "@/components/BottomSheet";

export default function Calendar() {
  const { entries } = useJournal();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const moodColors = ["bg-[hsl(var(--mood1))]", "bg-[hsl(var(--mood2))]", "bg-[hsl(var(--mood3))]", "bg-[hsl(var(--mood4))]", "bg-[hsl(var(--mood5))]"];
  const moodLabels = ["Drained", "Tired", "Okay", "Energized", "Thriving"];

  const selectedEntry = selectedDate ? entries[selectedDate] : null;

  return (
    <div className="max-w-md mx-auto p-6 space-y-8 pb-8 animate-in fade-in duration-500">
      <header className="space-y-1">
        <h1 className="text-2xl font-serif font-medium text-foreground">Calendar</h1>
        <p className="text-muted-foreground text-sm">Your journey over time.</p>
      </header>

      <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-serif font-medium text-lg">
            {monthNames[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {blanks.map(blank => (
            <div key={`blank-${blank}`} className="aspect-square" />
          ))}
          {days.map(day => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const entry = entries[dateStr];
            const isToday = dateStr === new Date().toISOString().split("T")[0];
            
            return (
              <button
                key={day}
                disabled={!entry}
                onClick={() => entry && setSelectedDate(dateStr)}
                className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-transform relative
                  ${entry ? 'hover:scale-105 cursor-pointer text-white shadow-sm ' + moodColors[entry.mood - 1] : 'text-muted-foreground hover:bg-secondary cursor-default'}
                  ${isToday && !entry ? 'border-2 border-primary/30 text-primary' : ''}
                `}
              >
                {day}
                {isToday && entry && <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-card rounded-2xl p-4 border border-border flex items-center justify-between px-6">
         {moodLabels.map((label, idx) => (
           <div key={label} className="flex flex-col items-center gap-1.5">
             <div className={`w-4 h-4 rounded-full ${moodColors[idx]}`} />
             <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
           </div>
         ))}
      </div>

      <BottomSheet isOpen={!!selectedDate} onClose={() => setSelectedDate(null)}>
        {selectedEntry && (
          <div className="space-y-6 pt-2">
             <div className="flex items-center gap-3 mb-6">
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm ${moodColors[selectedEntry.mood - 1]}`}>
                    {moodLabels[selectedEntry.mood - 1]}
                 </div>
                 <div>
                    <h3 className="font-medium text-foreground">{new Date(selectedEntry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Energy</span>
                  <p className="font-medium text-foreground text-sm">{["Depleted", "Low", "Moderate", "High", "Radiant"][selectedEntry.bodyMetrics.energy - 1]}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sleep</span>
                  <p className="font-medium text-foreground text-sm">{["Poor", "Restless", "Fair", "Good", "Deep"][selectedEntry.bodyMetrics.sleep - 1]}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tension</span>
                  <p className="font-medium text-foreground text-sm">{["Very High", "High", "Moderate", "Low", "None"][selectedEntry.bodyMetrics.tension - 1]}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Hydration</span>
                  <p className="font-medium text-foreground text-sm">{["Parched", "Dry", "Okay", "Good", "Well"][selectedEntry.bodyMetrics.hydration - 1]}</p>
                </div>
            </div>

            <div className="pt-4 border-t border-border space-y-3">
               <p className="text-muted-foreground text-sm font-serif italic">"{selectedEntry.prompt}"</p>
               <p className="text-foreground whitespace-pre-wrap leading-relaxed">{selectedEntry.response}</p>
            </div>

            {selectedEntry.painMarkers && selectedEntry.painMarkers.length > 0 && (
              <div className="pt-4 border-t border-border space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pain Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEntry.painMarkers.map((marker, i) => (
                    <span key={i} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium capitalize">
                      {marker.slug.replace('-', ' ')} • Level {marker.painLevel}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
