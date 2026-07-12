import { PageHeader } from "@/components/ui/PageHeader";

export default function SettingsPage() {
  return (
    <section>
      <PageHeader title="Settings" eyebrow="Deployment and security posture" />
      <div className="panel prose-panel">
        <h2>Security model</h2>
        <p>Admin access follows the existing production rule: a Firebase Auth user must either have the custom claim admin=true or have a lowercased email document in the Firestore admins collection.</p>
        <h2>API routing</h2>
        <p>Privileged SMS, fraud-review, and bootstrap actions are sent to /api/admin/* with a Firebase ID token. Firebase Hosting rewrites those calls to the existing us-central1 api Cloud Function.</p>
        <h2>Hosting</h2>
        <p>This app is built as a static Next export for the luban-admin Firebase Hosting site and is ready for an admin.lubanrestaurant.com custom domain.</p>
      </div>
    </section>
  );
}
