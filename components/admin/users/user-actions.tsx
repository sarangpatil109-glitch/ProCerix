"use client";

import { useState } from "react";
import { suspendUser, activateUser } from "@/actions/admin/users";
import { Ban, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function UserActions({ userId, isSuspended }: { userId: string, isSuspended: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggleSuspend = async () => {
    if (!confirm(`Are you sure you want to ${isSuspended ? 'unsuspend' : 'suspend'} this user?`)) return;
    
    setLoading(true);
    if (isSuspended) {
      await activateUser(userId);
    } else {
      await suspendUser(userId);
    }
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={handleToggleSuspend}
      disabled={loading}
      className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
        isSuspended 
          ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30" 
          : "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
      }`}
      title={isSuspended ? "Unsuspend User" : "Suspend User"}
    >
      {isSuspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
    </button>
  );
}
