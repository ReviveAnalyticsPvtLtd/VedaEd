import React from "react";
import {
  FiCheck,
  FiExternalLink,
  FiRefreshCw,
  FiAlertCircle,
  FiPlus,
  FiFolder,
  FiInfo,
} from "react-icons/fi";

export default function MarketplaceGrid({
  providers = [],
  loading = false,
  onSelectApp,
  onConnect,
  onOpenExplorer,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div
            key={n}
            className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-12 bg-gray-100 rounded mb-4"></div>
            <div className="h-9 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
        <FiFolder className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <h3 className="text-base font-semibold text-gray-900">No Applications Found</h3>
        <p className="text-sm text-gray-500 mt-1">
          Try adjusting your search criteria or category filter.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
      {providers.map((provider) => {
        const isConnected = provider.connection?.status === "CONNECTED";
        const isConnecting = provider.connection?.status === "CONNECTING";
        const isReauth = provider.connection?.status === "REAUTH_REQUIRED";
        const isError = provider.connection?.status === "ERROR";

        return (
          <div
            key={provider.slug}
            className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 p-2 flex items-center justify-center shrink-0">
                    {provider.iconUrl ? (
                      <img
                        src={provider.iconUrl}
                        alt={provider.name}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: provider.brandColor || "#4F46E5" }}
                      >
                        {provider.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
                      {provider.name}
                    </h3>
                    <span className="inline-block text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-0.5">
                      {provider.category}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                {isConnected && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                    <FiCheck className="w-3.5 h-3.5" /> Connected
                  </span>
                )}
                {isReauth && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                    <FiRefreshCw className="w-3.5 h-3.5" /> Reauth
                  </span>
                )}
                {isError && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-full">
                    <FiAlertCircle className="w-3.5 h-3.5" /> Error
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                {provider.shortDescription || provider.description}
              </p>

              {/* Capabilities & Badges */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {provider.capabilities?.slice(0, 3).map((cap) => (
                  <span
                    key={cap}
                    className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded"
                  >
                    {cap.replace(/_/g, " ")}
                  </span>
                ))}
                {provider.capabilities?.length > 3 && (
                  <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                    +{provider.capabilities.length - 3}
                  </span>
                )}
              </div>

              {/* Connected User/Email if connected */}
              {isConnected && provider.connection?.accountEmail && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mb-4 flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="truncate">{provider.connection.accountEmail}</span>
                </div>
              )}
            </div>

            {/* Card Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onSelectApp(provider)}
                className="text-xs font-semibold text-gray-700 hover:text-indigo-600 flex items-center gap-1 transition"
              >
                <FiInfo className="w-3.5 h-3.5" /> Details
              </button>

              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenExplorer(provider.connection)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                    >
                      <FiFolder className="w-3.5 h-3.5" /> Open
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectApp(provider)}
                      className="px-2.5 py-1.5 text-gray-600 hover:text-gray-800 bg-white border border-gray-300 text-xs font-medium rounded-lg transition"
                    >
                      Settings
                    </button>
                  </>
                ) : isReauth ? (
                  <button
                    type="button"
                    onClick={() => onConnect(provider)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                  >
                    <FiRefreshCw className="w-3.5 h-3.5" /> Reconnect
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onConnect(provider)}
                    disabled={isConnecting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-900 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                  >
                    <FiPlus className="w-3.5 h-3.5" /> Connect
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
