import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Calendar, Clock, Home } from "lucide-react";
import { useJournal } from "@/context/JournalContext";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { loading, userName, setUserName, newMilestone, clearMilestone } = useJournal();
  const [nameInput, setNameInput] = useState("");

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
    }
  };

  const navItems = [
    { path: "/today", icon: Home, label: "Today" },
    { path: "/body", icon: Activity, label: "Body" },
    { path: "/calendar", icon: Calendar, label: "Calendar" },
    { path: "/history", icon: Clock, label: "History" },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] pb-[env(safe-area-inset-bottom)]">
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location === path || (location === "/" && path === "/today");
            return (
              <Link key={path} href={path} className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

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
                <label htmlFor="name" className="text-sm font-medium text-foreground">What should we call you?</label>
                <input
                  id="name"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!nameInput.trim()}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 transition-opacity"
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
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-opacity"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
