import { useState, useEffect } from "react";
import { Lock, Delete } from "lucide-react";

const PIN_KEY = "bodily_pin_hash";
const PIN_SET_KEY = "bodily_pin_set";

function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export function isPinSet(): boolean {
  try {
    return localStorage.getItem(PIN_SET_KEY) === "true";
  } catch {
    return false;
  }
}

export function setPin(pin: string): void {
  try {
    localStorage.setItem(PIN_KEY, hashPin(pin));
    localStorage.setItem(PIN_SET_KEY, "true");
  } catch {}
}

export function removePin(): void {
  try {
    localStorage.removeItem(PIN_KEY);
    localStorage.removeItem(PIN_SET_KEY);
  } catch {}
}

export function checkPin(pin: string): boolean {
  try {
    const stored = localStorage.getItem(PIN_KEY);
    return stored === hashPin(pin);
  } catch {
    return false;
  }
}

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (checkPin(next)) {
          onUnlock();
        } else {
          setShake(true);
          setError(true);
          setTimeout(() => {
            setPin("");
            setShake(false);
          }, 600);
        }
      }, 100);
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setError(false);
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center gap-10 p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock size={28} className="text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Your journal is locked</h1>
        <p className="text-muted-foreground text-base">Enter your 4-digit PIN to continue</p>
      </div>

      <div className={`flex gap-4 transition-transform ${shake ? "animate-bounce" : ""}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-colors ${
              i < pin.length
                ? error
                  ? "bg-destructive border-destructive"
                  : "bg-primary border-primary"
                : "border-border bg-transparent"
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-destructive text-sm font-medium -mt-6">Incorrect PIN, try again</p>
      )}

      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {digits.map((d, i) => {
          if (d === "") return <div key={i} />;
          if (d === "del") {
            return (
              <button
                key={i}
                onClick={handleDelete}
                className="h-16 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground active:scale-95 transition-transform"
              >
                <Delete size={22} />
              </button>
            );
          }
          return (
            <button
              key={i}
              onClick={() => handleDigit(d)}
              className="h-16 rounded-2xl bg-card border border-border text-foreground text-2xl font-semibold active:scale-95 transition-transform hover:bg-secondary shadow-sm"
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SetPinModalProps {
  onClose: () => void;
  onSet: () => void;
  isChanging?: boolean;
}

export function SetPinModal({ onClose, onSet, isChanging }: SetPinModalProps) {
  const [step, setStep] = useState<"current" | "new" | "confirm">(isChanging ? "current" : "new");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const activePin = step === "current" ? currentPin : step === "new" ? newPin : confirmPin;
  const setActivePin = step === "current" ? setCurrentPin : step === "new" ? setNewPin : setConfirmPin;

  const handleDigit = (d: string) => {
    if (activePin.length >= 4) return;
    const next = activePin + d;
    setActivePin(next);
    setError("");

    if (next.length === 4) {
      setTimeout(() => {
        if (step === "current") {
          if (!checkPin(next)) {
            setError("Incorrect current PIN");
            setTimeout(() => { setCurrentPin(""); setError(""); }, 800);
          } else {
            setStep("new");
          }
        } else if (step === "new") {
          setStep("confirm");
        } else {
          if (next !== newPin) {
            setError("PINs don't match, try again");
            setTimeout(() => { setConfirmPin(""); setNewPin(""); setStep("new"); setError(""); }, 800);
          } else {
            setPin(next);
            onSet();
          }
        }
      }, 100);
    }
  };

  const handleDelete = () => {
    setActivePin((p) => p.slice(0, -1));
    setError("");
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  const title = step === "current" ? "Enter current PIN" : step === "new" ? "Choose a 4-digit PIN" : "Confirm your PIN";

  return (
    <div className="fixed inset-0 z-[150] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl leading-none">&times;</button>
        </div>

        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-colors ${
                i < activePin.length ? "bg-primary border-primary" : "border-border"
              }`}
            />
          ))}
        </div>

        {error && <p className="text-destructive text-sm text-center">{error}</p>}

        <div className="grid grid-cols-3 gap-3">
          {digits.map((d, i) => {
            if (d === "") return <div key={i} />;
            if (d === "del") {
              return (
                <button key={i} onClick={handleDelete} className="h-14 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground active:scale-95 transition-transform">
                  <Delete size={20} />
                </button>
              );
            }
            return (
              <button key={i} onClick={() => handleDigit(d)} className="h-14 rounded-xl bg-background border border-border text-foreground text-xl font-semibold active:scale-95 transition-transform hover:bg-secondary">
                {d}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
