import { X, Download } from "lucide-react";

export default function InvoiceDetailsModal({
  invoice,
  open,
  onClose,
  onDownload,
}) {
  if (!open || !invoice) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">
            Invoice Details
          </h2>

          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <Info
              label="Invoice ID"
              value={invoice.id}
            />

            <Info
              label="Plan"
              value={invoice.plan}
            />

            <Info
              label="Date"
              value={invoice.date}
            />

            <Info
              label="Amount"
              value={`$${invoice.amount}`}
            />

            <Info
              label="Status"
              value={invoice.status}
            />

            <Info
              label="Transaction ID"
              value={invoice.transactionId}
            />
          </div>

          <div className="border rounded-xl p-4 bg-slate-50">
            <h4 className="font-semibold mb-3">
              Billing Breakdown
            </h4>

            <div className="flex justify-between text-sm">
              <span>Subscription</span>
              <span>${invoice.amount}</span>
            </div>

            <div className="flex justify-between text-sm mt-2">
              <span>GST</span>
              <span>$50</span>
            </div>

            <div className="flex justify-between font-bold mt-4">
              <span>Total</span>
              <span>${invoice.amount + 50}</span>
            </div>
          </div>
        </div>

        <div className="border-t p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 border rounded-xl"
          >
            Close
          </button>

          <button
            onClick={() => onDownload(invoice)}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="border rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-1">
        {label}
      </p>

      <p className="font-semibold">
        {value}
      </p>
    </div>
  );
}