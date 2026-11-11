import React, { useState, useEffect, useCallback } from "react";
import {
  FiGrid,
  FiLink,
  FiFileText,
  FiShield,
  FiSearch,
  FiRefreshCw,
  FiLayers,
} from "react-icons/fi";
import MarketplaceGrid from "./components/MarketplaceGrid";
import ConnectedAppsList from "./components/ConnectedAppsList";
import ImportedResourcesView from "./components/ImportedResourcesView";
import AdminAuditView from "./components/AdminAuditView";
import AppDetailsModal from "./components/AppDetailsModal";
import ResourceExplorerModal from "./components/ResourceExplorerModal";
import integrationAPI from "../services/integrationAPI";
import Swal from "sweetalert2";

export default function IntegrationsHub() {
  const [activeTab, setActiveTab] = useState("marketplace"); // 'marketplace' | 'connected' | 'resources' | 'admin'
  const [providers, setProviders] = useState([]);
  const [connections, setConnections] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modals state
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [explorerConnection, setExplorerConnection] = useState(null);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();
  const userRole = localStorage.getItem("role") || currentUser?.role || "admin";
  const isAdmin = userRole === "admin" || userRole === "superadmin";

  const categories = [
    "All",
    "Storage & Documents",
    "Creative & Design",
    "Productivity & Notes",
    "Communication & Meetings",
    "Calendar & Scheduling",
  ];

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [marketRes, connRes, resRes] = await Promise.allSettled([
        integrationAPI.getMarketplace(selectedCategory, searchQuery),
        integrationAPI.getConnections(),
        integrationAPI.getImportedResources(),
      ]);

      if (marketRes.status === "fulfilled") {
        setProviders(marketRes.value?.data?.data || []);
      } else {
        console.warn("Marketplace fetch warning:", marketRes.reason);
      }

      if (connRes.status === "fulfilled") {
        setConnections(connRes.value?.data?.data || []);
      }

      if (resRes.status === "fulfilled") {
        setResources(resRes.value?.data?.data || []);
      }
    } catch (err) {
      console.error("Failed to load integrations data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for OAuth postMessage events from authorization popup window
  useEffect(() => {
    const handleOAuthMessage = (event) => {
      if (event.data?.type === "VEDA_OAUTH_SUCCESS") {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Account connected successfully!",
          showConfirmButton: false,
          timer: 3000,
        });
        loadData();
      } else if (event.data?.type === "VEDA_OAUTH_FAILURE") {
        Swal.fire({
          icon: "error",
          title: "Connection Failed",
          text: event.data.error || "OAuth authorization failed.",
          confirmButtonColor: "#4F46E5",
        });
        loadData();
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [loadData]);

  const handleConnect = async (provider) => {
    try {
      const res = await integrationAPI.initiateOAuth(provider.slug, {
        connectionLevel: provider.connectionLevel === "organization" ? "organization" : "user",
        returnUrl: window.location.href,
      });

      const { authorizationUrl } = res.data.data;
      if (!authorizationUrl) {
        throw new Error("No authorization URL returned by server");
      }

      // Open OAuth popup window with standard dimensions
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2.5;

      const popup = window.open(
        authorizationUrl,
        `veda_oauth_${provider.slug}`,
        `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
      );

      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        // Fallback if popup blocked: redirect
        window.location.href = authorizationUrl;
      }
    } catch (err) {
      console.error("Connect error:", err);
      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: err.response?.data?.message || err.message,
        confirmButtonColor: "#4F46E5",
      });
    }
  };

  const handleDisconnect = async (connectionId, providerName) => {
    const confirm = await Swal.fire({
      title: `Disconnect ${providerName || "Integration"}?`,
      text: "You can reconnect at any time. Existing imported links inside Veda School will remain intact.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, disconnect",
    });

    if (confirm.isConfirmed) {
      try {
        await integrationAPI.disconnectConnection(connectionId);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Disconnected successfully",
          showConfirmButton: false,
          timer: 2500,
        });
        loadData();
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || err.message,
        });
      }
    }
  };

  const handleRefreshSync = async (connectionId) => {
    try {
      await integrationAPI.refreshToken(connectionId);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Synchronized & token refreshed",
        showConfirmButton: false,
        timer: 2000,
      });
      loadData();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Sync Failed",
        text: err.response?.data?.message || err.message,
      });
    }
  };

  const handleDeleteResource = async (resourceId, resourceName) => {
    const confirm = await Swal.fire({
      title: `Remove "${resourceName}"?`,
      text: "This removes the resource link from Veda School.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#DC2626",
      confirmButtonText: "Remove",
    });

    if (confirm.isConfirmed) {
      try {
        await integrationAPI.deleteImportedResource(resourceId);
        loadData();
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || err.message,
        });
      }
    }
  };

  const handleOpenExplorer = (conn) => {
    setExplorerConnection(conn);
    setIsExplorerOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 w-full max-w-full min-w-0 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FiLayers className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">
              Integrations & App Marketplace
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 ml-10">
            Connect third-party SaaS services to bring documents, designs, and workflows into Veda School.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            title="Reload Data"
            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <FiRefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("marketplace")}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === "marketplace"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <FiGrid className="w-4 h-4" /> App Marketplace
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {providers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("connected")}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === "connected"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <FiLink className="w-4 h-4" /> Connected Apps
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
              {connections.filter((c) => c.status === "CONNECTED").length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("resources")}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === "resources"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <FiFileText className="w-4 h-4" /> Imported Resources
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
              {resources.length}
            </span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
                activeTab === "admin"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <FiShield className="w-4 h-4" /> Admin & Audit
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: App Marketplace Content */}
      {activeTab === "marketplace" && (
        <div className="space-y-6">
          {/* Search & Category Pills */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80 shrink-0">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 max-w-full scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <MarketplaceGrid
            providers={providers}
            loading={loading}
            onSelectApp={(app) => {
              setSelectedApp(app);
              setIsDetailsOpen(true);
            }}
            onConnect={handleConnect}
            onOpenExplorer={handleOpenExplorer}
          />
        </div>
      )}

      {/* Tab 2: Connected Apps */}
      {activeTab === "connected" && (
        <ConnectedAppsList
          connections={connections}
          loading={loading}
          onOpenExplorer={handleOpenExplorer}
          onDisconnect={handleDisconnect}
          onRefreshSync={handleRefreshSync}
          onSelectApp={(app) => {
            setSelectedApp(app);
            setIsDetailsOpen(true);
          }}
        />
      )}

      {/* Tab 3: Imported Resources */}
      {activeTab === "resources" && (
        <ImportedResourcesView
          resources={resources}
          loading={loading}
          onDeleteResource={handleDeleteResource}
          onRefresh={loadData}
        />
      )}

      {/* Tab 4: Admin & Security Audit */}
      {activeTab === "admin" && isAdmin && <AdminAuditView />}

      {/* Modals */}
      <AppDetailsModal
        provider={selectedApp}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onOpenExplorer={handleOpenExplorer}
      />

      <ResourceExplorerModal
        connection={explorerConnection}
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        onResourceImported={loadData}
      />
    </div>
  );
}
