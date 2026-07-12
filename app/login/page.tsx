export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        <LoginForm />
      </div>
    </main>
  );
}
