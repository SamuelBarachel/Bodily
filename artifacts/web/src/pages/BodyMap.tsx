import { useState, useRef } from "react";
import { useJournal, PainMarker } from "@/context/JournalContext";
import { BottomSheet } from "@/components/BottomSheet";
import { Mic, MicOff, Save, Loader2 } from "lucide-react";
import { useSummarizeBodilyRecording } from "@workspace/api-client-react";
import { toast } from "sonner";

const REGIONS = [
  { id: "head", label: "Head", cx: 50, cy: 10, r: 8 },
  { id: "neck", label: "Neck", cx: 50, cy: 22, r: 5 },
  { id: "chest", label: "Chest", cx: 50, cy: 35, r: 10 },
  { id: "abdomen", label: "Abdomen", cx: 50, cy: 50, r: 10 },
  { id: "left-shoulder", label: "Left Shoulder", cx: 30, cy: 28, r: 6 },
  { id: "right-shoulder", label: "Right Shoulder", cx: 70, cy: 28, r: 6 },
  { id: "left-upper-arm", label: "Left Upper Arm", cx: 25, cy: 40, r: 5 },
  { id: "right-upper-arm", label: "Right Upper Arm", cx: 75, cy: 40, r: 5 },
  { id: "left-forearm", label: "Left Forearm", cx: 20, cy: 55, r: 4 },
  { id: "right-forearm", label: "Right Forearm", cx: 80, cy: 55, r: 4 },
  { id: "left-hand", label: "Left Hand", cx: 15, cy: 68, r: 4 },
  { id: "right-hand", label: "Right Hand", cx: 85, cy: 68, r: 4 },
  { id: "left-thigh", label: "Left Thigh", cx: 40, cy: 65, r: 7 },
  { id: "right-thigh", label: "Right Thigh", cx: 60, cy: 65, r: 7 },
  { id: "left-knee", label: "Left Knee", cx: 40, cy: 78, r: 5 },
  { id: "right-knee", label: "Right Knee", cx: 60, cy: 78, r: 5 },
  { id: "left-shin", label: "Left Shin", cx: 40, cy: 88, r: 4 },
  { id: "right-shin", label: "Right Shin", cx: 60, cy: 88, r: 4 },
  { id: "left-foot", label: "Left Foot", cx: 40, cy: 98, r: 4 },
  { id: "right-foot", label: "Right Foot", cx: 60, cy: 98, r: 4 },
];

const BACK_REGIONS = [
  { id: "upper-back", label: "Upper Back", cx: 50, cy: 35, r: 10 },
  { id: "lower-back", label: "Lower Back", cx: 50, cy: 50, r: 10 },
];

export default function BodyMap() {
  const { todayEntry, saveEntry } = useJournal();
  const [view, setView] = useState<"front" | "back">("front");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  
  const currentMarkers = todayEntry?.painMarkers || [];
  
  const activeRegionMarker = selectedRegion 
    ? currentMarkers.find(m => m.slug === selectedRegion) 
    : null;

  const [painLevel, setPainLevel] = useState<number>(activeRegionMarker?.painLevel || 1);
  const [notes, setNotes] = useState(activeRegionMarker?.notes || "");
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const summarizeMutation = useSummarizeBodilyRecording();
  const recognitionRef = useRef<any>(null);

  const SpeechRec = typeof window !== "undefined" && (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const getPainColor = (level: number) => {
    switch(level) {
      case 1: return "hsl(142, 71%, 45%)";
      case 2: return "hsl(84, 81%, 44%)";
      case 3: return "hsl(45, 93%, 47%)";
      case 4: return "hsl(25, 95%, 53%)";
      case 5: return "hsl(0, 84%, 60%)";
      case 6: return "hsl(0, 63%, 31%)";
      default: return "hsl(37, 20%, 83%)";
    }
  };

  const handleRegionClick = (id: string) => {
    setSelectedRegion(id);
    const existing = currentMarkers.find(m => m.slug === id);
    setPainLevel(existing?.painLevel || 1);
    setNotes(existing?.notes || "");
    setTranscript("");
  };

  const toggleRecording = () => {
    if (!SpeechRec) {
      toast.error("Speech recognition not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + " " + finalTranscript);
        }
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    }
  };

  const handleSaveMarker = async () => {
    if (!selectedRegion) return;

    let finalSummary = "";
    
    if (transcript.trim()) {
      try {
        const res = await summarizeMutation.mutateAsync({
          data: {
            bodyPart: selectedRegion,
            transcript: transcript
          }
        });
        finalSummary = res.summary;
      } catch (err) {
        toast.error("Failed to summarize recording.");
      }
    }

    const newMarker: PainMarker = {
      slug: selectedRegion,
      painLevel,
      notes: notes || transcript,
      summary: finalSummary || notes
    };

    const newMarkers = [...currentMarkers.filter(m => m.slug !== selectedRegion), newMarker];

    await saveEntry({
      response: todayEntry?.response || "",
      mood: todayEntry?.mood || 3,
      bodyMetrics: todayEntry?.bodyMetrics || { energy: 3, sleep: 3, tension: 3, hydration: 3 },
      painMarkers: newMarkers
    });

    setSelectedRegion(null);
    toast.success("Pain marker saved");
  };

  const activeRegions = view === "front" ? REGIONS : [...REGIONS.filter(r => !["chest", "abdomen", "face"].includes(r.id)), ...BACK_REGIONS];

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 pb-8 animate-in fade-in duration-500 flex flex-col items-center">
      <header className="w-full space-y-1 text-left">
        <h1 className="text-2xl font-serif font-medium text-foreground">Body Map</h1>
        <p className="text-muted-foreground text-sm">Where are you holding tension today?</p>
      </header>

      <div className="flex bg-secondary p-1 rounded-xl w-full max-w-[200px] mx-auto">
        <button 
          onClick={() => setView("front")}
          className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${view === "front" ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          Front
        </button>
        <button 
          onClick={() => setView("back")}
          className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${view === "back" ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          Back
        </button>
      </div>

      <div className="relative w-full max-w-[280px] aspect-[1/2] mx-auto">
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-sm">
          {/* Base simplified silhouette silhouette */}
          <path 
            d="M50 5 C55 5, 58 10, 58 15 C58 20, 55 25, 50 25 C45 25, 42 20, 42 15 C42 10, 45 5, 50 5 Z M45 25 L55 25 L65 30 L75 40 L85 60 L80 65 L70 45 L65 70 L65 110 L55 110 L55 70 L45 70 L45 110 L35 110 L35 70 L30 45 L20 65 L15 60 L25 40 L35 30 Z" 
            fill="hsl(var(--card))" 
            stroke="hsl(var(--border))" 
            strokeWidth="0.5" 
          />
          
          {activeRegions.map(region => {
            const marker = currentMarkers.find(m => m.slug === region.id);
            const fillColor = marker ? getPainColor(marker.painLevel) : "transparent";
            const strokeColor = marker ? "none" : "hsl(37, 20%, 83%)";

            return (
              <circle
                key={region.id}
                cx={region.cx}
                cy={region.cy}
                r={region.r}
                strokeWidth="1"
                className="cursor-pointer transition-all hover:opacity-80"
                style={{
                  fill: fillColor,
                  stroke: strokeColor,
                  filter: marker ? 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' : 'none',
                }}
                onPointerDown={() => handleRegionClick(region.id)}
              />
            );
          })}
        </svg>
      </div>

      <BottomSheet isOpen={!!selectedRegion} onClose={() => {
        if (!isRecording) setSelectedRegion(null);
      }}>
        {selectedRegion && (
          <div className="space-y-6 pt-2">
            <div>
              <h3 className="text-xl font-serif font-medium capitalize text-foreground">{selectedRegion.replace('-', ' ')}</h3>
              <p className="text-sm text-muted-foreground">Log sensations for this area.</p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pain / Tension Level</label>
              <div className="flex gap-2 justify-between">
                {[1,2,3,4,5,6].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setPainLevel(lvl)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-transform ${painLevel === lvl ? 'scale-110 shadow-md text-white' : 'opacity-50 text-foreground'}`}
                    style={{ backgroundColor: getPainColor(lvl) }}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Notes</label>
                {SpeechRec && (
                  <button 
                    onClick={toggleRecording}
                    className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-destructive/10 text-destructive animate-pulse' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                  >
                    {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                )}
              </div>
              
              <textarea
                value={transcript || notes}
                onChange={(e) => {
                  if (transcript) setTranscript(e.target.value);
                  else setNotes(e.target.value);
                }}
                placeholder="Describe how it feels..."
                className="w-full min-h-[100px] bg-background border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            <button
              onClick={handleSaveMarker}
              disabled={summarizeMutation.isPending || isRecording}
              className="w-full py-4 bg-primary text-primary-foreground font-medium rounded-xl shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:bg-primary/90"
            >
              {summarizeMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Save Marker
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
