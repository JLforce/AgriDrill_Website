export default function ProfileHeader() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
      <div className="flex flex-col gap-2">

        <h1 className="text-3xl font-bold tracking-tight text-white">
          Profile
        </h1>

        <p className="text-slate-400">
          Manage your AgriDrill operator account information,
          account security, and system details.
        </p>

      </div>
    </section>
  );
}