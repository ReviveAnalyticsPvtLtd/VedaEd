import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./wrapper/ProtectedRoute";
import ChatWidget from "./components/Chatbot/ChatWidget";
import PageNotFound from "./components/PageNotFound";


// Layouts
import DashboardLayout from "./SIS/DashboardLayout";
import TeacherDashboardLayout from "./TeacherSIS/DashboardLayout";
import TeacherCommunicationLayout from "./TeacherCommunication/TeacherCommunicationLayout";

// Admin Dashboard Page
import Dashboard from "./SIS/Dashboard";
import Profile from "./SIS/Profile";

// Student & Staff
import Student from "./SIS/Student";
import Staff from "./SIS/Staff";
import StudentProfile from "./SIS/StudentProfile";
import StaffProfile from "./SIS/Staffprofile";

// Parents
import Parents from "./SIS/Parents";
import ParentProfile from "./SIS/ParentProfile";

// Attendance
import Attendance from "./SIS/Attendance/Attendance";
import Overview from "./SIS/Attendance/Overview";
import ByClass from "./SIS/Attendance/ByClass";
import ByStudent from "./SIS/Attendance/ByStudent";
import ClassDetail from "./SIS/Attendance/ClassDetail";
import StudentDetail from "./SIS/Attendance/StudentDetail";

// Reports
import Reports from "./SIS/Reports/Reports";

// Classes & Schedules
import ClassesSchedules from "./SIS/classes-schedules/ClassesSchedules";
import Classes from "./SIS/classes-schedules/Classes";
import SubjectGroup from "./SIS/classes-schedules/SubjectGroup";
import AssignTeacher from "./SIS/classes-schedules/AssignTeacher";
import Timetable from "./SIS/classes-schedules/Timetable";
import AddClass from "./SIS/classes-schedules/AddClass";
import AddSubject from "./SIS/classes-schedules/AddSubject";
import ClassDetailPage from "./SIS/classes-schedules/ClassDetailPage";
import ClassTimetable from "./SIS/classes-schedules/ClassTimetable";
import TeacherTimetable from "./SIS/classes-schedules/TeacherTimetable";

// ===== Teacher SIS =====
import TeacherClassesPage from "./TeacherSIS/Classes";
import TeacherStudentProfile from "./TeacherSIS/TeacherStudentProfile";
import TeacherAttendance from "./TeacherSIS/TeacherAttendance";
import TeacherAttendanceMark from "./TeacherSIS/TeacherAttendanceMark";
import TeacherLeave from "./TeacherSIS/TeacherLeave";
import AssignmentDashboardUI from "./TeacherSIS/Assingment/Dashboard"
import TTimetable from "./TeacherSIS/Timetable/TTimetable";
import TeacherMyTimetable from "./TeacherSIS/Timetable/MyTimetable";
import TClassTimetable from "./TeacherSIS/Timetable/TClassTimetable";
import CreateAssignment from "./TeacherSIS/Assingment/CreateAssignment";
import TeacherHome from "./TeacherSIS/Dashboard";
import TeacherProfile from "./TeacherSIS/Profile";
import TeacherExams from "./TeacherSIS/Exams";
import TeacherDiscipline from "./TeacherSIS/Discipline";
import TeacherCommunicationPage from "./TeacherSIS/Communication";
import Gradebook from "./TeacherSIS/Gradebook/Gradebook";
import TeacherStudentHealth from "./TeacherSIS/StudentHealth";
import Activities from "./TeacherSIS/Activities";




// ===== Student SIS =====
import StudentDashboardLayout from "./StudentSIS/DashboardLayout";
import StudentDashboard from "./StudentSIS/Dashboard";
import MyClasses from "./StudentSIS/Classes";
import StudentMyTimetable from "./StudentSIS/Timetable";
import Assignments from "./StudentSIS/Assignments";
import Exams from "./StudentSIS/Exams";
import StudentProfilePage from "./StudentSIS/Profile";
import StudentAttendance from "./StudentSIS/Attendance";
import Curriculum from "./StudentSIS/Curriculum";
import StudentActivities from "./StudentSIS/Activities";
import MyHealthRecord from "./StudentSIS/MyHealthRecord";



// ===== Parent SIS =====
import ParentDashboardLayout from "./ParentSIS/DashboardLayout";
import ParentDashboard from "./ParentSIS/Dashboard";
import ParentClasses from "./ParentSIS/Classes";
import ParentCurriculum from "./ParentSIS/Curriculum";
import ParentTimetable from "./ParentSIS/Timetable";
import ParentAttendance from "./ParentSIS/Attendance";
import ParentAssignments from "./ParentSIS/Assignments";
import ParentExams from "./ParentSIS/Exams";
import ParentProfilePage from "./ParentSIS/Profile";
import ParentFees from "./ParentSIS/Fees";
import ParentCommunication from "./ParentSIS/Communication";
import ParentActivities from "./ParentSIS/Activities";
import ParentChildActivities from "./ParentSIS/ChildActivities";
import ChildHealthRecord from "./ParentSIS/ChildHealthRecord";


// ===== Communication Modules =====
import CommunicationAdminLayout from "./CommunicationModuleadmin/CommunicationAdminLayout";
import Logs from "./CommunicationModuleadmin/Logs/Logs";
import AllLogs from "./CommunicationModuleadmin/Logs/AllLogs";
import ScheduleLogs from "./CommunicationModuleadmin/Logs/ScheduleLogs";
import OthersLogs from "./CommunicationModuleadmin/Logs/Others";
import Notices from "./CommunicationModuleadmin/Notices/Notices";
import PostNotices from "./CommunicationModuleadmin/Notices/PostNotices";
import NoticeTemplates from "./CommunicationModuleadmin/Notices/NoticeTemplates";
import OthersNotices from "./CommunicationModuleadmin/Notices/OthersNotices";
import Messages from "./CommunicationModuleadmin/Messages/Messages";
import Group from "./CommunicationModuleadmin/Messages/Group";
import Individual from "./CommunicationModuleadmin/Messages/Individual";
import ClassMsg from "./CommunicationModuleadmin/Messages/Class";
import Templates from "./CommunicationModuleadmin/Messages/Templates";
import CommunicationAdminDashboard from "./CommunicationModuleadmin/CommunicationAdminDashboard";


import CommunicationStudentLayout from "./CommunicationModuleStudent/CommunicationStudentLayout";
import StudentLogs from "./CommunicationModuleStudent/Logs";
import StudentNotices from "./CommunicationModuleStudent/Notices";
import StudentMessages from "./CommunicationModuleStudent/Messages";
import StudentComplaints from "./CommunicationModuleStudent/Complaints";
import CommunicationStudentDashboard from "./CommunicationModuleStudent/Dashboard";


import TeacherLogs from "./TeacherCommunication/Logs/Logs";
import TeacherNotices from "./TeacherCommunication/Notices/Notices";
import TeacherMessages from "./TeacherCommunication/Messages/Messages";
import TeacherComplaints from "./TeacherCommunication/Complaints/Complaints";
import TeacherCommunicationDashboard from "./TeacherCommunication/Dashboard";

import CommunicationParentLayout from "./CommunicationModuleParents/CommunicationParentLayout";
import CommunicationParentDashboard from "./CommunicationModuleParents/Dashboard";
import ParentLogs from "./CommunicationModuleParents/Logs";
import ParentNotices from "./CommunicationModuleParents/Notices";
import ParentMessages from "./CommunicationModuleParents/Messages";
import AdminComplaints from "./CommunicationModuleadmin/Complaints";
import ParentComplaints from "./CommunicationModuleParents/Complaints";

// ===== HR Module =====
import HRDashboardLayout from "./HR/HRDashboardLayout";
import HRDashboard from "./HR/Dashboard";
import StaffDirectory from "./HR/StaffDirectory/StaffDirectory";
import HRStaffProfile from "./HR/StaffDirectory/HRStaffProfile";
import StaffAttendance from "./HR/StaffAttendance/StaffAttendance";
import Payroll from "./HR/Payroll/Payroll";
import ApproveLeave from "./HR/ApproveLeave/ApproveLeave";
import SupportStaffList from "./HR/SupportStaff/SupportStaffList";
import AddSupportStaff from "./HR/SupportStaff/AddSupportStaff";
import SupportStaffDetails from "./HR/SupportStaff/SupportStaffDetails";
import TalentAcquisitionLayout from "./HR/TalentAcquisition/TalentAcquisitionLayout";
import VacancyDashboard from "./HR/TalentAcquisition/VacancyDashboard";
import ApplicationPipeline from "./HR/TalentAcquisition/ApplicationPipeline";
import CandidateForm from "./HR/TalentAcquisition/CandidateForm";

// ===== Receptionist Module =====
import ReceptionistDashboardLayout from "./Receptionist/DashboardLayout";
import ReceptionDashboard from "./Receptionist/Dashboard";
import ReceptionistAdmissionEnquiry from "./Receptionist/AdmissionEnquiry/AdmissionEnquiry";
import VisitorBook from "./Receptionist/VisitorBook/VisitorBook";
import SetupFrontOffice from "./Receptionist/SetupFrontOffice/SetupFrontOffice";
import StudentDetails from "./Receptionist/StudentDetails/StudentDetails";
import ReceptionistStaffDirectory from "./Receptionist/StaffDirectory/StaffDirectory";
import ZoomLiveClasses from "./Receptionist/ZoomLiveClasses/ZoomLiveClasses";

// ===== Admission Module =====
import AdmissionDashboardLayout from "./AdmissionModule/DashboardLayout";
import AdmissionDashboard from "./AdmissionModule/Dashboard";
import AdmissionEnquiry from "./AdmissionModule/AdmissionEnquiry/AdmissionEnquiry";
import EntranceList from "./AdmissionModule/EntranceList/EntranceList";
import InterviewList from "./AdmissionModule/InterviewList/InterviewList";
import AdmissionForm from "./AdmissionModule/AdmissionForm/AdmissionForm";
import DocumentVerification from "./AdmissionModule/DocumentVerification/DocumentVerification";
import RegistrationFees from "./AdmissionModule/RegistrationFees/RegistrationFees";

import ApplicationOffer from "./AdmissionModule/ApplicationOffer/ApplicationOffer.jsx";
import SelectedStudent from "./AdmissionModule/SelectedStudent/SelectedStudent";
import VacancySetup from "./AdmissionModule/VacancySetup";
import ApplicationList from "./AdmissionModule/ApplicationList/ApplicationList";
import ApplicationReview from "./AdmissionModule/ApplicationReview/ApplicationReview";
import StatusTracking from "./AdmissionModule/StatusTracking/StatusTracking";
import FinalStudentList from "./AdmissionModule/FinalStudentList/FinalStudentList";
// import StudentDetailView from "./AdmissionModule/StudentDetailView/StudentDetailView";
import FinalStudentProfile from "./AdmissionModule/FinalStudentList/FinalStudentProfile";


import AdminCalendarLayout from "./AdminCalendar/DashboardLayout";
import AnnualCalendar from "./AdminCalendar/AnnualCalendar";
import EventSetup from "./AdminCalendar/EventSetup";
import AnnualYearSetup from "./AdminCalendar/AnnualYearSetup";


import TeacherAnnualCalendar from "./TeacherCalendar/TeacherAnnualCalendar";
import StudentAnnualCalendar from "./StudentCalendar/StudentAnnualCalendar";
import AdmissionEnquiryPage from "./AdmissionEnquiryPage";
/* ================= WRAPPER ================= */
import Login from "./wrapper/Login";
import AdminShellLayout from "./wrapper/AdminShellLayout";
import AdminMainDashboard from "./wrapper/AdminMainDashboard";
import StaffFrontPage from "./wrapper/StaffFrontPage";
import StudentFrontPage from "./wrapper/StudentFrontPage";
import ParentFrontPage from "./wrapper/ParentFrontPage";
// ===== MASTER DASHBOARDS =====
import StaffMasterDashboard from "./wrapper/StaffMasterDashboard";
import StudentMasterDashboard from "./wrapper/StudentMasterDashboard";
import ParentMasterDashboard from "./wrapper/ParentMasterDashboard";




/* ================= TRANSPORT MODULE ================= */
import TransportDashboardLayout from "./AdminTransport/TransportDashboardLayout";
import TransportDashboard from "./AdminTransport/Dashboard";
import FeesMaster from "./AdminTransport/FeesMaster";
import PickupPoint from "./AdminTransport/PickupPoint";
import RoutesPage from "./AdminTransport/Routes";
import Vehicles from "./AdminTransport/Vehicles";
import AssignVehicle from "./AdminTransport/AssignVehicle";
import RoutePickupPoint from "./AdminTransport/RoutePickupPoint";
import StudentTransportFees from "./AdminTransport/StudentTransportFees";
import DriverAdmission from "./AdminTransport/DriverAdmission";


import StudentTransportLayout from "./StudentTransport/StudentTransportLayout";
import StudentTransportRoute from "./StudentTransport/StudentTransportRoute";


import InstitutionSetup from "./SuperAdmin/InstitutionSetup/InstitutionSetup";

/* ===== ADMIN FEES MODULE ===== */
import AdminFeesLayout from "./AdminFees/AdminFeesLayout";
import AdminFeesDashboard from "./AdminFees/AdminFeesDashboard";

import CollectFees from "./AdminFees/CollectFees/CollectFees";
import CollectFeesProfile from "./AdminFees/CollectFees/CollectFeesProfile";
import SearchFeesPayment from "./AdminFees/SearchFeesPayment/SearchFeesPayment";
import SearchFeesDue from "./AdminFees/SearchFeesDue/SearchFeesDue";

import FeeMaster from "./AdminFees/FeeMaster/FeeMaster";
import FeeGroup from "./AdminFees/FeeGroup/FeeGroup";
import FeeType from "./AdminFees/FeeType/FeeType";
import FeeDiscount from "./AdminFees/FeeDiscount/FeeDiscount";

import FeeCarryForward from "./AdminFees/FeeCarryForward/FeeCarryForward";
import FeeReminder from "./AdminFees/FeeReminder/FeeReminder";



/* ===== PARENT ===== */
import ParentTransportLayout from "./ParentTransport/ParentTransportLayout";
import ParentTransportRoute from "./ParentTransport/ParentTransportRoute";
import RequestChangeRoute from "./ParentTransport/RequestChangeRoute";

/* Parent Fees */
import ParentFeesLayout from "./ParentFees/ParentFeesLayout";
import FeesOverview from "./ParentFees/FeesOverview";
import PayFees from "./ParentFees/PayFees";
import PaymentHistory from "./ParentFees/PaymentHistory";

/* ===== FLEET LAYOUT ===== */
import FleetDashboardLayout from "./FleetManager/FleetDashboardLayout";

/* ===== FLEET PAGES ===== */
import FleetDashboard from "./FleetManager/FleetDashboard";
import FleetVehicles from "./FleetManager/FleetVehicles";
import FleetVehicleMaintenance from "./FleetManager/FleetVehicleMaintenance";
import FleetMaintenanceDetail from "./FleetManager/FleetMaintenanceDetail";
import FleetDocuments from "./FleetManager/FleetDocuments";
import FleetExpenses from "./FleetManager/FleetExpenses";
import FleetFueling from "./FleetManager/FleetFueling";
import FleetDriverAllocation from "./FleetManager/FleetDriverAllocation";

import ParentCalendarDashboardLayout from "./ParentCalendar/ParentCalendarDashboardLayout";
import ParentAnnualCalendar from "./ParentCalendar/ParentAnnualCalendar";

import SuperAdminDashboardLayout from "./superadmin-landing-page/DashboardLayout";
import SuperAdminDashboard from "./superadmin-landing-page/Dashboard";
import SuperAdminProfile from "./superadmin-landing-page/SuperAdminProfile";

/* ================= SUPER ADMIN ================= */
import SuperAdminShellLayout from "./wrapper/SuperAdminShellLayout";
import SuperAdminFrontPage from "./wrapper/SuperAdminFrontPage";
import SuperAdminMasterDashboard from "./wrapper/SuperAdminMasterDashboard";
import IdentityAccessAdminList from "./superadmin-front/identity-access/AdminList";
import IdentityAccessCreateAdmin from "./superadmin-front/identity-access/CreateAdmin";
import IdentityAccessViewAdmin from "./superadmin-front/identity-access/ViewAdmin";
import IdentityAccessEditAdmin from "./superadmin-front/identity-access/EditAdmin";
import IdentityAccessInvitePreview from "./superadmin-front/identity-access/InvitePreview";
import AcceptInvitation from "./pages/AcceptInvitation";
import AdminProfile from "./admin-front/AdminProfile";

import SuperAdminSISDashboardLayout from "./SuperAdmin/SIS/SuperAdminSISDashboardLayout";
import SuperAdminSISDashboard from "./SuperAdmin/SIS/SuperAdminSISDashboard";
import SuperAdminSISStudents from "./SuperAdmin/SIS/SuperAdminSISStudents";
import SuperAdminSISStudentProfile from "./SuperAdmin/SIS/SuperAdminSISStudentProfile";
import SuperAdminSISStaff from "./SuperAdmin/SIS/SuperAdminSISStaff";
import SuperAdminSISStaffProfile from "./SuperAdmin/SIS/SuperAdminSISStaffProfile";
import SuperAdminSISParents from "./SuperAdmin/SIS/SuperAdminSISParents";
import SuperAdminSISParentProfile from "./SuperAdmin/SIS/SuperAdminSISParentProfile";
import SuperAdminSISReports from "./SuperAdmin/SIS/SuperAdminSISReports";


import SuperAdminSISAttendance from "./SuperAdmin/SIS/Attendance/SuperAdminSISAttendance";
import SuperAdminSISAttendanceOverview from "./SuperAdmin/SIS/Attendance/SuperAdminSISAttendanceOverview";
import SuperAdminSISAttendanceByClass from "./SuperAdmin/SIS/Attendance/SuperAdminSISAttendanceByClass";
import SuperAdminSISAttendanceByStudent from "./SuperAdmin/SIS/Attendance/SuperAdminSISAttendanceByStudent";
import SuperAdminSISAttendanceClassDetail from "./SuperAdmin/SIS/Attendance/SuperAdminSISAttendanceClassDetail";
import SuperAdminSISAttendanceStudentDetail from "./SuperAdmin/SIS/Attendance/SuperAdminSISAttendanceStudentDetail";import SuperAdminSISClasses from "./SuperAdmin/SIS/ClassesSchedules/SuperAdminSISClasses";
import SuperAdminSISSubjectGroup from "./SuperAdmin/SIS/ClassesSchedules/SuperAdminSISSubjectGroup";
import SuperAdminSISAssignTeacher from "./SuperAdmin/SIS/ClassesSchedules/SuperAdminSISAssignTeacher";
import SuperAdminSISTimetable from "./SuperAdmin/SIS/ClassesSchedules/SuperAdminSISTimetable";
import SuperAdminSISAddClass from "./SuperAdmin/SIS/ClassesSchedules/SuperAdminSISAddClass";
import SuperAdminSISAddSubject from "./SuperAdmin/SIS/ClassesSchedules/SuperAdminSISAddSubject";
import SuperAdminSISClassDetailPage from "./SuperAdmin/SIS/ClassesSchedules/SuperAdminSISClassDetailPage";
import SuperAdminSISClassesSchedules from "./SuperAdmin/SIS/ClassesSchedules/SuperAdminSISClassesSchedules";
import SuperAdminSISClassTimetable from "./SuperAdmin/SIS/ClassesSchedules/SuperAdminSISClassTimetable";
import SuperAdminSISTeacherTimetable from "./SuperAdmin/SIS/ClassesSchedules/SuperAdminSISTeacherTimetable";


import SuperAdminFeesDashboardLayout from "./SuperAdmin/Fees/SuperAdminFeesDashboardLayout";
import SuperAdminFeesDashboard from "./SuperAdmin/Fees/SuperAdminFeesDashboard";
import SuperAdminFeesCollectFees from "./SuperAdmin/Fees/SuperAdminFeesCollectFees";
import SuperAdminFeesFeeMaster from "./SuperAdmin/Fees/SuperAdminFeesFeeMaster";
import SuperAdminFeesFeeGroup from "./SuperAdmin/Fees/SuperAdminFeesFeeGroup";
import SuperAdminFeesFeeType from "./SuperAdmin/Fees/SuperAdminFeesFeeType";
import SuperAdminFeesFeeDiscount from "./SuperAdmin/Fees/SuperAdminFeesFeeDiscount";
import SuperAdminFeesCarryForward from "./SuperAdmin/Fees/SuperAdminFeesCarryForward";
import SuperAdminFeesFeeReminder from "./SuperAdmin/Fees/SuperAdminFeesFeeReminder";
import SuperAdminTransportDashboardLayout from "./SuperAdmin/Transport/SuperAdminTransportDashboardLayout";
import SuperAdminTransportDashboard from "./SuperAdmin/Transport/SuperAdminTransportDashboard";
import SuperAdminTransportDriverAdmission from "./SuperAdmin/Transport/SuperAdminTransportDriverAdmission";
import SuperAdminTransportVehicles from "./SuperAdmin/Transport/SuperAdminTransportVehicles";
import SuperAdminTransportRoutes from "./SuperAdmin/Transport/SuperAdminTransportRoutes";
import SuperAdminTransportPickupPoints from "./SuperAdmin/Transport/SuperAdminTransportPickupPoints";
import SuperAdminTransportAssignVehicle from "./SuperAdmin/Transport/SuperAdminTransportAssignVehicle";
import SuperAdminTransportStudentTransportFees from "./SuperAdmin/Transport/SuperAdminTransportStudentTransportFees";
import SuperAdminFleetDashboardLayout from "./SuperAdmin/Fleet/SuperAdminFleetDashboardLayout";
import SuperAdminFleetDashboard from "./SuperAdmin/Fleet/SuperAdminFleetDashboard";
import SuperAdminFleetVehicles from "./SuperAdmin/Fleet/SuperAdminFleetVehicles";
import SuperAdminFleetMaintenance from "./SuperAdmin/Fleet/SuperAdminFleetMaintenance";
import SuperAdminFleetDocuments from "./SuperAdmin/Fleet/SuperAdminFleetDocuments";
import SuperAdminFleetExpenses from "./SuperAdmin/Fleet/SuperAdminFleetExpenses";
import SuperAdminFleetFueling from "./SuperAdmin/Fleet/SuperAdminFleetFueling";
import SuperAdminFleetDriverAllocation from "./SuperAdmin/Fleet/SuperAdminFleetDriverAllocation";
import SuperAdminHRDashboardLayout from "./SuperAdmin/HR/SuperAdminHRDashboardLayout";
import SuperAdminHRDashboard from "./SuperAdmin/HR/SuperAdminHRDashboard";
import SuperAdminHRStaffDirectory from "./SuperAdmin/HR/SuperAdminHRStaffDirectory";
import SuperAdminHRStaffProfile from "./SuperAdmin/HR/SuperAdminHRStaffProfile";
import SuperAdminHRAttendance from "./SuperAdmin/HR/SuperAdminHRAttendance";
import SuperAdminHRPayroll from "./SuperAdmin/HR/SuperAdminHRPayroll";
import SuperAdminHRLeaveApproval from "./SuperAdmin/HR/SuperAdminHRLeaveApproval";
import SuperAdminAdmissionDashboardLayout from "./SuperAdmin/Admission/SuperAdminAdmissionDashboardLayout";
import SuperAdminAdmissionDashboard from "./SuperAdmin/Admission/SuperAdminAdmissionDashboard";
import SuperAdminAdmissionEnquiry from "./SuperAdmin/Admission/SuperAdminAdmissionEnquiry";
import SuperAdminAdmissionEntranceList from "./SuperAdmin/Admission/SuperAdminAdmissionEntranceList";
import SuperAdminAdmissionInterviewList from "./SuperAdmin/Admission/SuperAdminAdmissionInterviewList";
import SuperAdminAdmissionDocumentVerification from "./SuperAdmin/Admission/SuperAdminAdmissionDocumentVerification";
import SuperAdminAdmissionApplicationList from "./SuperAdmin/Admission/SuperAdminAdmissionApplicationList";
import SuperAdminAdmissionApplicationReview from "./SuperAdmin/Admission/SuperAdminAdmissionApplicationReview";
import SuperAdminAdmissionFinalStudents from "./SuperAdmin/Admission/SuperAdminAdmissionFinalStudents";
import SuperAdminAdmissionVacancySetup from "./SuperAdmin/Admission/SuperAdminAdmissionVacancySetup";
import SuperAdminCalendarDashboardLayout from "./SuperAdmin/Calendar/SuperAdminCalendarDashboardLayout";
import SuperAdminCalendarAnnualCalendar from "./SuperAdmin/Calendar/SuperAdminCalendarAnnualCalendar";
import SuperAdminCalendarEventSetup from "./SuperAdmin/Calendar/SuperAdminCalendarEventSetup";
import SuperAdminCalendarYearSetup from "./SuperAdmin/Calendar/SuperAdminCalendarYearSetup";

import LogsSA from "./SuperAdmin/Communication/CommunicationModule/Logs/Logs";
import AllLogsSA from "./SuperAdmin/Communication/CommunicationModule/Logs/AllLogs";
import ScheduleLogsSA from "./SuperAdmin/Communication/CommunicationModule/Logs/ScheduleLogs";
import OthersLogsSA from "./SuperAdmin/Communication/CommunicationModule/Logs/Others";

import NoticesSA from "./SuperAdmin/Communication/CommunicationModule/Notices/Notices";
import PostNoticesSA from "./SuperAdmin/Communication/CommunicationModule/Notices/PostNotices";
import NoticeTemplatesSA from "./SuperAdmin/Communication/CommunicationModule/Notices/NoticeTemplates";
import OthersNoticesSA from "./SuperAdmin/Communication/CommunicationModule/Notices/OthersNotices";

import MessagesSA from "./SuperAdmin/Communication/CommunicationModule/Messages/Messages";
import GroupSA from "./SuperAdmin/Communication/CommunicationModule/Messages/Group";
import IndividualSA from "./SuperAdmin/Communication/CommunicationModule/Messages/Individual";
import ClassMsgSA from "./SuperAdmin/Communication/CommunicationModule/Messages/Class";
import TemplatesSA from "./SuperAdmin/Communication/CommunicationModule/Messages/Templates";

import CommunicationSuperAdminLayout from "./SuperAdmin/Communication/CommunicationModule/CommunicationSuperAdminLayout";
import CommunicationSuperAdminDashboard from "./SuperAdmin/Communication/CommunicationModule/CommunicationSuperAdminDashboard";
import ComplaintsSA from "./SuperAdmin/Communication/CommunicationModule/Complaints";

import OnboardingStep1 from "./Onboarding-Module/OnboardingStep1";
import OnboardingStep2 from "./Onboarding-Module/OnboardingStep2";
import OnboardingStep3 from "./Onboarding-Module/OnboardingStep3";
import OnboardingStep4 from "./Onboarding-Module/OnboardingStep4";
import OnboardingStep5 from "./Onboarding-Module/OnboardingStep5";
import OnboardingStep6 from "./Onboarding-Module/OnboardingStep6";
import OnboardingProcessPending from "./Onboarding-Module/OnboardingProcessPending";
import OnboardingEmail from "./Onboarding-Module/OnboardingEmail";
import OnboardingStepPlaceholder from "./Onboarding-Module/OnboardingStepPlaceholder";
import OnboardingRoute from "./wrapper/OnboardingRoute";

import ProjectStartPage from "./Setup-Module/ProjectStartPage";
import Step1 from "./Setup-Module/Step1";
import Step2 from "./Setup-Module/Step2";
import Step3 from "./Setup-Module/Step3";
import Step4 from "./Setup-Module/Step4";
import Step5 from "./Setup-Module/Step5";
import Step6 from "./Setup-Module/Step6";
import Step7 from "./Setup-Module/Step7";
import Step8 from "./Setup-Module/Step8";
import Step9 from "./Setup-Module/Step9";

import Step10 from "./Setup-Module/Step10";
import Step11 from "./Setup-Module/Step11";
import Step12 from "./Setup-Module/Step12";

import Question1 from "./onboarding2/Question1";
import Question2 from "./onboarding2/Question2";
import Question3 from "./onboarding2/Question3";
import Question4 from "./onboarding2/Question4";
import Question5 from "./onboarding2/Question5";
import Payout from "./onboarding2/Payout";


import SuperAdminProfileSettings from "./wrapper/SuperAdminProfileSettings";

import AdminAccountSettings from "./admin-front/AdminAccountSettings";




import SuperAdminSettingsDashboardLayout from "./SuperAdminSettings/SuperAdminSettingsDashboardLayout";

import SuperAdminSettingsAccount from "./SuperAdminSettings/pages/SuperAdminSettingsAccount";
import SuperAdminSettingsPreferences from "./SuperAdminSettings/pages/SuperAdminSettingsPreferences";
import SuperAdminSettingsNotifications from "./SuperAdminSettings/pages/SuperAdminSettingsNotifications";

import SuperAdminSettingsSecurity from "./SuperAdminSettings/pages/SuperAdminSettingsSecurity";
import SuperAdminSettingsPassword from "./SuperAdminSettings/pages/SuperAdminSettingsPassword";
import SuperAdminSettingsTwoFactorAuth from "./SuperAdminSettings/pages/SuperAdminSettingsTwoFactorAuth";
import SuperAdminSettingsSessions from "./SuperAdminSettings/pages/SuperAdminSettingsSessions";
import SuperAdminSettingsAccountControl from "./SuperAdminSettings/pages/SuperAdminSettingsAccountControl";
import SuperAdminSettingsManagePlan from "./SuperAdminSettings/pages/SuperAdminSettingsManagePlan";
import SuperAdminSettingsBillingDetails from "./SuperAdminSettings/pages/SuperAdminSettingsBillingDetails";
import SuperAdminSettingsBillingSettings from "./SuperAdminSettings/pages/SuperAdminSettingsBillingSettings";

import SuperAdminSettingsHelpCenter from "./SuperAdminSettings/pages/SuperAdminSettingsHelpCenter";
import SuperAdminSettingsContactSupport from "./SuperAdminSettings/pages/SuperAdminSettingsContactSupport";
import SuperAdminSettingsFeedback from "./SuperAdminSettings/pages/SuperAdminSettingsFeedback";


import AdminPreferences from "./admin-front/AdminPreferences";
import AdminNotifications from "./admin-front/AdminNotifications";
import AdminSecurity from "./admin-front/AdminSecurity";
import AdminSettingsPassword from "./admin-front/AdminSettingsPassword";
import AdminSettingsTwoFactorAuth from "./admin-front/AdminSettingsTwoFactorAuth";
import AdminSettingsSessions from "./admin-front/AdminSettingsSessions";
import AdminSettingsAccountControl from "./admin-front/AdminSettingsAccountControl";
import AdminHelpCenter from "./admin-front/AdminHelpCenter";
import AdminContactSupport from "./admin-front/AdminContactSupport";
import AdminFeedback from "./admin-front/AdminFeedback";

import AdminSettingsSidebar from "./admin-front/AdminSettingsSidebar";
import AdminSettingsDashboardLayout from "./admin-front/AdminSettingsDashboardLayout";


import ParentProfileSettingsDashboardLayout from "./ParentProfileSettings/ParentProfileSettingsDashboardLayout";

import ParentProfileSettingsProfile from "./ParentProfileSettings/pages/ParentProfileSettingsProfile";
import ParentProfileSettingsAccount from "./ParentProfileSettings/pages/ParentProfileSettingsAccount";

import ParentProfileSettingsPreferences from "./ParentProfileSettings/pages/ParentProfileSettingsPreferences";
import ParentProfileSettingsNotifications from "./ParentProfileSettings/pages/ParentProfileSettingsNotifications";

import ParentProfileSettingsSecurity from "./ParentProfileSettings/pages/ParentProfileSettingsSecurity";

import ParentProfileSettingsHelpCenter from "./ParentProfileSettings/pages/ParentProfileSettingsHelpCenter";
import ParentProfileSettingsContactSupport from "./ParentProfileSettings/pages/ParentProfileSettingsContactSupport";
import ParentProfileSettingsFeedback from "./ParentProfileSettings/pages/ParentProfileSettingsFeedback";

import ParentProfileSettingsPassword from "./ParentProfileSettings/pages/ParentProfileSettingsPassword";
import ParentProfileSettingsTwoFactorAuth from "./ParentProfileSettings/pages/ParentProfileSettingsTwoFactorAuth";
import ParentProfileSettingsSessions from "./ParentProfileSettings/pages/ParentProfileSettingsSessions";
import ParentProfileSettingsAccountControl from "./ParentProfileSettings/pages/ParentProfileSettingsAccountControl";


import TeacherProfileSettingsDashboardLayout from "./TeacherProfileSettings/TeacherProfileSettingsDashboardLayout";

import TeacherProfileSettingsProfile from "./TeacherProfileSettings/pages/TeacherProfileSettingsProfile";
import TeacherProfileSettingsAccount from "./TeacherProfileSettings/pages/TeacherProfileSettingsAccount";
import TeacherProfileSettingsPreferences from "./TeacherProfileSettings/pages/TeacherProfileSettingsPreferences";
import TeacherProfileSettingsNotifications from "./TeacherProfileSettings/pages/TeacherProfileSettingsNotifications";
import TeacherProfileSettingsSecurity from "./TeacherProfileSettings/pages/TeacherProfileSettingsSecurity";
import TeacherProfileSettingsHelpCenter from "./TeacherProfileSettings/pages/TeacherProfileSettingsHelpCenter";
import TeacherProfileSettingsContactSupport from "./TeacherProfileSettings/pages/TeacherProfileSettingsContactSupport";
import TeacherProfileSettingsFeedback from "./TeacherProfileSettings/pages/TeacherProfileSettingsFeedback";

import TeacherProfileSettingsPassword from "./TeacherProfileSettings/pages/TeacherProfileSettingsPassword";
import TeacherProfileSettingsTwoFactorAuth from "./TeacherProfileSettings/pages/TeacherProfileSettingsTwoFactorAuth";
import TeacherProfileSettingsSessions from "./TeacherProfileSettings/pages/TeacherProfileSettingsSessions";
import TeacherProfileSettingsAccountControl from "./TeacherProfileSettings/pages/TeacherProfileSettingsAccountControl";


import StudentProfileSettingsDashboardLayout from "./StudentProfileSettings/StudentProfileSettingsDashboardLayout";

import StudentProfileSettingsProfile from "./StudentProfileSettings/pages/StudentProfileSettingsProfile";
import StudentProfileSettingsAccount from "./StudentProfileSettings/pages/StudentProfileSettingsAccount";
import StudentProfileSettingsPreferences from "./StudentProfileSettings/pages/StudentProfileSettingsPreferences";
import StudentProfileSettingsNotifications from "./StudentProfileSettings/pages/StudentProfileSettingsNotifications";
import StudentProfileSettingsSecurity from "./StudentProfileSettings/pages/StudentProfileSettingsSecurity";
import StudentProfileSettingsHelpCenter from "./StudentProfileSettings/pages/StudentProfileSettingsHelpCenter";
import StudentProfileSettingsContactSupport from "./StudentProfileSettings/pages/StudentProfileSettingsContactSupport";

const TeacherAssignment = () => <AssignmentDashboardUI />;


function App() {
  return (
    <>
      <Routes>
        {/* ================= LOGIN ================= */}
        <Route path="/question1" element={<Question1 />} />
        <Route path="/question2" element={<Question2 />} />
        <Route path="/question3" element={<Question3 />} />
        <Route path="/question4" element={<Question4 />} />
        <Route path="/question5" element={<Question5 />} />
        <Route path="/payout" element={<Payout />} />
        <Route path="/" element={<Login />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />

        {/* ================= ONBOARDING (account creation — separate from setup) ================= */}
        <Route path="/onboarding/step-1" element={<OnboardingStep1 />} />
        <Route path="/onboarding/email" element={<OnboardingEmail />} />
        <Route element={<OnboardingRoute />}>
          <Route path="/onboarding/step-2" element={<OnboardingStep2 />} />
          <Route path="/onboarding/step-3" element={<OnboardingStep3 />} />
          <Route path="/onboarding/step-4" element={<OnboardingStep4 />} />
          <Route path="/onboarding/step-5" element={<OnboardingStep5 />} />
          <Route path="/onboarding/step-6" element={<OnboardingStep6 />} />
          <Route
            path="/onboarding/process-pending"
            element={<OnboardingProcessPending />}
          />
        </Route>

        {/* user info pages — school setup wizard (after onboarding) */}
        <Route path="/setup/start" element={<ProjectStartPage />} />
        <Route path="/setup/step-1" element={<Step1 />} />
        <Route path="/setup/step-2" element={<Step2 />} />
        <Route path="/setup/step-3" element={<Step3 />} />
        <Route path="/setup/step-4" element={<Step4 />} />
        <Route path="/setup/step-5" element={<Step5 />} />
        <Route path="/setup/step-6" element={<Step6 />} />
        <Route path="/setup/step-7" element={<Step7 />} />
        <Route path="/setup/step-8" element={<Step8 />} />
        <Route path="/setup/step-9" element={<Step9 />} />
        <Route path="/setup/step-10" element={<Step10 />} />
        <Route path="/setup/step-11" element={<Step11 />} />
        <Route path="/setup/step-12" element={<Step12 />} />
        <Route path="/form/step-1" element={<Step1 />} />
  <Route path="/form/step-2" element={<Step2 />} />
  <Route path="/form/step-3" element={<Step3 />} />
  <Route path="/form/step-4" element={<Step4 />} />
  <Route path="/form/step-5" element={<Step5 />} />
  <Route path="/form/step-6" element={<Step6 />} />
  <Route path="/form/step-7" element={<Step7 />} />
  <Route path="/form/step-8" element={<Step8 />} />
  <Route path="/form/step-9" element={<Step9 />} />
        <Route path="/form/step-10" element={<Step10 />} />
        <Route path="/form/step-11" element={<Step11 />} />
        <Route path="/form/step-12" element={<Step12 />} />

        {/* ================= ROLE FRONTS ================= */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin-front" element={<AdminShellLayout />}>
            <Route index element={<AdminMainDashboard />} />
         
             {/* SETTINGS MODULE */}
    <Route
      path="settings"
      element={<AdminSettingsDashboardLayout />}
    >
       <Route path="profile" element={<AdminProfile />} />
      <Route path="account" element={<AdminAccountSettings />} />
      <Route path="preferences" element={<AdminPreferences />} />
      <Route path="notifications" element={<AdminNotifications />} />
       {/* Security */}
  <Route path="security" element={<AdminSecurity />} />

  <Route
    path="security/password"
    element={<AdminSettingsPassword />}
  />

  <Route
    path="security/two-factor-auth"
    element={<AdminSettingsTwoFactorAuth />}
  />

  <Route
    path="security/sessions"
    element={<AdminSettingsSessions />}
  />

  <Route
    path="security/account-control"
    element={<AdminSettingsAccountControl />}
  />

      <Route path="help-center" element={<AdminHelpCenter />} />
      <Route path="contact-support" element={<AdminContactSupport />} />
      <Route path="feedback" element={<AdminFeedback />} />
    </Route>
          </Route>
        </Route>

      <Route element={<ProtectedRoute allowedRoles={["staff", "admin", "teacher"]} />}>
        <Route path="/staff-front" element={<StaffFrontPage />}>
          <Route index element={<StaffMasterDashboard />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route path="/student-front" element={<StudentFrontPage />}>
          <Route index element={<StudentMasterDashboard />} />
        </Route>
      </Route>

      {/* ===== PARENT FRONT ===== */}
      <Route element={<ProtectedRoute allowedRoles={["parent"]} />}>
        <Route path="/parent-front" element={<ParentFrontPage />}>
          <Route index element={<ParentMasterDashboard />} />
        </Route>
      </Route>
      {/* ================= SUPER ADMIN (protected) ================= */}
      <Route element={<ProtectedRoute allowedRoles={["superadmin"]} />}>
        <Route path="/superadmin-front" element={<SuperAdminShellLayout />}>
          <Route index element={<SuperAdminFrontPage />} />
          <Route path="dashboard" element={<SuperAdminMasterDashboard />} />
          <Route
            path="identity-access"
            element={<Navigate to="/superadmin-front/identity-access/admins" replace />}
          />
          <Route path="identity-access/admins" element={<IdentityAccessAdminList />} />
          <Route path="identity-access/admins/create" element={<IdentityAccessCreateAdmin />} />
          <Route path="identity-access/admins/:id/invite-preview" element={<IdentityAccessInvitePreview />} />
          <Route path="identity-access/admins/:id/edit" element={<IdentityAccessEditAdmin />} />
          <Route path="identity-access/admins/:id" element={<IdentityAccessViewAdmin />} />
        </Route>

        <Route path="/superadmin" element={<SuperAdminDashboardLayout />}>
  <Route index element={<Navigate to="dashboard" />} />
  <Route path="dashboard" element={<SuperAdminDashboard />} />
  <Route path="settings/profile" element={<SuperAdminProfile />} />
</Route>
  {/* ===== SIS ===== */}
      <Route path="/superadmin/sis" element={<SuperAdminSISDashboardLayout />}>
        <Route index element={<SuperAdminSISDashboard />} />
        <Route path="students" element={<SuperAdminSISStudents />} />
        <Route path="students/:id" element={<SuperAdminSISStudentProfile />} />
        <Route path="staff" element={<SuperAdminSISStaff />} />
<Route
  path="staff-profile/:id"
  element={<SuperAdminSISStaffProfile />}
/>
        <Route path="parents" element={<SuperAdminSISParents />} />
        <Route path="parents/:id" element={<SuperAdminSISParentProfile />} />
        <Route path="reports" element={<SuperAdminSISReports />} />

      <Route
  path="attendance"
  element={<SuperAdminSISAttendance />}
>
  <Route index element={<Navigate to="overview" />} />

  <Route
    path="overview"
    element={<SuperAdminSISAttendanceOverview />}
  />

  <Route
    path="by-class"
    element={<SuperAdminSISAttendanceByClass />}
  />

  <Route
    path="by-student"
    element={<SuperAdminSISAttendanceByStudent />}
  />

  <Route
    path="by-class/:id"
    element={<SuperAdminSISAttendanceClassDetail />}
  />

  <Route
    path="by-student/:id"
    element={<SuperAdminSISAttendanceStudentDetail />}
  />
</Route>

      <Route
  path="classes-schedules"
  element={<SuperAdminSISClassesSchedules />}
>
  <Route index element={<Navigate to="classes" />} />

  <Route path="classes" element={<SuperAdminSISClasses />} />
  <Route path="subject-group" element={<SuperAdminSISSubjectGroup />} />
  <Route path="assign-teacher" element={<SuperAdminSISAssignTeacher />} />
  <Route path="timetable" element={<SuperAdminSISTimetable />} />

  <Route path="add-class" element={<SuperAdminSISAddClass />} />
  <Route path="add-subject" element={<SuperAdminSISAddSubject />} />

  <Route
    path="class-detail/:classId/:sectionId"
    element={<SuperAdminSISClassDetailPage />}
  />

  <Route
    path="class-timetable/:classId"
    element={<SuperAdminSISClassTimetable />}
  />

  <Route
    path="teacher-timetable/:teacherId"
    element={<SuperAdminSISTeacherTimetable />}
  />
</Route>
      </Route>

      {/* ===== FEES ===== */}
      <Route path="/superadmin/fees" element={<SuperAdminFeesDashboardLayout />}>
        <Route index element={<SuperAdminFeesDashboard />} />
        <Route path="collect" element={<SuperAdminFeesCollectFees />} />
        <Route path="fee-master" element={<SuperAdminFeesFeeMaster />} />
        <Route path="fee-group" element={<SuperAdminFeesFeeGroup />} />
        <Route path="fee-type" element={<SuperAdminFeesFeeType />} />
        <Route path="fee-discount" element={<SuperAdminFeesFeeDiscount />} />
        <Route path="carry-forward" element={<SuperAdminFeesCarryForward />} />
        <Route path="reminder" element={<SuperAdminFeesFeeReminder />} />
      </Route>

      {/* ===== TRANSPORT ===== */}
      <Route path="/superadmin/transport" element={<SuperAdminTransportDashboardLayout />}>
        <Route index element={<SuperAdminTransportDashboard />} />
        <Route path="driver-admission" element={<SuperAdminTransportDriverAdmission />} />
        <Route path="vehicles" element={<SuperAdminTransportVehicles />} />
        <Route path="routes" element={<SuperAdminTransportRoutes />} />
        <Route path="pickup-points" element={<SuperAdminTransportPickupPoints />} />
        <Route path="assign-vehicle" element={<SuperAdminTransportAssignVehicle />} />
        <Route path="student-fees" element={<SuperAdminTransportStudentTransportFees />} />
      </Route>

      {/* ===== FLEET ===== */}
      <Route path="/superadmin/fleet" element={<SuperAdminFleetDashboardLayout />}>
        <Route index element={<SuperAdminFleetDashboard />} />
        <Route path="vehicles" element={<SuperAdminFleetVehicles />} />
        <Route path="maintenance" element={<SuperAdminFleetMaintenance />} />
        <Route path="documents" element={<SuperAdminFleetDocuments />} />
        <Route path="expenses" element={<SuperAdminFleetExpenses />} />
        <Route path="fueling" element={<SuperAdminFleetFueling />} />
        <Route path="driver-allocation" element={<SuperAdminFleetDriverAllocation />} />
      </Route>

      {/* ===== HR ===== */}
      <Route path="/superadmin/hr" element={<SuperAdminHRDashboardLayout />}>
        <Route index element={<SuperAdminHRDashboard />} />
        <Route path="staff" element={<SuperAdminHRStaffDirectory />} />
        <Route path="staff/:id" element={<SuperAdminHRStaffProfile />} />
        <Route path="attendance" element={<SuperAdminHRAttendance />} />
        <Route path="payroll" element={<SuperAdminHRPayroll />} />
        <Route path="leave-approval" element={<SuperAdminHRLeaveApproval />} />
      </Route>

      {/* ===== ADMISSION ===== */}
      <Route path="/superadmin/admission" element={<SuperAdminAdmissionDashboardLayout />}>
        <Route index element={<SuperAdminAdmissionDashboard />} />
        <Route path="enquiry" element={<SuperAdminAdmissionEnquiry />} />
        <Route path="entrance" element={<SuperAdminAdmissionEntranceList />} />
        <Route path="interview" element={<SuperAdminAdmissionInterviewList />} />
        <Route path="documents" element={<SuperAdminAdmissionDocumentVerification />} />
        <Route path="applications" element={<SuperAdminAdmissionApplicationList />} />
        <Route path="review/:id" element={<SuperAdminAdmissionApplicationReview />} />
        <Route path="final-students" element={<SuperAdminAdmissionFinalStudents />} />
        <Route path="vacancy-setup" element={<SuperAdminAdmissionVacancySetup />} />
      </Route>

   <Route
  path="/superadmin/communication"
  element={<CommunicationSuperAdminLayout />}
>
  <Route
    index
    element={<CommunicationSuperAdminDashboard />}
  />

  <Route path="logs" element={<LogsSA />}>
    <Route index element={<AllLogsSA />} />
    <Route path="schedule" element={<ScheduleLogsSA />} />
    <Route path="others" element={<OthersLogsSA />} />
  </Route>

  <Route path="notices" element={<NoticesSA />}>
    <Route index element={<PostNoticesSA />} />
    <Route path="templates" element={<NoticeTemplatesSA />} />
    <Route path="others" element={<OthersNoticesSA />} />
  </Route>

  <Route path="messages" element={<MessagesSA />}>
    <Route index element={<GroupSA />} />
    <Route path="individual" element={<IndividualSA />} />
    <Route path="class" element={<ClassMsgSA />} />
    <Route path="templates" element={<TemplatesSA />} />
  </Route>

  <Route path="complaints" element={<ComplaintsSA />} />
</Route>

      {/* ===== CALENDAR ===== */}
      <Route path="/superadmin/calendar" element={<SuperAdminCalendarDashboardLayout />}>
        <Route index element={<Navigate to="annual" />} />
        <Route path="annual" element={<SuperAdminCalendarAnnualCalendar />} />
        <Route path="event-setup" element={<SuperAdminCalendarEventSetup />} />
        <Route path="year-setup" element={<SuperAdminCalendarYearSetup />} />
      </Route>
      </Route>

<Route
  path="/parent-calendar"
  element={<ParentCalendarDashboardLayout />}
>
  <Route index element={<ParentAnnualCalendar />} />
</Route>

{/* ===== ADMIN FEES ROUTES ===== */}
        <Route path="/admin/fees" element={<AdminFeesLayout />}>
          
          {/* Dashboard */}
          <Route index element={<AdminFeesDashboard />} />

          {/* Main Actions */}
          <Route path="collect-fees" element={<CollectFees />} />
       <Route path="collect-fees/:id" element={<CollectFeesProfile />} />
          {/* Student Profile Page */}
       

          <Route path="search-payment" element={<SearchFeesPayment />} />
          <Route path="search-due" element={<SearchFeesDue />} />

          {/* Setup */}
          <Route path="fee-master" element={<FeeMaster />} />
          <Route path="fee-group" element={<FeeGroup />} />
          <Route path="fee-type" element={<FeeType />} />
          <Route path="fee-discount" element={<FeeDiscount />} />

          {/* Utilities */}
          <Route path="carry-forward" element={<FeeCarryForward />} />
          <Route path="reminder" element={<FeeReminder />} />

        </Route>

   {/* Parent Fees Module */}
        <Route path="/parent/fees" element={<ParentFeesLayout />}>
          <Route index element={<FeesOverview />} />
          <Route path="pay" element={<PayFees />} />
          <Route path="history" element={<PaymentHistory />} />
        </Route>

      {/* ================= ADMIN SIS ================= */}
      <Route element={<ProtectedRoute allowedRoles={["admin", "staff"]} />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<Student />} />
          <Route path="student-profile/:id" element={<StudentProfile />} />
          <Route path="staff" element={<Staff />} />
          <Route path="staff-profile/:id" element={<StaffProfile />} />
          <Route path="parents" element={<Parents />} />
          <Route path="parent-profile/:parentId" element={<ParentProfile />} />
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<Profile />} />

          {/* Attendance */}
          <Route path="attendance" element={<Attendance />}>
            <Route index element={<Navigate to="overview" />} />
            <Route path="overview" element={<Overview />} />
            <Route path="by-class" element={<ByClass />} />
            <Route path="by-student" element={<ByStudent />} />
            <Route path="by-class/:id" element={<ClassDetail />} />
            <Route path="by-student/:id" element={<StudentDetail />} />
          </Route>

          {/* Classes & Schedules */}
          <Route path="classes-schedules" element={<ClassesSchedules />}>
            <Route index element={<Navigate to="classes" />} />

            <Route path="classes" element={<Classes />} />
            <Route path="subject-group" element={<SubjectGroup />} />
            <Route path="assign-teacher" element={<AssignTeacher />} />
            <Route path="timetable" element={<Timetable />} />

            <Route path="add-class" element={<AddClass />} />
            <Route path="add-subject" element={<AddSubject />} />

            <Route
              path="class-detail/:classId/:sectionId"
              element={<ClassDetailPage />}
            />

            <Route
              path="class-timetable/:classId"
              element={<ClassTimetable />}
            />

            <Route
              path="teacher-timetable/:teacherId"
              element={<TeacherTimetable />}
            />
          </Route>
        </Route>
      </Route>
      {/* ================= TEACHER SIS ================= */}
      <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
        <Route path="/teacher" element={<TeacherDashboardLayout />}>
          <Route index element={<TeacherHome />} />
          <Route path="classes" element={<TeacherClassesPage />} />
          <Route path="attendance" element={<TeacherAttendance />}>
            <Route index element={<Navigate to="mark" replace />} />
            <Route path="mark" element={<TeacherAttendanceMark />} />
            <Route path="teacher-leave" element={<TeacherLeave />} />
          </Route>
          <Route path="assignment" element={<TeacherAssignment />} />
          <Route path="assignment/create" element={<CreateAssignment />} />
          <Route path="exams" element={<TeacherExams />} />
          <Route path="timetable" element={<TTimetable />}>
            <Route index element={<Navigate to="my" replace />} />
            <Route path="my" element={<TeacherMyTimetable />} />
            <Route path="class" element={<TClassTimetable />} />
          </Route>
          {/* Teacher SIS Routes */}
          <Route
            path="/teacher/gradebook"
            element={<Gradebook />}
          />
          <Route path="discipline" element={<TeacherDiscipline />} />

          <Route path="activities" element={<Activities />} />

          <Route path="communication" element={<TeacherCommunicationPage />} />
          <Route path="profile" element={<TeacherProfile />} />
          <Route path="student-profile" element={<TeacherStudentProfile />} />
          <Route path="student-health" element={<TeacherStudentHealth />} />
        </Route>
      </Route>

      {/* ================= STUDENT SIS ================= */}
      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route path="/student" element={<StudentDashboardLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="classes" element={<MyClasses />} />
          <Route path="curriculum" element={<Curriculum />} />
          <Route path="timetable" element={<StudentMyTimetable />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="exams" element={<Exams />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="/student/activities" element={<StudentActivities />} />
          <Route
            path="/student/my-health-record"
            element={<MyHealthRecord />}
          />

          <Route path="attendance" element={<StudentAttendance />} />
        </Route>
      </Route>

      {/* ================= PARENT SIS ================= */}
      <Route element={<ProtectedRoute allowedRoles={["parent"]} />}>
        <Route path="/parent" element={<ParentDashboardLayout />}>
          <Route index element={<ParentDashboard />} />
          <Route path="classes" element={<ParentClasses />} />
          <Route path="curriculum" element={<ParentCurriculum />} />
          <Route path="timetable" element={<ParentTimetable />} />
          <Route path="attendance" element={<ParentAttendance />} />
          <Route path="assignments" element={<ParentAssignments />} />
          <Route path="exams" element={<ParentExams />} />
          <Route path="child-activities" element={<ParentChildActivities />} />
          <Route path="/parent/health" element={<ChildHealthRecord />} />

          <Route path="profile" element={<ParentProfilePage />} />
          <Route path="fees" element={<ParentFees />} />
          <Route path="communication" element={<ParentCommunication />} />
          <Route path="activities" element={<ParentActivities />} />

        </Route>
      </Route>

      {/* ================= COMMUNICATION ================= */}
      <Route path="/communication/*" element={<CommunicationAdminLayout />
      }>
        <Route index element={<CommunicationAdminDashboard />} />
        <Route path="logs" element={<Logs />}>
          <Route index element={<AllLogs />} />
          <Route path="schedule" element={<ScheduleLogs />} />
          <Route path="others" element={<OthersLogs />} />
        </Route>
        <Route path="notices" element={<Notices />}>
          <Route index element={<PostNotices />} />
          <Route path="templates" element={<NoticeTemplates />} />
          <Route path="others" element={<OthersNotices />} />
        </Route>
        <Route path="messages" element={<Messages />}>
          <Route index element={<Group />} />
          <Route path="individual" element={<Individual />} />
          <Route path="class" element={<ClassMsg />} />
          <Route path="templates" element={<Templates />} />
        </Route>
        <Route path="complaints" element={<AdminComplaints />} />
      </Route>

      <Route path="/student/communication" element={<CommunicationStudentLayout />}>
        <Route index element={<CommunicationStudentDashboard />} />
        <Route path="dashboard" element={<CommunicationStudentDashboard />} />
        <Route path="logs" element={<StudentLogs />} />
        <Route path="notices" element={<StudentNotices />} />
        <Route path="messages" element={<StudentMessages />} />
        <Route path="complaints" element={<StudentComplaints />} />
      </Route>

      <Route path="/teacher-communication" element={<TeacherCommunicationLayout />}>
        <Route index element={<TeacherCommunicationDashboard />} />
        <Route path="dashboard" element={<TeacherCommunicationDashboard />} />

        <Route path="logs" element={<TeacherLogs />} />
        <Route path="notices" element={<TeacherNotices />} />
        <Route path="messages" element={<TeacherMessages />} />
        <Route path="complaints" element={<TeacherComplaints />} />
      </Route>

      <Route path="/parent/communication" element={<CommunicationParentLayout />}>
        <Route index element={<CommunicationParentDashboard />} />
        <Route path="dashboard" element={<CommunicationParentDashboard />} />
        <Route path="logs" element={<ParentLogs />} />
        <Route path="notices/*" element={<ParentNotices />} />
        <Route path="messages/*" element={<ParentMessages />} />
        <Route path="complaints" element={<ParentComplaints />} />
      </Route>

      {/* ================= HR, RECEPTIONIST, ADMISSION  ================= */}
      <Route element={<ProtectedRoute allowedRoles={["hr", "admin"]} />}>
        <Route path="/hr" element={<HRDashboardLayout />}>
          <Route index element={<HRDashboard />} />
          <Route path="dashboard" element={<HRDashboard />} />
          <Route path="staff-directory" element={<StaffDirectory />} />
          <Route path="staff-profile/:id" element={<HRStaffProfile />} />
          <Route path="staff-attendance" element={<StaffAttendance />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="approve-leave" element={<ApproveLeave />} />
          <Route
            path="leave-policy"
            element={<Navigate to="/hr/approve-leave?tab=policy" replace />}
          />
          <Route path="support-staff" element={<SupportStaffList />} />
          <Route path="support-staff/add" element={<AddSupportStaff />} />
          <Route path="support-staff/details" element={<SupportStaffDetails />} />
          <Route path="talent-acquisition/vacancy" element={<VacancyDashboard />} />
          <Route path="talent-acquisition/pipeline" element={<ApplicationPipeline />} />
          <Route path="talent-acquisition/apply" element={<CandidateForm />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["receptionist", "admin"]} />}>
        <Route path="/receptionist" element={<ReceptionistDashboardLayout />}>
          <Route index element={<ReceptionDashboard />} />
          <Route path="admission-enquiry" element={<ReceptionistAdmissionEnquiry />} />
          <Route path="visitor-book" element={<VisitorBook />} />
          <Route path="setup-front-office" element={<SetupFrontOffice />} />
          <Route path="student-details" element={<StudentDetails />} />
          <Route path="staff-directory" element={<ReceptionistStaffDirectory />} />
          <Route path="zoom-live-classes" element={<ZoomLiveClasses />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["admission", "admin"]} />}>
        <Route path="/admission" element={<AdmissionDashboardLayout />}>
          <Route index element={<AdmissionDashboard />} />
          <Route path="admission-enquiry" element={<AdmissionEnquiry />} />
          <Route path="admission-form" element={<AdmissionForm />} />
         
          <Route path="entrance-list" element={<EntranceList />} />
        <Route path="interview-list" element={<InterviewList />} />
        <Route path="document-verification" element={<DocumentVerification />} />
        <Route path="application-offer" element={<ApplicationOffer />} />
        <Route path="registration-fees" element={<RegistrationFees />} />
        <Route path="selected-student" element={<SelectedStudent />} />
        <Route path="application-list" element={<ApplicationList />} />

        <Route
          path="/admission/status-tracking"
          element={<StatusTracking />}
        />

        <Route
          path="/admission/application/:id/review"
          element={<ApplicationReview />}
        />
        <Route
          path="/admission/vacancy-setup"
          element={<VacancySetup />}
        />
        <Route path="/admission/final-students" element={<FinalStudentList />} />
 <Route
  path="final-student-profile/:id"
  element={<FinalStudentProfile />}
/>

      </Route>
    </Route>

     <Route path="/admin/calendar" element={<AdminCalendarLayout />}>
  
  {/* Default redirect */}
  <Route index element={<Navigate to="annual" />} />

  {/* ONLY 3 SCREENS */}
  <Route path="annual" element={<AnnualCalendar />} />
  <Route path="event-setup" element={<EventSetup />} />
  <Route path="year-setup" element={<AnnualYearSetup />} />

</Route>


      {/* ==== TEACHER ==== */}
      <Route path="/teacher/calendar" element={<TeacherAnnualCalendar />} />
      <Route path="/teacher/calendar/:id" element={<TeacherAnnualCalendar />} />

      {/* ==== STUDENT ==== */}
      <Route path="/student/calendar" element={<StudentAnnualCalendar />} />
      <Route path="/student/calendar/:id" element={<StudentAnnualCalendar />} />


      {/* ================= TRANSPORT ROUTES ================= */}
      <Route path="/admin/transport" element={<TransportDashboardLayout />}>
        <Route index element={<TransportDashboard />} />
        <Route path="driver-admission" element={<DriverAdmission />} />
        <Route path="fees-master" element={<FeesMaster />} />
        <Route path="pickup-point" element={<PickupPoint />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="assign-vehicle" element={<AssignVehicle />} />
        <Route path="route-pickup-point" element={<RoutePickupPoint />} />
        <Route
          path="student-transport-fees"
          element={<StudentTransportFees />}
        />
      </Route>

      {/* ================= STUDENT TRANSPORT ================= */}
      <Route
        path="/student/transport"
        element={<StudentTransportLayout />}
      >
        <Route index element={<StudentTransportRoute />} />
      </Route>

      {/* ================= PARENT TRANSPORT ================= */}
      <Route
        path="/parent/transport"
        element={<ParentTransportLayout />}
      >
        <Route index element={<ParentTransportRoute />} />
        <Route
          path="request-change-route"
          element={<RequestChangeRoute />}
        />
      </Route>


         {/* ================= Setting Pages Route ================= */}
<Route
  path="/superadmin/settings/profile"
  element={<SuperAdminProfileSettings />}
/>


<Route
    path="/parent/settings"
    element={<ParentProfileSettingsDashboardLayout />}
  >
    <Route
      path="profile"
      element={<ParentProfileSettingsProfile />}
    />

    <Route
      path="account"
      element={<ParentProfileSettingsAccount />}
    />

    <Route
      path="preferences"
      element={<ParentProfileSettingsPreferences />}
    />

    <Route
      path="notifications"
      element={<ParentProfileSettingsNotifications />}
    />

    
  <Route
    path="security"
    element={<ParentProfileSettingsSecurity />}
  />

  <Route
    path="security/password"
    element={<ParentProfileSettingsPassword />}
  />

  <Route
    path="security/two-factor-auth"
    element={<ParentProfileSettingsTwoFactorAuth />}
  />

  <Route
    path="security/sessions"
    element={<ParentProfileSettingsSessions />}
  />

  <Route
    path="security/account-control"
    element={<ParentProfileSettingsAccountControl />}
  />

    <Route
      path="help-center"
      element={<ParentProfileSettingsHelpCenter />}
    />

    <Route
      path="contact-support"
      element={<ParentProfileSettingsContactSupport />}
    />

    <Route
      path="feedback"
      element={<ParentProfileSettingsFeedback />}
    />
  </Route>

<Route
  path="/teacher/settings"
  element={<TeacherProfileSettingsDashboardLayout />}
>
  <Route
    path="profile"
    element={<TeacherProfileSettingsProfile />}
  />

  <Route
    path="account"
    element={<TeacherProfileSettingsAccount />}
  />

  <Route
    path="preferences"
    element={<TeacherProfileSettingsPreferences />}
  />

  <Route
    path="notifications"
    element={<TeacherProfileSettingsNotifications />}
  />

  <Route
    path="security"
    element={<TeacherProfileSettingsSecurity />}
  />

  <Route
    path="security/password"
    element={<TeacherProfileSettingsPassword />}
  />

  <Route
    path="security/two-factor-auth"
    element={<TeacherProfileSettingsTwoFactorAuth />}
  />

  <Route
    path="security/sessions"
    element={<TeacherProfileSettingsSessions />}
  />

  <Route
    path="security/account-control"
    element={<TeacherProfileSettingsAccountControl />}
  />

  <Route
    path="help-center"
    element={<TeacherProfileSettingsHelpCenter />}
  />

  <Route
    path="contact-support"
    element={<TeacherProfileSettingsContactSupport />}
  />

  <Route
    path="feedback"
    element={<TeacherProfileSettingsFeedback />}
  />
</Route>

<Route
  path="/student/settings"
  element={<StudentProfileSettingsDashboardLayout />}
>
  <Route
    path="profile"
    element={<StudentProfileSettingsProfile />}
  />

  <Route
    path="account"
    element={<StudentProfileSettingsAccount />}
  />

  <Route
    path="preferences"
    element={<StudentProfileSettingsPreferences />}
  />

  <Route
    path="notifications"
    element={<StudentProfileSettingsNotifications />}
  />

  <Route
    path="security"
    element={<StudentProfileSettingsSecurity />}
  />

  <Route
    path="help-center"
    element={<StudentProfileSettingsHelpCenter />}
  />

  <Route
    path="contact-support"
    element={<StudentProfileSettingsContactSupport />}
  />

 
</Route>

<Route
  path="/superadmin/settings"
  element={<SuperAdminSettingsDashboardLayout />}
>
  <Route path="account" element={<SuperAdminSettingsAccount />} />
  <Route path="preferences" element={<SuperAdminSettingsPreferences />} />
  <Route path="notifications" element={<SuperAdminSettingsNotifications />} />

  <Route path="security" element={<SuperAdminSettingsSecurity />} />
  <Route
  path="security/password"
  element={<SuperAdminSettingsPassword />}
/>

<Route
  path="security/two-factor-auth"
  element={<SuperAdminSettingsTwoFactorAuth />}
/>

<Route
  path="security/sessions"
  element={<SuperAdminSettingsSessions />}
/>

<Route
  path="security/account-control"
  element={<SuperAdminSettingsAccountControl />}
/>

  <Route path="manage-plan" element={<SuperAdminSettingsManagePlan />} />
  <Route path="billing-details" element={<SuperAdminSettingsBillingDetails />} />
  <Route path="billing-settings" element={<SuperAdminSettingsBillingSettings />} />

  <Route path="help-center" element={<SuperAdminSettingsHelpCenter />} />
  <Route path="contact-support" element={<SuperAdminSettingsContactSupport />} />
  <Route path="feedback" element={<SuperAdminSettingsFeedback />} />
</Route>
      {/* SUPER ADMIN */}
      <Route
        path="/super-admin/institution-setup"
        element={<InstitutionSetup />}
      />

      {/* DEFAULT */}
      <Route
        path="*"
        element={<PageNotFound />}
      />

      {/* ================= TRANSPORT ================= */}


      {/* ================= FLEET ================= */}
      <Route
        path="/fleet"
        element={<FleetDashboardLayout />}
      >
        <Route index element={<FleetDashboard />} />
        <Route path="vehicles" element={<FleetVehicles />} />
        <Route path="maintenance" element={<FleetVehicleMaintenance />} />
        <Route
          path="maintenance/:id"
          element={<FleetMaintenanceDetail />}
        />
        <Route path="documents" element={<FleetDocuments />} />
        <Route path="expenses" element={<FleetExpenses />} />
        <Route path="fueling" element={<FleetFueling />} />
        <Route
          path="driver-allocation"
          element={<FleetDriverAllocation />}
        />
      </Route>

      <Route path="/admission-enquiry" element={<AdmissionEnquiryPage />} />
    </Routes>
    <ChatWidget />
    </>
  );
}

export default App;