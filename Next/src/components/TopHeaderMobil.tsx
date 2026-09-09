import { Sparkles, User } from "lucide-react";
import Link from "next/link";

export default function TopHeaderMobile() {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
      <Link href="/" className="flex items-center gap-2 group shrink-0">
        <span className="text-2xl font-black bg-linear-to-l from-primary to-primary-hover bg-clip-text text-transparent">
          رایا
        </span>
        <Sparkles className="h-5 w-5 text-primary/50 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
      </Link>

      <Link
        href="/panel"
        className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-all hover:bg-primary/20 active:scale-95"
      >
        <User className="h-4 w-4" />
        پنل کاربری
      </Link>
    </div>
  );
}