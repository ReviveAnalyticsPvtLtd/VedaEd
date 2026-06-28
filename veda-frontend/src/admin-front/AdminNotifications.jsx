
 import { useEffect, useState } from "react";
 import axios from "axios";
 // import config from "../config";
 
 export default function AdminNotifications() {
   const [loading, setLoading] = useState(true);
 
   const [notifications, setNotifications] = useState({
     email: true,
     push: false,
     inApp: true,
 
     productUpdates: true,
     securityAlerts: true,
     billingNotifications: true,
     newFeatures: true,
     marketingUpdates: false,
   });
 
   useEffect(() => {
     fetchNotifications();
   }, []);
 
   const fetchNotifications = async () => {
     try {
       setLoading(true);
 
       /*
       const res = await axios.get(
         `${config.API_BASE_URL}/settings/notifications`
       );
 
       setNotifications(res.data);
       */
 
       const saved = localStorage.getItem("notificationSettings");
 
       if (saved) {
         setNotifications(JSON.parse(saved));
       }
     } catch (error) {
       console.error("Error fetching notifications:", error);
     } finally {
       setLoading(false);
     }
   };
 
   const handleToggle = (field) => {
     setNotifications((prev) => ({
       ...prev,
       [field]: !prev[field],
     }));
   };
 
   const saveNotifications = async () => {
     try {
       /*
       await axios.put(
         `${config.API_BASE_URL}/settings/notifications`,
         notifications
       );
       */
 
       localStorage.setItem(
         "notificationSettings",
         JSON.stringify(notifications)
       );
 
       alert("Notification Settings Saved");
     } catch (error) {
       console.error("Error saving notifications:", error);
     }
   };
 
   const Toggle = ({ checked, onChange }) => (
     <button
       onClick={onChange}
       className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
         checked ? "bg-slate-900" : "bg-slate-300"
       }`}
     >
       <span
         className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
           checked ? "translate-x-5" : "translate-x-1"
         }`}
       />
     </button>
   );
 
   if (loading) {
     return (
       <div className="bg-white rounded-xl p-10 text-center">
         Loading Notification Settings...
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       {/* HEADER */}
 
       <div>
         <h2 className="text-2xl font-bold text-slate-900">
           Notifications
         </h2>
 
         <p className="text-slate-500">
           Manage how you receive updates and alerts.
         </p>
       </div>
 
       {/* CARD */}
 
       <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-8">
         {/* CHANNELS */}
 
         <div className="space-y-6">
           {/* EMAIL */}
 
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-slate-100 rounded-xl">
                 <span className="text-xl">📧</span>
               </div>
 
               <div>
                 <h3 className="text-lg font-semibold text-slate-900">
                   Email Notifications
                 </h3>
 
                 <p className="text-sm text-slate-500">
                   Receive updates via email.
                 </p>
               </div>
             </div>
 
             <Toggle
               checked={notifications.email}
               onChange={() => handleToggle("email")}
             />
           </div>
 
           {/* PUSH */}
 
           <div className="flex items-center justify-between border-t border-slate-100 pt-6">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-slate-100 rounded-xl">
                 <span className="text-xl">📱</span>
               </div>
 
               <div>
                 <h3 className="text-lg font-semibold text-slate-900">
                   Push Notifications
                 </h3>
 
                 <p className="text-sm text-slate-500">
                   Receive updates on your mobile device.
                 </p>
               </div>
             </div>
 
             <Toggle
               checked={notifications.push}
               onChange={() => handleToggle("push")}
             />
           </div>
 
           {/* IN APP */}
 
           <div className="flex items-center justify-between border-t border-slate-100 pt-6">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-slate-100 rounded-xl">
                 <span className="text-xl">💬</span>
               </div>
 
               <div>
                 <h3 className="text-lg font-semibold text-slate-900">
                   In-App Notifications
                 </h3>
 
                 <p className="text-sm text-slate-500">
                   Receive updates within the platform.
                 </p>
               </div>
             </div>
 
             <Toggle
               checked={notifications.inApp}
               onChange={() => handleToggle("inApp")}
             />
           </div>
         </div>
 
         {/* TYPES */}
 
         <div className="border-t border-slate-100 pt-8">
           <h3 className="text-lg font-semibold text-slate-900">
             Notification Types
           </h3>
 
           <p className="text-sm text-slate-500 mt-1">
             Choose which updates you want to receive.
           </p>
 
           <div className="space-y-4 mt-6">
             {[
               {
                 key: "productUpdates",
                 label: "Product Updates",
               },
               {
                 key: "securityAlerts",
                 label: "Security Alerts",
               },
               {
                 key: "billingNotifications",
                 label: "Billing Notifications",
               },
               {
                 key: "newFeatures",
                 label: "New Features",
               },
               {
                 key: "marketingUpdates",
                 label: "Marketing Updates",
               },
             ].map((item) => (
               <label
                 key={item.key}
                 className="flex items-center gap-3 cursor-pointer"
               >
                 <input
                   type="checkbox"
                   checked={notifications[item.key]}
                   onChange={() =>
                     handleToggle(item.key)
                   }
                   className="w-4 h-4 accent-slate-900"
                 />
 
                 <span className="text-sm text-slate-700">
                   {item.label}
                 </span>
               </label>
             ))}
           </div>
         </div>
 
         {/* SUMMARY */}
 
         <div className="border-t border-slate-100 pt-8">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-slate-50 rounded-xl p-4">
               <p className="text-xs text-slate-500">
                 Email
               </p>
 
               <p className="font-bold text-slate-900">
                 {notifications.email
                   ? "Enabled"
                   : "Disabled"}
               </p>
             </div>
 
             <div className="bg-slate-50 rounded-xl p-4">
               <p className="text-xs text-slate-500">
                 Push
               </p>
 
               <p className="font-bold text-slate-900">
                 {notifications.push
                   ? "Enabled"
                   : "Disabled"}
               </p>
             </div>
 
             <div className="bg-slate-50 rounded-xl p-4">
               <p className="text-xs text-slate-500">
                 In-App
               </p>
 
               <p className="font-bold text-slate-900">
                 {notifications.inApp
                   ? "Enabled"
                   : "Disabled"}
               </p>
             </div>
 
             <div className="bg-slate-50 rounded-xl p-4">
               <p className="text-xs text-slate-500">
                 Active Types
               </p>
 
               <p className="font-bold text-slate-900">
                 {
                   Object.entries(notifications)
                     .slice(3)
                     .filter(([_, value]) => value)
                     .length
                 }
               </p>
             </div>
           </div>
         </div>
 
         {/* FOOTER */}
 
         <div className="border-t border-slate-100 pt-6 flex justify-end gap-3">
           <button
             onClick={fetchNotifications}
             className="px-5 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
           >
             Reset
           </button>
 
           <button
             onClick={saveNotifications}
             className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
           >
             Save Settings
           </button>
         </div>
       </div>
     </div>
   );
 }