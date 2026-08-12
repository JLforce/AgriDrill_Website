import { Mail, MapPin, Phone, User } from "lucide-react";

type Profile = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
};

type Draft = {
  full_name: string;
  phone: string;
  location: string;
};

interface PersonalInformationProps {
  profile: Profile | null;
  draft: Draft;
  isEditing: boolean;
  onChange: (draft: Draft) => void;
}

export default function PersonalInformation({
  profile,
  draft,
  isEditing,
  onChange,
}: PersonalInformationProps) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          Personal Information
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Update your personal details used by the AgriDrill system.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Full Name */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
            <User className="h-4 w-4" />
            Full Name
          </label>

          {isEditing ? (
            <input
              type="text"
              value={draft.full_name}
              onChange={(e) =>
                onChange({ ...draft, full_name: e.target.value })
              }
              placeholder="Enter full name"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
            />
          ) : (
            <p className="rounded-xl border border-slate-800 bg-slate-800/60 px-4 py-3 text-white">
              {profile?.full_name || "Not provided"}
            </p>
          )}
        </div>

        {/* Email (always read-only) */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
            <Mail className="h-4 w-4" />
            Email Address
          </label>

          <p className="rounded-xl border border-slate-800 bg-slate-800/60 px-4 py-3 text-slate-400">
            {profile?.email || "Not provided"}
          </p>
        </div>

        {/* Phone */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
            <Phone className="h-4 w-4" />
            Phone Number
          </label>

          {isEditing ? (
            <input
              type="text"
              value={draft.phone}
              onChange={(e) =>
                onChange({ ...draft, phone: e.target.value })
              }
              placeholder="+63 9XX XXX XXXX"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
            />
          ) : (
            <p className="rounded-xl border border-slate-800 bg-slate-800/60 px-4 py-3 text-white">
              {profile?.phone || "Not provided"}
            </p>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
            <MapPin className="h-4 w-4" />
            Location
          </label>

          {isEditing ? (
            <input
              type="text"
              value={draft.location}
              onChange={(e) =>
                onChange({ ...draft, location: e.target.value })
              }
              placeholder="Enter location"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
            />
          ) : (
            <p className="rounded-xl border border-slate-800 bg-slate-800/60 px-4 py-3 text-white">
              {profile?.location || "Not provided"}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}