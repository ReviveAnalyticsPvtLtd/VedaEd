import { Building2, Calendar } from "lucide-react";

export default function BillingOverview() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Subscription Summary
        </h2>

        <p className="text-slate-500 text-sm mt-1">
          Overview of your current subscription.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="border rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Building2 />
          </div>

          <div>
            <p className="text-xs text-slate-500 uppercase">
              Current Plan
            </p>

            <h3 className="font-bold text-lg">
              Enterprise School ERP
            </h3>
          </div>
        </div>

        <div className="border rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
            <Calendar />
          </div>

          <div>
            <p className="text-xs text-slate-500 uppercase">
              Renewal Date
            </p>

            <h3 className="font-bold text-lg">
              31 March 2027
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
}