import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap } from 'lucide-react'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Background Glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 glass p-8 rounded-3xl border border-white/10 shadow-glow relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 shadow-glow">
            <Zap className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(30,212,60,0.5)]" fill="currentColor" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-white">
            TriageAI
          </h2>
          <p className="mt-2 text-center text-xs text-muted-foreground tracking-wide font-medium">
            AI-powered inbox copilot for high-growth leaders.
          </p>
        </div>
        
        {params?.error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3.5 rounded-xl text-xs text-center font-semibold">
            {params.error}
          </div>
        )}

        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full bg-[#050505]/60 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full bg-[#050505]/60 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button 
              formAction={login} 
              type="submit" 
              className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl hover:scale-[1.01] hover:shadow-glow transition-all active:scale-[0.99] text-xs cursor-pointer"
            >
              Sign In
            </Button>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-black/80 px-2.5 text-muted-foreground text-[10px] font-bold tracking-widest uppercase">Or</span>
              </div>
            </div>
            <Button 
              formAction={signup} 
              type="submit" 
              variant="outline" 
              className="w-full bg-transparent border-white/10 hover:bg-white/5 text-white font-semibold py-2.5 rounded-xl text-xs cursor-pointer transition-all"
            >
              Create Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
