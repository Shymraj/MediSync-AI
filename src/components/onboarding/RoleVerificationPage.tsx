import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  XCircle, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  RotateCw,
  Home
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useApp } from '../../context/AppContext';
import { OnboardingProgressBar } from './OnboardingProgressBar';

interface RoleVerificationPageProps {
  onApproved: () => void;
  onBack: () => void;
  onBackToHome: () => void;
}

export const RoleVerificationPage: React.FC<RoleVerificationPageProps> = ({ 
  onApproved, 
  onBack,
  onBackToHome 
}) => {
  const { user, tempOnboarding, clearTempRole, requestRoleApproval, simulateAdminDecision } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);

  // Status is dynamically derived: if user already has approval in DB/account vs in onboarding
  const status = user?.roleVerificationStatus && user.roleVerificationStatus !== 'none'
    ? user.roleVerificationStatus 
    : (tempOnboarding.role === 'patient' ? 'approved' : 'pending');

  const handleSimulateApprove = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 600));
    simulateAdminDecision('approved');
    setIsProcessing(false);
  };

  const handleSimulateReject = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 600));
    simulateAdminDecision('rejected', 'Institutional employee ID not found in Government Medical College Hospital registry.');
    setIsProcessing(false);
  };

  const handleLaunchDashboard = () => {
    // Finalize onboarding approval and move to dashboard
    simulateAdminDecision('approved');
    onApproved();
  };

  const handleBackClick = () => {
    // Clear temporary role on backward navigation!
    clearTempRole();
    onBack();
  };

  const staffName = tempOnboarding.name || user?.name || 'Healthcare Staff';
  const roleName = tempOnboarding.role || user?.role || 'Unassigned';
  const hospitalName = tempOnboarding.hospitalName || user?.hospitalName || 'Institutional Hospital';
  const districtName = tempOnboarding.districtName || user?.districtName || 'Tamil Nadu';

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      {/* Onboarding Step Indicator */}
      <OnboardingProgressBar currentStep="verification" />

      <div className="max-w-xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={handleBackClick}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#2563A6] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Role Selection
          </button>

          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#2563A6] transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" /> Home
          </button>
        </div>

        <div className="text-center mb-6">
          <Badge variant="primary" size="md" className="mb-2">Institutional Clearance</Badge>
          <h2 className="text-2xl font-bold text-[#1E293B]">Credential & Role Verification</h2>
          <p className="mt-1 text-xs text-[#64748B]">
            Enforcing strict hospital data isolation and role-based operational permissions.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8">
          {/* User Request Summary with Current Attempt Selections */}
          <div className="p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl mb-6">
            <div className="text-xs font-semibold text-[#1E293B] mb-2 flex items-center justify-between">
              <span>Access Request Details</span>
              <span className="font-mono text-[11px] text-[#64748B]">{user?.id}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#64748B] block text-[11px]">Staff Name:</span>
                <span className="font-semibold text-[#1E293B]">{staffName}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px]">Requested Role:</span>
                <span className="font-semibold text-[#1E293B] capitalize">{roleName}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px]">Target Hospital:</span>
                <span className="font-semibold text-[#1E293B] truncate block">{hospitalName}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px]">District:</span>
                <span className="font-semibold text-[#1E293B]">{districtName}</span>
              </div>
            </div>
          </div>

          {/* STATE 1: PENDING */}
          {status === 'pending' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-amber-50 border border-amber-200 text-[#D97706] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#1E293B]">Verification in Progress</h3>
              <p className="text-xs text-[#64748B] mt-2 max-w-md mx-auto leading-relaxed">
                "Your access request is waiting for hospital approval."
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Hospital Command Superintendent evaluates medical licensing and ward association before granting live access.
              </p>

              {/* Live Hackathon Demo Simulator Actions */}
              <div className="mt-8 p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-left">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-[#2563A6]" />
                  <span className="text-xs font-bold text-[#1E293B]">Demo Control & Super Admin Actions:</span>
                </div>
                <p className="text-[11px] text-[#64748B] mb-3">
                  For hackathon evaluators: simulate institutional medical superintendent approval or rejection.
                </p>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="success" 
                    size="sm" 
                    onClick={handleSimulateApprove} 
                    isLoading={isProcessing}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Simulate Admin Approval
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSimulateReject}
                    isLoading={isProcessing}
                    icon={<XCircle className="w-4 h-4" />}
                  >
                    Simulate Rejection
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: APPROVED */}
          {status === 'approved' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-50 border border-green-200 text-[#15803D] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#1E293B]">Institutional Clearance Granted</h3>
              <p className="text-xs text-[#64748B] mt-1.5 max-w-md mx-auto">
                Affiliation validated for <span className="font-semibold text-[#1E293B]">{hospitalName}</span>. Your security session has been provisioned.
              </p>
              
              <div className="mt-6 flex flex-col gap-2">
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={handleLaunchDashboard} 
                  icon={<ArrowRight className="w-4 h-4" />}
                  className="w-full"
                >
                  Enter {roleName ? roleName.toUpperCase() : ''} Dashboard
                </Button>
              </div>
            </div>
          )}

          {/* STATE 3: REJECTED */}
          {status === 'rejected' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-red-50 border border-red-200 text-[#DC2626] rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#1E293B]">Verification Rejected</h3>
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#DC2626] max-w-md mx-auto text-left">
                <span className="font-semibold block mb-0.5">Hospital Admin Notice:</span>
                {user?.rejectionReason || 'Affiliation could not be established with current medical credentials.'}
              </div>

              <div className="mt-6 flex items-center justify-center gap-3">
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={requestRoleApproval}
                  icon={<RotateCw className="w-4 h-4" />}
                >
                  Request Access Again
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBackClick}
                >
                  Switch Role / Hospital
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
