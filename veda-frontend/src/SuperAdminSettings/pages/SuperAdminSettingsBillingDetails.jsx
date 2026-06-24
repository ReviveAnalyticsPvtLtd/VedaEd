import BillingOverview from "../components/billing/BillingOverview";
import BillingInfo from "../components/billing/BillingInfo";
import PaymentMethods from "../components/billing/PaymentMethods";
import InvoiceTable from "../components/billing/InvoiceTable";

export default function SuperAdminSettingsBillingDetails() {
  return (
    <div className="space-y-4">
      
      {/* Subscription Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
        <BillingOverview />
      </div>

      {/* Billing Information */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
        <BillingInfo />
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
        <PaymentMethods />
      </div>

      {/* Invoice History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
        <InvoiceTable />
      </div>

    </div>
  );
}