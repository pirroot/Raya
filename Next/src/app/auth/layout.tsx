import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className=" bg-background text-foreground  antialiased">
      <main className="relative z-10 flex my-12 items-center justify-center">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  );
}
