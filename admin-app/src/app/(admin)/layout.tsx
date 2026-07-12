import { AdminShell } from "@/components/admin/AdminShell";
import { AuthGate } from "@/components/admin/AuthGate";
import { BaoAssistant } from "@/components/admin/BaoAssistant";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AdminShell>{children}</AdminShell>
      <BaoAssistant />
    </AuthGate>
  );
}
