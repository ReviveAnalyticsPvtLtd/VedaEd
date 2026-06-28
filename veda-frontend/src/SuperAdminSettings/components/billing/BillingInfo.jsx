import { useState } from "react";
import { User, MapPin, Pencil, X } from "lucide-react";

export default function BillingInfo() {
  const [open, setOpen] = useState(false);

  const [billing, setBilling] = useState({
    name: "Super Admin",
    address:
      "VedaSchool Campus, Block A, Rajajinagar",
    city:
      "Bengaluru, Karnataka 560010, India",
  });

  const [form, setForm] = useState(billing);

  const saveChanges = () => {
    setBilling(form);
    setOpen(false);
  };

  return (
    <>
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Billing Information
            </h2>

            <p className="text-sm text-slate-500">
              Manage billing details
            </p>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 border rounded-xl flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            Update
          </button>
        </div>

        <div className="border rounded-2xl p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <User className="w-5 h-5 mt-1" />

              <div>
                <p className="text-xs text-slate-500">
                  Billing Name
                </p>

                <h4 className="font-bold">
                  {billing.name}
                </h4>
              </div>
            </div>

            <div className="flex gap-4">
              <MapPin className="w-5 h-5 mt-1" />

              <div>
                <p className="text-xs text-slate-500">
                  Address
                </p>

                <h4 className="font-bold">
                  {billing.address}
                </h4>

                <p className="text-sm text-slate-500">
                  {billing.city}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl">
            <div className="p-6 border-b flex justify-between">
              <h3 className="font-bold text-xl">
                Update Billing Info
              </h3>

              <button
                onClick={() => setOpen(false)}
              >
                <X />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <input
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-4 py-3"
                placeholder="Name"
              />

              <input
                value={form.address}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-4 py-3"
                placeholder="Address"
              />

              <input
                value={form.city}
                onChange={(e) =>
                  setForm({
                    ...form,
                    city: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-4 py-3"
                placeholder="City"
              />
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="border px-5 py-2 rounded-xl"
              >
                Cancel
              </button>

              <button
                onClick={saveChanges}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}