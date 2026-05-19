import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getEntries,
  saveEntry as apiSaveEntry,
  deleteEntry as apiDeleteEntry,
} from "@workspace/api-client-react";

const STORAGE_KEY = "bodily_journal_entries";
const MILESTONES_KEY = "bodily_milestones_seen";
const USERNAME_KEY = "bodily_username";
const USERID_KEY = "bodily_user_id";
const MILESTONES = [7, 30, 60];

export interface BodyMetrics {
  energy: number;
  tension: number;
  sleep: number;
  hydration: number;
}

export interface PainMarker {
  slug: string;
  painLevel: number;
  notes: string;
  summary: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  prompt: string;
  response: string;
  mood: number;
  bodyMetrics: BodyMetrics;
  createdAt: string;
  painMarkers?: PainMarker[];
}

function ls(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function generateUserId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

const DAILY_PROMPTS = [
  "How does your body feel right now? Take a slow breath and scan from head to toe.",
  "Describe your energy levels today — where do you feel vitality, and where do you feel heaviness?",
  "Are you holding tension anywhere? Notice your jaw, shoulders, stomach, and hands.",
  "How did you sleep last night? What sensations greeted you when you woke?",
  "What does your body need most today — rest, movement, nourishment, or connection?",
  "Notice your breathing right now. Is it shallow, deep, rushed, or calm?",
  "How has your body moved today? Describe any physical sensations from movement.",
  "What physical discomfort, if any, are you carrying? What story might it tell?",
  "How is your body responding to nourishment and hydration today?",
  "Where in your body do you feel the most aliveness right now?",
  "Describe the quality of your rest today — physical, mental, and emotional.",
  "What posture have you been holding most of the day, and how does it feel?",
  "Notice any areas of your body that feel tight, numb, or disconnected.",
  "How would you describe your body's rhythm today — frantic, steady, or sluggish?",
  "What physical pleasure or comfort have you experienced today, even something small?",
  "Describe the temperature and physical sensations your body has experienced today.",
  "Notice your heartbeat. Has it felt racing, slow, or steady throughout the day?",
  "What physical boundaries has your body communicated today? Did you listen?",
  "As you end this day, what does your body most want you to know?",
  "Where does your body feel strong and capable today? Acknowledge that strength.",
  "How has your body supported you through today's challenges?",
  "What sensations arise when you place one hand on your heart right now?",
];

function getTodayPrompt(): string {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function calculateStreak(entries: Record<string, JournalEntry>): number {
  let streak = 0;
  const now = new Date();
  const todayStr = formatDate(now);
  const checkDate = new Date(now);

  if (!entries[todayStr]) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (streak < 365) {
    const dateStr = formatDate(checkDate);
    if (entries[dateStr]) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

interface JournalContextType {
  entries: Record<string, JournalEntry>;
  todayPrompt: string;
  todayEntry: JournalEntry | null;
  streak: number;
  newMilestone: number | null;
  clearMilestone: () => void;
  saveEntry: (data: {
    response: string;
    mood: number;
    bodyMetrics: BodyMetrics;
    painMarkers?: PainMarker[];
  }) => Promise<void>;
  deleteEntry: (date: string) => Promise<void>;
  loading: boolean;
  userName: string;
  setUserName: (name: string) => Promise<void>;
  syncing: boolean;
}

const JournalContext = createContext<JournalContextType | null>(null);

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Record<string, JournalEntry>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [seenMilestones, setSeenMilestones] = useState<number[]>([]);
  const [newMilestone, setNewMilestone] = useState<number | null>(null);
  const [userName, setUserNameState] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  const todayKey = formatDate(new Date());
  const todayPrompt = getTodayPrompt();
  const todayEntry = entries[todayKey] ?? null;

  const streak = useMemo(() => calculateStreak(entries), [entries]);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = ls(STORAGE_KEY);
        const milestonesRaw = ls(MILESTONES_KEY);
        const nameRaw = ls(USERNAME_KEY);
        let uid = ls(USERID_KEY);

        if (!uid) {
          uid = generateUserId();
          lsSet(USERID_KEY, uid);
        }
        setUserId(uid);

        const localEntries: Record<string, JournalEntry> = raw
          ? (JSON.parse(raw) as Record<string, JournalEntry>)
          : {};

        if (Object.keys(localEntries).length > 0) {
          setEntries(localEntries);
        }

        if (milestonesRaw) setSeenMilestones(JSON.parse(milestonesRaw) as number[]);
        if (nameRaw) setUserNameState(nameRaw);

        setLoading(false);

        setSyncing(true);
        try {
          const result = await getEntries({ userId: uid });
          if (result.entries && Object.keys(result.entries).length > 0) {
            const merged = { ...localEntries, ...result.entries };
            setEntries(merged);
            lsSet(STORAGE_KEY, JSON.stringify(merged));
          }
        } catch {
          // Firebase unreachable — local data remains
        } finally {
          setSyncing(false);
        }
      } catch {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (streak === 0) return;
    const unshown = MILESTONES.find(
      (m) => streak >= m && !seenMilestones.includes(m)
    );
    if (unshown) {
      setNewMilestone(unshown);
    }
  }, [streak, seenMilestones]);

  const clearMilestone = useCallback(async () => {
    if (newMilestone === null) return;
    const updated = [...seenMilestones, newMilestone];
    setSeenMilestones(updated);
    setNewMilestone(null);
    lsSet(MILESTONES_KEY, JSON.stringify(updated));
  }, [newMilestone, seenMilestones]);

  const setUserName = useCallback(async (name: string) => {
    setUserNameState(name);
    lsSet(USERNAME_KEY, name);
  }, []);

  const saveEntry = useCallback(
    async (data: {
      response: string;
      mood: number;
      bodyMetrics: BodyMetrics;
      painMarkers?: PainMarker[];
    }) => {
      const entry: JournalEntry = {
        id: todayKey,
        date: todayKey,
        prompt: todayPrompt,
        response: data.response,
        mood: data.mood,
        bodyMetrics: data.bodyMetrics,
        createdAt: new Date().toISOString(),
        painMarkers: data.painMarkers,
      };

      const updated = { ...entries, [todayKey]: entry };
      setEntries(updated);
      lsSet(STORAGE_KEY, JSON.stringify(updated));

      if (userId) {
        try {
          await apiSaveEntry(todayKey, entry, { userId });
        } catch {
          // Firebase write failed — entry is still saved locally
        }
      }
    },
    [entries, todayKey, todayPrompt, userId]
  );

  const deleteEntry = useCallback(
    async (date: string) => {
      const updated = { ...entries };
      delete updated[date];
      setEntries(updated);
      lsSet(STORAGE_KEY, JSON.stringify(updated));

      if (userId) {
        try {
          await apiDeleteEntry(date, { userId });
        } catch {
          // Firebase delete failed — entry is still removed locally
        }
      }
    },
    [entries, userId]
  );

  return (
    <JournalContext.Provider
      value={{
        entries,
        todayPrompt,
        todayEntry,
        streak,
        newMilestone,
        clearMilestone,
        saveEntry,
        deleteEntry,
        loading,
        userName,
        setUserName,
        syncing,
      }}
    >
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal() {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error("useJournal must be used inside JournalProvider");
  return ctx;
}
