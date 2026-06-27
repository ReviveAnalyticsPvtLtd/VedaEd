
import {
  Search,
  BookOpen,
  MessageCircle,
  FileText,
  Video,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";

export default function ParentProfileSettingsHelpCenter() {
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      question: "How do I change my billing cycle?",
      answer:
        "Navigate to Billing Settings and select Monthly or Annual billing plan.",
    },
    {
      question: "Can I add more team members?",
      answer:
        "Yes. Upgrade your plan or purchase additional user seats from Plan & Usage.",
    },
    {
      question: "How can I export system data?",
      answer:
        "Go to Account Control → Data Export and download reports in CSV or Excel format.",
    },
    {
      question: "How do I contact support?",
      answer:
        "Use the Contact Support section below or raise a support ticket.",
    },
  ];

  return (
    <div className="space-y-8">
      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Help Center
        </h1>

        <p className="text-slate-500 mt-2">
          Find guides, tutorials and support resources.
        </p>
      </div>

      {/* SEARCH */}

      <div className="relative">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          placeholder="Search help articles..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* QUICK HELP */}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            icon: BookOpen,
            title: "Documentation",
            desc: "Guides & setup instructions",
          },
          {
            icon: Video,
            title: "Video Tutorials",
            desc: "Watch walkthrough videos",
          },
          {
            icon: FileText,
            title: "Knowledge Base",
            desc: "Common issues & fixes",
          },
          {
            icon: MessageCircle,
            title: "Live Support",
            desc: "Chat with our team",
          },
        ].map((item, i) => {
          const Icon = item.icon;

          return (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-500 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <Icon
                  size={22}
                  className="text-indigo-600"
                />
              </div>

              <h3 className="font-semibold text-slate-900">
                {item.title}
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* POPULAR ARTICLES */}

      <div className="bg-white border border-slate-200 rounded-3xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">
          Popular Articles
        </h2>

        <div className="space-y-3">
          {[
            "Getting Started with Veda ERP",
            "Managing Schools & Campuses",
            "Creating User Roles",
            "Subscription & Billing Guide",
            "Security Best Practices",
          ].map((article, index) => (
            <button
              key={index}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all text-left"
            >
              <span className="font-medium text-slate-700">
                {article}
              </span>

              <ArrowRight
                size={18}
                className="text-slate-400"
              />
            </button>
          ))}
        </div>
      </div>

      {/* FAQ */}

      <div className="bg-white border border-slate-200 rounded-3xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-slate-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() =>
                  setOpenFaq(
                    openFaq === index ? -1 : index
                  )
                }
                className="w-full flex items-center justify-between p-4 bg-white"
              >
                <span className="font-medium text-slate-800">
                  {faq.question}
                </span>

                <ChevronDown
                  size={18}
                  className={`transition-transform ${
                    openFaq === index
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              {openFaq === index && (
                <div className="px-4 pb-4 text-sm text-slate-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SUPPORT CTA */}

      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 text-white">
        <h2 className="text-2xl font-bold">
          Still need help?
        </h2>

        <p className="mt-2 text-indigo-100">
          Our support team is available 24/7 to
          assist you.
        </p>

        <button className="mt-5 px-5 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-slate-100 transition-all">
          Contact Support
        </button>
      </div>
    </div>
  );
}