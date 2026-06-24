import { useMemo, useState } from "react";
import {
  Search,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import jsPDF from "jspdf";

import InvoiceDetailsModal from "./InvoiceDetailsModal";

export default function InvoiceTable() {
  const [search, setSearch] = useState("");

  const [selectedInvoice, setSelectedInvoice] =
    useState(null);

  const [openModal, setOpenModal] = useState(false);

  const [page, setPage] = useState(1);

  const perPage = 5;

  const invoices = [
    {
      id: "INV-1001",
      plan: "Enterprise School ERP",
      date: "12 Mar 2026",
      amount: 1499,
      status: "Paid",
      transactionId: "TXN984521",
    },
    {
      id: "INV-1002",
      plan: "Enterprise School ERP",
      date: "12 Mar 2025",
      amount: 1499,
      status: "Paid",
      transactionId: "TXN984522",
    },
    {
      id: "INV-1003",
      plan: "Enterprise School ERP",
      date: "12 Mar 2024",
      amount: 1499,
      status: "Paid",
      transactionId: "TXN984523",
    },
    {
      id: "INV-1004",
      plan: "Enterprise School ERP",
      date: "12 Mar 2023",
      amount: 1499,
      status: "Paid",
      transactionId: "TXN984524",
    },
    {
      id: "INV-1005",
      plan: "Enterprise School ERP",
      date: "12 Mar 2022",
      amount: 1499,
      status: "Paid",
      transactionId: "TXN984525",
    },
    {
      id: "INV-1006",
      plan: "Enterprise School ERP",
      date: "12 Mar 2021",
      amount: 1499,
      status: "Paid",
      transactionId: "TXN984526",
    },
  ];

  const filtered = useMemo(() => {
    return invoices.filter((item) =>
      item.id
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search]);

  const totalPages = Math.ceil(
    filtered.length / perPage
  );

  const paginated = filtered.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const openInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setOpenModal(true);
  };

  const downloadInvoice = (invoice) => {
    const pdf = new jsPDF();

    pdf.setFontSize(18);

    pdf.text("Invoice", 20, 20);

    pdf.setFontSize(12);

    pdf.text(
      `Invoice ID : ${invoice.id}`,
      20,
      40
    );

    pdf.text(
      `Plan : ${invoice.plan}`,
      20,
      50
    );

    pdf.text(
      `Date : ${invoice.date}`,
      20,
      60
    );

    pdf.text(
      `Amount : $${invoice.amount}`,
      20,
      70
    );

    pdf.text(
      `Status : ${invoice.status}`,
      20,
      80
    );

    pdf.text(
      `Transaction : ${invoice.transactionId}`,
      20,
      90
    );

    pdf.save(`${invoice.id}.pdf`);
  };

  return (
    <>
      <section className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold">
              Billing & Invoices
            </h2>

            <p className="text-sm text-slate-500">
              View invoice history
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search Invoice..."
              className="pl-10 pr-4 py-2 border rounded-xl"
            />
          </div>
        </div>

        <div className="bg-white border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-4 text-left">
                  Invoice ID
                </th>

                <th className="p-4 text-left">
                  Plan
                </th>

                <th className="p-4 text-left">
                  Date
                </th>

                <th className="p-4 text-left">
                  Amount
                </th>

                <th className="p-4 text-left">
                  Status
                </th>

                <th className="p-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-t"
                >
                  <td className="p-4">
                    {invoice.id}
                  </td>

                  <td className="p-4">
                    {invoice.plan}
                  </td>

                  <td className="p-4">
                    {invoice.date}
                  </td>

                  <td className="p-4">
                    ${invoice.amount}
                  </td>

                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                      {invoice.status}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          openInvoice(invoice)
                        }
                        className="p-2 hover:bg-slate-100 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          downloadInvoice(
                            invoice
                          )
                        }
                        className="p-2 hover:bg-slate-100 rounded-lg"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t p-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </span>

            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() =>
                  setPage(page - 1)
                }
                className="p-2 border rounded-lg disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                disabled={page === totalPages}
                onClick={() =>
                  setPage(page + 1)
                }
                className="p-2 border rounded-lg disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <InvoiceDetailsModal
        invoice={selectedInvoice}
        open={openModal}
        onClose={() => setOpenModal(false)}
        onDownload={downloadInvoice}
      />
    </>
  );
}