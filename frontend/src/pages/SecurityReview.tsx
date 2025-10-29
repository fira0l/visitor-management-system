import React from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const SecurityReview: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <div className="card bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
        <div className="card-body text-center py-12">
          <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Security Review Deprecated
          </h2>
          <div className="max-w-2xl mx-auto space-y-4 text-gray-600 dark:text-gray-300">
            <p className="text-lg">
              The security review process has been replaced with a new <strong>Division Head Approval System</strong>.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">New Approval Process:</h3>
              <ul className="text-left space-y-2 text-blue-800 dark:text-blue-200">
                <li>• <strong>Division Heads</strong> now approve visitor requests</li>
                <li>• Two approval options: "Approve by Own Risk" or "Request Division Approval"</li>
                <li>• Complete audit trail with "approved by" tracking</li>
                <li>• Better departmental control and accountability</li>
              </ul>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Security personnel no longer have visitor approval responsibilities. 
                All approvals are now handled by division heads through the main dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SecurityReview;
