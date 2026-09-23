import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMail,
  FiBell,
  FiAlertCircle,
  FiFileText,
  FiTrendingUp,
  FiPlusCircle,
  FiSend,
  FiRefreshCw,
} from "react-icons/fi";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import CommunicationAPI from "./communicationAPI";
import config from "../../../config";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const SuperAdminCommunicationDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalAnnouncements: 0,
    totalNotifications: 0,
    scheduledCount: 0,
    draftCount: 0,
  });

  const [recentNotices, setRecentNotices] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = useCallback(
    async (isAutoRefresh = false) => {
      try {
        if (isAutoRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        /*
         * Notice Statistics
         *
         * Same working endpoint used by the existing
         * Communication Admin Dashboard.
         */
        const noticeStatsRes = await fetch(
          `${config.API_BASE_URL}/communication/notices/stats/summary`
        );

        if (!noticeStatsRes.ok) {
          throw new Error(
            "Failed to fetch notice statistics."
          );
        }

        const noticeStats = await noticeStatsRes.json();

        /*
         * Notification Statistics
         *
         * Same working endpoint used by the existing
         * Communication Admin Dashboard.
         */
        const notificationStatsRes = await fetch(
          `${config.API_BASE_URL}/communication/notifications/stats/summary`
        );

        if (!notificationStatsRes.ok) {
          throw new Error(
            "Failed to fetch notification statistics."
          );
        }

        const notificationStats =
          await notificationStatsRes.json();

        /*
         * Recent Notices
         */
        const recentNoticesRes =
          await CommunicationAPI.getNotices({
            limit: 5,
          });

        /*
         * -----------------------------
         * NOTICE STATISTICS
         * -----------------------------
         */
        let totalAnn = 0;
        let draftAnn = 0;
        let categories = [];
        let priorities = [];

        if (noticeStats?.success) {
          const data = noticeStats.data || {};

          totalAnn = Number(
            data.totalNotices || 0
          );

          draftAnn = Number(
            data.draftNotices || 0
          );

          categories = (
            data.noticesByCategory || []
          )
            .filter(
              (item) =>
                item &&
                item.count !== undefined &&
                Number(item.count) > 0
            )
            .map((item) => ({
              name: item._id
                ? String(item._id)
                    .charAt(0)
                    .toUpperCase() +
                  String(item._id).slice(1)
                : "General",

              value: Number(item.count),
            }));

          priorities = (
            data.noticesByPriority || []
          )
            .filter(
              (item) =>
                item &&
                item.count !== undefined &&
                Number(item.count) > 0
            )
            .map((item) => ({
              name: item._id
                ? String(item._id)
                    .charAt(0)
                    .toUpperCase() +
                  String(item._id).slice(1)
                : "Medium",

              value: Number(item.count),
            }));
        }

        /*
         * -----------------------------
         * NOTIFICATION STATISTICS
         * -----------------------------
         */
        let totalNotif = 0;
        let scheduledNotif = 0;

        if (notificationStats?.success) {
          const data =
            notificationStats.data || {};

          totalNotif = Number(
            data.totalNotifications || 0
          );

          scheduledNotif = Number(
            data.scheduledNotifications || 0
          );
        }

        /*
         * -----------------------------
         * SET DASHBOARD DATA
         * -----------------------------
         */
        setStats({
          totalAnnouncements: totalAnn,
          totalNotifications: totalNotif,
          scheduledCount: scheduledNotif,
          draftCount: draftAnn,
        });

        /*
         * Recent notices
         */
        if (recentNoticesRes?.success) {
          setRecentNotices(
            Array.isArray(recentNoticesRes.data)
              ? recentNoticesRes.data
              : []
          );
        } else {
          setRecentNotices([]);
        }

        /*
         * IMPORTANT:
         * No dummy chart data is inserted here.
         *
         * If database has no category/priority data,
         * chart simply shows "No data available".
         */
        setCategoryData(categories);
        setPriorityData(priorities);

        setLastUpdated(new Date());
      } catch (err) {
        console.error(
          "Error loading SuperAdmin Communication Dashboard:",
          err
        );

        setError(
          err?.message ||
            "Failed to fetch communication dashboard data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /*
   * Initial API call
   */
  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  /*
   * Auto refresh every 15 seconds
   */
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchDashboardData]);

  const summaryCards = [
    {
      title: "Total Announcements",
      value: stats.totalAnnouncements,
      icon: <FiBell size={26} />,
      color: "from-blue-500 to-blue-600",
      route: "/superadmin/communication/notices",
    },
    {
      title: "Notifications Sent",
      value: stats.totalNotifications,
      icon: <FiMail size={26} />,
      color: "from-green-500 to-green-600",
      route: "/superadmin/communication/logs",
    },
    {
      title: "Scheduled Notifications",
      value: stats.scheduledCount,
      icon: <FiSend size={26} />,
      color: "from-purple-500 to-purple-600",
      route: "/superadmin/communication/logs",
    },
    {
      title: "Draft Announcements",
      value: stats.draftCount,
      icon: <FiFileText size={26} />,
      color: "from-amber-500 to-amber-600",
      route: "/superadmin/communication/notices",
    },
  ];

  const formatLastUpdated = () => {
    if (!lastUpdated) {
      return "Not updated yet";
    }

    return lastUpdated.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>

        <p className="text-gray-500 font-medium">
          Loading Communication Dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl mt-6 text-center">
        <FiAlertCircle
          className="mx-auto text-red-500 mb-3"
          size={40}
        />

        <h3 className="text-lg font-semibold text-red-800 mb-1">
          Communication Dashboard Connection Failure
        </h3>

        <p className="text-red-600 mb-4 text-sm">
          {error}
        </p>

        <button
          onClick={() => fetchDashboardData(false)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition text-sm"
        >
          Retry Fetching Statistics
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            SuperAdmin Communication Dashboard
          </h2>

        
          
        </div>

       
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.route)}
            className={`bg-gradient-to-r ${card.color} text-white p-5 rounded-xl shadow-sm cursor-pointer transform hover:translate-y-[-2px] transition duration-200`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider opacity-80">
                  {card.title}
                </p>

                <h2 className="text-3xl font-extrabold mt-1">
                  {card.value}
                </h2>
              </div>

              <div className="opacity-90">
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-md font-semibold mb-4 text-gray-800">
          Quick Actions
        </h3>

        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() =>
              navigate(
                "/superadmin/communication/messages"
              )
            }
            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition text-sm font-medium"
          >
            <FiSend />

            Send Group/Class Notification
          </button>

          <button
            onClick={() =>
              navigate(
                "/superadmin/communication/notices"
              )
            }
            className="bg-green-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-green-700 transition text-sm font-medium"
          >
            <FiPlusCircle />

            Compose Announcement
          </button>

          <button
            onClick={() =>
              navigate(
                "/superadmin/communication/logs"
              )
            }
            className="bg-purple-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition text-sm font-medium"
          >
            <FiFileText />

            Review History Logs
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Announcements */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-2">
          <h3 className="text-md font-semibold mb-4 text-gray-800">
            Recent Announcements
          </h3>

          {recentNotices.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No announcements found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b text-gray-400 font-medium pb-2">
                    <th className="py-2.5">
                      Title
                    </th>

                    <th className="py-2.5">
                      Audience
                    </th>

                    <th className="py-2.5">
                      Priority
                    </th>

                    <th className="py-2.5">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="text-gray-700 divide-y divide-gray-50">
                  {recentNotices.map((notice) => (
                    <tr
                      key={notice._id}
                      className="hover:bg-gray-50/55 transition"
                    >
                      <td className="py-3 font-medium text-gray-800">
                        {notice.title || "Untitled"}
                      </td>

                      <td className="py-3 capitalize">
                        {notice.targetAudience ||
                          "—"}
                      </td>

                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            notice.priority ===
                              "urgent" ||
                            notice.priority ===
                              "high"
                              ? "bg-red-50 text-red-600 border border-red-100"
                              : notice.priority ===
                                "medium"
                              ? "bg-yellow-50 text-yellow-600 border border-yellow-100"
                              : "bg-green-50 text-green-600 border border-green-100"
                          }`}
                        >
                          {notice.priority ||
                            "—"}
                        </span>
                      </td>

                      <td className="py-3 text-gray-400 text-xs">
                        {notice.publishDate
                          ? new Date(
                              notice.publishDate
                            ).toLocaleDateString()
                          : "Draft"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Announcement Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-md font-semibold mb-4 text-gray-800">
              Announcement Breakdown
            </h3>

            {categoryData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">
                No category data available.
              </div>
            ) : (
              <>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                COLORS[
                                  index %
                                    COLORS.length
                                ]
                              }
                            />
                          )
                        )}
                      </Pie>

                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 justify-center">
                  {categoryData.map(
                    (entry, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1.5 text-xs text-gray-500"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              COLORS[
                                index %
                                  COLORS.length
                              ],
                          }}
                        />

                        <span>
                          {entry.name}:{" "}
                          {entry.value}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-gray-50 mt-4">
            <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
              <FiTrendingUp size={16} />

              Communication module active.
              Stats refreshed dynamically.
            </div>
          </div>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-md font-semibold mb-4 text-gray-800">
          Announcement Priority Breakdown
        </h3>

        {priorityData.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            No priority data available.
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {priorityData.map(
              (item, index) => (
                <div
                  key={index}
                  className="border border-gray-100 rounded-lg px-5 py-4 min-w-[160px] bg-gray-50"
                >
                  <p className="text-xs text-gray-500 uppercase">
                    {item.name}
                  </p>

                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {item.value}
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminCommunicationDashboard;