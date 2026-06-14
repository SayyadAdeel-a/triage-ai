import { prisma } from "@/lib/prisma";
import { saveAppConfig } from "./actions";

export default async function SettingsPage() {
  const config = await prisma.appConfig.findUnique({
    where: { id: "default" },
  });

  return (
    <div className="max-w-2xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Connect Inbox</h1>
      <p className="text-muted-foreground mb-8">
        Since this is a local desktop application, you need to connect your email account directly to your local instance. Your credentials never leave this machine.
      </p>

      <form action={saveAppConfig} className="space-y-6 bg-card border rounded-xl p-6 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email Address</label>
          <input 
            type="email" 
            name="imapEmail" 
            defaultValue={config?.imapEmail || ""}
            placeholder="you@gmail.com"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
            required 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">App Password</label>
          <input 
            type="password" 
            name="imapPassword" 
            defaultValue={config?.imapPassword || ""}
            placeholder="16-character App Password"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
            required 
          />
          <p className="text-xs text-muted-foreground">
            For security, do not use your normal account password. Generate an "App Password" in your Google or Microsoft security settings.
          </p>
        </div>

        <button 
          type="submit" 
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
        >
          Save Credentials
        </button>
      </form>
    </div>
  );
}
