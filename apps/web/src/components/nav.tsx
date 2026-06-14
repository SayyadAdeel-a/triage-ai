import Link from "next/link";
import { logout } from "@/app/login/actions";

export function Nav() {
  return (
    <nav className="w-full flex justify-between items-center py-4 mb-4 border-b px-8">
      <div className="flex gap-6">
        <Link href="/" className="text-gray-600 hover:text-black font-medium transition-colors">
          Inbox
        </Link>
        <Link href="/knowledge" className="text-gray-600 hover:text-black font-medium transition-colors">
          Knowledge Base
        </Link>
      </div>
      <div>
        <form action={logout}>
          <button type="submit" className="text-sm text-gray-500 hover:text-black transition-colors">
            Sign Out
          </button>
        </form>
      </div>
    </nav>
  );
}
