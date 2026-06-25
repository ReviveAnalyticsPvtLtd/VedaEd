import {
  MessageCircle,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Send,
} from "lucide-react";

export default function TeacherProfileSettingsContactSupport() {
  const tickets = [
    {
      id: "#TK-1001",
      subject: "Unable to access reports",
      priority: "High",
      status: "Open",
      created: "18 Jun 2026",
    },
    {
      id: "#TK-1002",
      subject: "Fee module issue",
      priority: "Medium",
      status: "In Progress",
      created: "17 Jun 2026",
    },
    {
      id: "#TK-1003",
      subject: "Account permission request",
      priority: "Low",
      status: "Resolved",
      created: "15 Jun 2026",
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Contact Support
        </h1>

        <p className="text-slate-500 mt-1">
          Get help from our support team.
        </p>
      </div>

      {/* QUICK ACTIONS */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          {
            title: "Live Chat",
            icon: MessageCircle,
            desc: "Avg. response 2 min",
          },
          {
            title: "Email Support",
            icon: Mail,
            desc: "Response within 24 hrs",
          },
          {
            title: "Raise Ticket",
            icon: AlertCircle,
            desc: "Track support requests",
          },
          {
            title: "Schedule Call",
            icon: Calendar,
            desc: "Book support session",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
          >
            <item.icon className="w-8 h-8 text-blue-600 mb-4" />

            <h3 className="font-semibold text-slate-900">
              {item.title}
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* FORM + INFO */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM */}

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">
            Raise Support Ticket
          </h2>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Subject"
              className="w-full border border-slate-300 rounded-xl p-3"
            />

            <div className="grid grid-cols-2 gap-4">
              <select className="border border-slate-300 rounded-xl p-3">
                <option>Category</option>
                <option>Technical</option>
                <option>Billing</option>
                <option>Academic</option>
              </select>

              <select className="border border-slate-300 rounded-xl p-3">
                <option>Priority</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>

            <textarea
              rows={6}
              placeholder="Describe your issue..."
              className="w-full border border-slate-300 rounded-xl p-3"
            />

            <input
              type="file"
              className="w-full border border-slate-300 rounded-xl p-3"
            />

            <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-blue-700">
              <Send size={18} />
              Submit Ticket
            </button>
          </div>
        </div>

        {/* SUPPORT INFO */}

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">
            Support Information
          </h2>

          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase text-slate-400">
                Support Email
              </p>

              <p className="font-medium">
                support@vedaschool.com
              </p>
            </div>

            <div>
              <p className="text-xs uppercase text-slate-400">
                Phone
              </p>

              <p className="font-medium">
                +91 XXXXX XXXXX
              </p>
            </div>

            <div>
              <p className="text-xs uppercase text-slate-400">
                Working Hours
              </p>

              <p className="font-medium">
                Mon - Sat
              </p>

              <p className="text-sm text-slate-500">
                9:00 AM - 6:00 PM
              </p>
            </div>

            <div>
              <p className="text-xs uppercase text-slate-400 mb-2">
                Response SLA
              </p>

              <div className="space-y-2 text-sm">
                <div>High Priority - 2 Hours</div>
                <div>Medium Priority - 8 Hours</div>
                <div>Low Priority - 24 Hours</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT TICKETS */}

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-5">
          Recent Support Tickets
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">
                  Ticket ID
                </th>
                <th className="text-left py-3">
                  Subject
                </th>
                <th className="text-left py-3">
                  Priority
                </th>
                <th className="text-left py-3">
                  Status
                </th>
                <th className="text-left py-3">
                  Created
                </th>
              </tr>
            </thead>

            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b last:border-0"
                >
                  <td className="py-4">
                    {ticket.id}
                  </td>

                  <td>{ticket.subject}</td>

                  <td>{ticket.priority}</td>

                  <td>{ticket.status}</td>

                  <td>{ticket.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EMERGENCY SUPPORT */}

      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <Phone className="w-8 h-8 text-red-600" />

          <div>
            <h3 className="font-bold text-red-700 text-lg">
              Need Immediate Assistance?
            </h3>

            <p className="text-red-600 mt-2">
              For critical production issues affecting
              school operations contact emergency support.
            </p>

            <div className="mt-4 space-y-1 font-medium">
              <p>emergency@vedaschool.com</p>
              <p>+91 XXXXX XXXXX</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}