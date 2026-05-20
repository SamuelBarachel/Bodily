import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Calendar, Clock, Home, Settings, Lock, Unlock } from "lucide-react";
import { useJournal } from "@/context/JournalContext";
import { SetPinModal, isPinSet, removePin } from "./LockScreen";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { loading, userName, setUserName, newMilestone, clearMilestone } = useJournal();
  const [nameInput, setNameInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showSetPin, setShowSetPin] = useState(false);
  const [pinIsSet, setPinIsSet] = useState(isPinSet());

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
    }
  };

  const handleRemovePin = () => {
    removePin();
    setPinIsSet(false);
    setShowSettings(false);
  };

  const navItems = [
    { path: "/today", icon: Home, label: "Today" },
    { path: "/body", icon: Activity, label: "Body" },
    { path: "/calendar", icon: Calendar, label: "Calendar" },
    { path: "/history", icon: Clock, label: "History" },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] pb-[env(safe-area-inset-bottom)]">
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex items-center justify-around h-20 max-w-md mx-auto px-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location === path || (location === "/" && path === "/today");
            return (
              <Link
                key={path}
                href={path}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1.5 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  size={28}
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden="true"
                />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowSettings(true)}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings size={28} strokeWidth={2} aria-hidden="true" />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground text-2xl leading-none">&times;</button>
            </div>
            <div className="bg-background rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {pinIsSet
                  ? <Lock size={22} className="text-primary shrink-0" />
                  : <Unlock size={22} className="text-muted-foreground shrink-0" />
                }
                <div>
                  <p className="font-medium text-foreground">PIN Lock</p>
                  <p className="text-muted-foreground text-sm">{pinIsSet ? "Your journal is protected" : "No PIN set"}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => { setShowSettings(false); setShowSetPin(true); }}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                >
                  {pinIsSet ? "Change" : "Set PIN"}
                </button>
                {pinIsSet && (
                  <button
                    onClick={handleRemovePin}
                    className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Set PIN Modal */}
      {showSetPin && (
        <SetPinModal
          isChanging={pinIsSet}
          onClose={() => setShowSetPin(false)}
          onSet={() => {
            setPinIsSet(true);
            setShowSetPin(false);
          }}
        />
      )}

      {/* Welcome Modal */}
      {!loading && !userName && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl p-6 space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-serif font-semibold text-foreground">Welcome to Bodily</h2>
              <p className="text-muted-foreground">A quiet space for body awareness.</p>
            </div>
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-base font-medium text-foreground">What should we call you?</label>
                <input
                  id="name"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!nameInput.trim()}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 transition-opacity text-base"
              >
                Begin Journey
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Milestone Modal */}
      {newMilestone && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in duration-300">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl p-6 space-y-6 text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto text-accent mb-4">
              <Activity size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-semibold text-foreground">{newMilestone} Days</h2>
              <p className="text-muted-foreground">You've checked in with your body for {newMilestone} days. Thank you for showing up for yourself.</p>
            </div>
            <button
              onClick={clearMilestone}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-opacity text-base"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
