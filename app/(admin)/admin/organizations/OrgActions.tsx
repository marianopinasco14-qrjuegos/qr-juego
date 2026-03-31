"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Plan { id: string; name: string }

interface Props {
  orgId: string;
  currentPlanId: string;
  isActive: boolean;
  plans: Plan[];
  mode: "plan" | "actions";
}

export default function OrgActions({ orgId, currentPlanId, isActive, plans, mode }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateOrg = async (body: object) => {
    setLoading(true);
    await fetch(`/api/admin/organizations/${orgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    router.refresh();
    setLoading(false);
  };

  if (mode === "plan") {
    return (
      <select
        defaultValue={currentPlanId}
        disabled={loading}
        onChange={(e) => updateOrg({ planId: e.target.value })}
        className="bg-[#0f0f1a] border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
      >
        {plans.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex gap-1">
      <button
        onClick={() => updateOrg({ isActive: !isActive })}
        disabled={loading}
        className={`text-xs px-2 py-1 rounded transition-colors ${
          isActive
            ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
            : "bg-green-500/20 text-green-300 hover:bg-green-500/30"
        }`}
      >
        {isActive ? "Suspender" : "Activar"}
      </button>
    </div>
  );
}
