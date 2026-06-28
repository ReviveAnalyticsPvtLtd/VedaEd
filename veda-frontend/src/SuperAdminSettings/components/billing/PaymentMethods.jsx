import { useState } from "react";
import {
  CreditCard,
  Smartphone,
  Plus,
  Trash2,
  Pencil,
  CheckCircle,
  X,
} from "lucide-react";

export default function PaymentMethods() {
  const [methods, setMethods] = useState([
    {
      id: 1,
      type: "Visa",
      number: "**** 4242",
      expiry: "12/28",
      default: true,
    },
    {
      id: 2,
      type: "Mastercard",
      number: "**** 8812",
      expiry: "08/27",
      default: false,
    },
    {
      id: 3,
      type: "UPI",
      number: "vedaschool@okaxis",
      expiry: "",
      default: false,
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    type: "Visa",
    number: "",
    expiry: "",
  });

  const openAddModal = () => {
    setEditingId(null);

    setForm({
      type: "Visa",
      number: "",
      expiry: "",
    });

    setShowModal(true);
  };

  const openEditModal = (method) => {
    setEditingId(method.id);

    setForm({
      type: method.type,
      number: method.number,
      expiry: method.expiry,
    });

    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.number.trim()) return;

    if (editingId) {
      setMethods((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...form,
              }
            : item
        )
      );
    } else {
      setMethods((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...form,
          default: false,
        },
      ]);
    }

    setShowModal(false);
  };

  const handleDelete = (id) => {
    setMethods((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSetDefault = (id) => {
    setMethods((prev) =>
      prev.map((item) => ({
        ...item,
        default: item.id === id,
      }))
    );
  };

  const getIcon = (type) => {
    if (type === "UPI") {
      return <Smartphone className="w-5 h-5" />;
    }

    return <CreditCard className="w-5 h-5" />;
  };

  return (
    <>
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Payment Methods
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Manage your saved cards and payment accounts.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods.map((method) => (
            <div
              key={method.id}
              className={`rounded-2xl border p-5 flex items-center justify-between transition-all
              
              ${
                method.default
                  ? "border-blue-500 ring-4 ring-blue-100"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center
                  
                  ${
                    method.default
                      ? "bg-blue-50 text-blue-600"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {getIcon(method.type)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900">
                      {method.type} {method.number}
                    </h4>

                    {method.default && (
                      <span className="px-2 py-1 text-[10px] rounded-full bg-blue-50 text-blue-600 font-bold uppercase">
                        Default
                      </span>
                    )}
                  </div>

                  {method.expiry && (
                    <p className="text-xs text-slate-500 mt-1">
                      Expires {method.expiry}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!method.default && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    className="text-xs px-3 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Set Default
                  </button>
                )}

                <button
                  onClick={() => openEditModal(method)}
                  className="p-2 rounded-lg hover:bg-yellow-50 text-yellow-600"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(method.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-bold text-xl">
                {editingId
                  ? "Edit Payment Method"
                  : "Add Payment Method"}
              </h3>

              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Type
                </label>

                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl px-4 py-3"
                >
                  <option>Visa</option>
                  <option>Mastercard</option>
                  <option>UPI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Card Number / UPI ID
                </label>

                <input
                  type="text"
                  value={form.number}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      number: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl px-4 py-3"
                  placeholder="Enter card number or UPI"
                />
              </div>

              {form.type !== "UPI" && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Expiry
                  </label>

                  <input
                    type="text"
                    value={form.expiry}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        expiry: e.target.value,
                      })
                    }
                    className="w-full border rounded-xl px-4 py-3"
                    placeholder="MM/YY"
                  />
                </div>
              )}
            </div>

            <div className="border-t p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 rounded-xl border"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              >
                <CheckCircle className="w-4 h-4" />

                {editingId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}