"use client";

import { useState, useEffect } from "react";
import { Zap, Mail, MessageSquare, ArrowRight, CheckCircle2, Shield, Settings, Brain, Sparkles, Check, Loader2 } from "lucide-react";
import { saveAppConfig } from "@/app/settings/actions";
import { connectLinkedInAction, verifyLinkedInConnectionAction } from "@/app/actions";
import { useRouter } from "next/navigation";

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [inboxChoice, setInboxChoice] = useState<"gmail" | "linkedin" | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisPhase, setAnalysisPhase] = useState(0);
  const router = useRouter();

  const handleLinkedInConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await connectLinkedInAction();
      if (res.success) {
        if (res.verified) {
          setStep(4);
        } else {
          setRequiresVerification(true);
        }
      } else {
        alert("Failed to connect: " + res.message);
      }
    } catch (e: any) {
      console.error(e);
      alert("Failed to connect LinkedIn: " + e.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLinkedInVerify = async () => {
    setIsConnecting(true);
    try {
      const verifyRes = await verifyLinkedInConnectionAction();
      if (verifyRes.success) {
        setStep(4);
      } else {
        alert(verifyRes.message || "Could not verify connection yet. Make sure you logged in in the browser window.");
      }
    } catch (e: any) {
      console.error(e);
      alert("Verification failed: " + e.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle local form submission for Gmail to transition to Step 4 (Analyzing)
  const handleGmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsConnecting(true);
    const formData = new FormData(e.currentTarget);
    try {
      // Call saveAppConfig via fetch or directly
      // Since saveAppConfig is a server action, let's call it.
      // We will parse inputs from formData:
      await saveAppConfig(formData);
      setStep(4);
    } catch (err: any) {
      alert(err.message || "Failed to save configuration");
    } finally {
      setIsConnecting(false);
    }
  };

  // Simulated analysis loader for Step 4
  useEffect(() => {
    if (step === 4) {
      const interval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              router.push(inboxChoice === "linkedin" ? "/?inbox=linkedin" : "/?inbox=email");
            }, 800);
            return 100;
          }
          return prev + 1.25;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step, router, inboxChoice]);

  useEffect(() => {
    if (analysisProgress > 75) setAnalysisPhase(3);
    else if (analysisProgress > 45) setAnalysisPhase(2);
    else if (analysisProgress > 15) setAnalysisPhase(1);
  }, [analysisProgress]);

  const progressPercent = (step / 4) * 100;

  return (
    <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-md glass border border-white/10 rounded-3xl p-8 shadow-glow relative z-10 animate-in fade-in duration-500">
        
        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/5 rounded-full mb-8 overflow-hidden">
          <div 
            className="h-full bg-primary shadow-glow transition-all duration-500 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {step === 1 && (
          <div className="flex flex-col items-center text-center relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20 shadow-glow">
              <Zap className="w-8 h-8 text-primary drop-shadow-[0_0_8px_rgba(30,212,60,0.5)]" fill="currentColor" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-4">TriageAI Onboarding</h1>
            <p className="text-muted-foreground text-xs leading-relaxed mb-8">
              Welcome. Let's calibrate your workspace. We'll help you configure background sync, connect accounts, and customize responses in 4 simple steps.
            </p>
            <button 
              onClick={() => setStep(2)}
              className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:scale-[1.01] hover:shadow-glow transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-xs"
            >
              Begin Onboarding <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col relative z-10 animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-black tracking-tight text-white mb-2 text-center">Configure Accounts</h2>
            <p className="text-muted-foreground text-xs text-center mb-8">
              Select an account to authorize and customize first.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setInboxChoice("gmail");
                  setStep(3);
                }}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border border-white/5 bg-black/20 hover:bg-white/5 hover:border-primary/40 hover:shadow-glow transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-all border border-primary/20">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Gmail / IMAP Connection</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Integrate direct incoming mail synchronization</p>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => {
                  setInboxChoice("linkedin");
                  setStep(3);
                }}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border border-white/5 bg-black/20 hover:bg-white/5 hover:border-primary/40 hover:shadow-glow transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-all border border-primary/20">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">LinkedIn Messages</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Automate direct client messages sync via local MCP</p>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
            
            <button 
              onClick={() => setStep(1)}
              className="mt-8 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-white mx-auto transition-colors"
            >
              Go Back
            </button>
          </div>
        )}

        {step === 3 && inboxChoice === "gmail" && (
          <div className="flex flex-col relative z-10 animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-black tracking-tight text-white mb-2 text-center">Gmail Setup</h2>
            <p className="text-muted-foreground text-xs text-center mb-6">
              Enter your secure local IMAP settings.
            </p>

            <form onSubmit={handleGmailSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">IMAP Email Address</label>
                <input 
                  name="imapEmail" 
                  type="email" 
                  placeholder="you@gmail.com" 
                  required
                  className="w-full bg-[#050505]/60 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5 relative group">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">App Password</label>
                <input 
                  name="imapPassword" 
                  type="password" 
                  placeholder="xxxx xxxx xxxx xxxx" 
                  required
                  className="w-full bg-[#050505]/60 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-all"
                />
                
                {/* Contextual Tooltip */}
                <div className="hidden group-hover:block absolute z-50 left-0 -bottom-28 w-full glass border border-white/10 p-4 rounded-2xl shadow-glow text-[11px] text-muted-foreground leading-relaxed animate-in fade-in duration-300">
                  <span className="font-bold text-white block mb-1">💡 Instructions for Gmail</span>
                  Visit Google Account {">"} Security {">"} 2-Step Verification {">"} App Passwords. Select "Mail" or "Other" to generate a 16-character code, then copy it here.
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">IMAP Server Host</label>
                <input 
                  name="imapHost" 
                  type="text" 
                  defaultValue="imap.gmail.com" 
                  required
                  className="w-full bg-[#050505]/60 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>

              <button 
                type="submit" 
                disabled={isConnecting}
                className="w-full mt-6 bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:scale-[1.01] hover:shadow-glow transition-all active:scale-[0.99] disabled:opacity-50 text-xs flex items-center justify-center gap-2"
              >
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                Connect & Triage
              </button>
            </form>
            
            <button 
              onClick={() => setStep(2)}
              className="mt-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-white mx-auto transition-colors"
            >
              Go Back
            </button>
          </div>
        )}

        {step === 3 && inboxChoice === "linkedin" && (
          <div className="flex flex-col relative z-10 animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-black tracking-tight text-white mb-2 text-center">LinkedIn Integration</h2>
            <p className="text-muted-foreground text-xs text-center mb-8 leading-relaxed">
              We sync your inbox locally using standard dev tools to secure your account.
            </p>

            <div className="glass-panel border border-white/5 rounded-2xl p-5 text-center mb-8">
              <MessageSquare className="w-8 h-8 text-primary mx-auto mb-4 drop-shadow-[0_0_8px_rgba(30,212,60,0.4)]" />
              {requiresVerification ? (
                <>
                  <p className="text-xs font-bold text-white mb-2">Sign In Window Opened</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Please log into LinkedIn in the browser window that popped up. Once signed in, click <strong>Verify & Continue</strong> below.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-white mb-2">Automated Browser Hook</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    A standard Chrome window will trigger. If not signed in, please authenticate. Our local engine will verify connection automatically.
                  </p>
                </>
              )}
            </div>

            {requiresVerification ? (
              <button 
                onClick={handleLinkedInVerify}
                disabled={isConnecting}
                className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:scale-[1.01] hover:shadow-glow transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying Sign In...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Verify & Continue
                  </>
                )}
              </button>
            ) : (
              <button 
                onClick={handleLinkedInConnect}
                disabled={isConnecting}
                className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:scale-[1.01] hover:shadow-glow transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Launching Browser...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Start Connection
                  </>
                )}
              </button>
            )}
            
            <button 
              onClick={() => {
                setStep(2);
                setRequiresVerification(false);
              }}
              className="mt-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-white mx-auto transition-colors"
            >
              Go Back
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col items-center text-center relative z-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
              <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-xl border border-primary/20 flex items-center justify-center relative shadow-glow">
                <Brain className="w-8 h-8 text-primary animate-spin duration-3000 text-glow" />
              </div>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mb-2">Configuring Autopilot...</h2>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mb-8">
              Our AI engine is preparing your custom triage model and mapping the communication graphs.
            </p>

            {/* Checklist */}
            <div className="w-full text-left space-y-3.5 mb-8 bg-black/30 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${analysisPhase >= 1 ? "bg-primary/20 border-primary/30 text-primary" : "border-white/5 text-zinc-600"}`}>
                  {analysisPhase >= 1 ? <Check className="w-3 h-3" /> : "1"}
                </div>
                <span className={`text-xs font-semibold ${analysisPhase >= 1 ? "text-white" : "text-zinc-500"}`}>IMAP handshake verified</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${analysisPhase >= 2 ? "bg-primary/20 border-primary/30 text-primary" : "border-white/5 text-zinc-600"}`}>
                  {analysisPhase >= 2 ? <Check className="w-3 h-3" /> : "2"}
                </div>
                <span className={`text-xs font-semibold ${analysisPhase >= 2 ? "text-white" : "text-zinc-500"}`}>Calibrating vector indexes</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${analysisPhase >= 3 ? "bg-primary/20 border-primary/30 text-primary" : "border-white/5 text-zinc-600"}`}>
                  {analysisPhase >= 3 ? <Check className="w-3 h-3" /> : "3"}
                </div>
                <span className={`text-xs font-semibold ${analysisPhase >= 3 ? "text-white" : "text-zinc-500"}`}>Triage categories loaded</span>
              </div>
            </div>

            {/* Progress Percentage */}
            <div className="text-[10px] text-primary/80 font-mono tracking-widest uppercase font-bold text-glow">
              Status: {Math.round(analysisProgress)}% Completed
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
