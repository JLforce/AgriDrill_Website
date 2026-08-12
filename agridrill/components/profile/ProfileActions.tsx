import { Pencil, RotateCcw, Save } from "lucide-react";

interface ProfileActionsProps {
  isEditing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export default function ProfileActions({
  isEditing,
  saving,
  onEdit,
  onCancel,
  onSave,
}: ProfileActionsProps) {
  if (!isEditing) {
    return (
      <section className="flex justify-end rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
        >
          <Pencil className="h-5 w-5" />
          Edit Profile
        </button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-6 py-3 font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-700 hover:text-white disabled:opacity-50"
      >
        <RotateCcw className="h-5 w-5" />
        Cancel
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        <Save className="h-5 w-5" />
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </section>
  );
}