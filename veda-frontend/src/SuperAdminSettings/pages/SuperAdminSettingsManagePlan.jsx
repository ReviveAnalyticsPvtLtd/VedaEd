import {
  Users,
  UserCheck,
  Building2,
  HardDrive,
  MessageSquare,
  Calendar,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

export default function SuperAdminSettingsManagePlan() {
  const usageCards = [
    {
      title: "Active Students",
      value: "1,240",
      limit: "/ 2,000 limit",
      percent: 62,
      label: "Students",
      icon: Users,
    },
    {
      title: "Active Staff & Teachers",
      value: "86",
      limit: "/ 150 limit",
      percent: 57,
      label: "Staff",
      icon: UserCheck,
    },
    {
      title: "Branches Allowed",
      value: "1",
      limit: "/ 3 branches",
      percent: 33,
      label: "Campuses",
      icon: Building2,
    },
    {
      title: "Storage Space Used",
      value: "42 GB",
      limit: "/ 100 GB limit",
      percent: 42,
      label: "Cloud Disk",
      icon: HardDrive,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Plan & Usage
        </h2>
        <p className="text-slate-500 mt-1 text-sm">
          Monitor your school ERP subscription quotas and limits.
        </p>
      </div>

      {/* Plan Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between gap-8">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Subscription
            </span>

            <div>
              <h3 className="text-3xl font-extrabold">
                Enterprise School ERP
              </h3>

              <p className="text-indigo-200 text-sm mt-2">
                Perfect for multi-branch school administration &
                scaling operations.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="text-indigo-400" />
                <span>
                  Renewal / Validity:
                  <strong className="ml-1 text-white">
                    31 Mar 2027
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck size={16} className="text-indigo-400" />
                <span>
                  Billing Cycle:
                  <strong className="ml-1 text-white">
                    Yearly
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="lg:text-right">
            <p className="text-xs uppercase tracking-widest text-indigo-300 font-bold">
              Enterprise Pricing
            </p>

            <p className="text-5xl font-extrabold mt-2">
              $1,499
              <span className="text-sm font-normal text-indigo-300">
                /year
              </span>
            </p>

            <p className="text-xs text-indigo-300 mt-2">
              Billed annually on 31 Mar 2027
            </p>
          </div>
        </div>
      </div>

      {/* Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {usageCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <div
              key={index}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                  <Icon size={20} />
                </div>

                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  {card.label}
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </p>

              <div className="flex items-end gap-2 mt-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {card.value}
                </span>

                <span className="text-sm text-slate-400">
                  {card.limit}
                </span>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                  <span>Quota Used</span>
                  <span>{card.percent}%</span>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${card.percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* SMS Credits */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <MessageSquare size={20} />
            </div>

            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Messaging
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            SMS Credits Remaining
          </p>

          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-900">
              8,450
            </span>

            <span className="text-sm text-slate-400">
              SMS Credits
            </span>
          </div>

          <div className="flex gap-3 mt-6">
            <button className="flex-1 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-xl text-xs font-semibold">
              Buy Credits
            </button>

            <button className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold">
              Usage Log
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Alert */}
      <div className="flex gap-4 p-5 bg-indigo-50 rounded-2xl border border-indigo-200">
        <TrendingUp className="w-5 h-5 text-indigo-600 shrink-0 mt-1" />

        <div>
          <h4 className="font-bold text-indigo-900">
            Need to expand your boundaries?
          </h4>

          <p className="text-sm text-indigo-900/80 mt-1">
            To scale your student/staff limit, request more
            branches, or add additional modules, please visit
            the Setup Center or contact technical support.
          </p>
        </div>
      </div>
    </div>
  );
}