import {
  Calendar,
  Clock,
  Shield,
  Server,
  Globe,
} from "lucide-react";

interface SystemInformationProps {
  accountCreated: string | null;
  lastLogin: string | null;
}

export default function SystemInformation({
  accountCreated,
  lastLogin,
}: SystemInformationProps) {
  const environment =
    process.env.NODE_ENV === "production" ? "Production" : "Development";

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          System Information
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Read-only information about your AgriDrill account.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <InfoItem
          icon={<Shield className="h-5 w-5 text-emerald-400" />}
          title="Role"
          value="Administrator"
        />

        <InfoItem
          icon={<Calendar className="h-5 w-5 text-emerald-400" />}
          title="Account Created"
          value={accountCreated || "Unknown"}
        />

        <InfoItem
          icon={<Clock className="h-5 w-5 text-emerald-400" />}
          title="Last Login"
          value={lastLogin || "Unknown"}
        />

        <InfoItem
          icon={<Server className="h-5 w-5 text-emerald-400" />}
          title="Website Version"
          value="v1.0"
        />

        <InfoItem
          icon={<Globe className="h-5 w-5 text-emerald-400" />}
          title="Environment"
          value={environment}
        />
      </div>
    </section>
  );
}

function InfoItem({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-sm text-slate-400">{title}</span>
      </div>

      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}