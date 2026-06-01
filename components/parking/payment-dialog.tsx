"use client";

import { useState } from "react";
import { CreditCard, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCents } from "@/lib/pricing";
import { api } from "@/lib/api";

type Props = {
  sessionId: string;
  priceCents: number;
  onClose: () => void;
  onSuccess: () => void;
};

type Method = "card" | "apple_pay";

export function PaymentDialog({ sessionId, priceCents, onClose, onSuccess }: Props) {
  const [method, setMethod] = useState<Method>("card");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await api("/api/parking/pay", {
        method: "POST",
        body: JSON.stringify({ sessionId, paymentMethod: method })
      });
      toast.success("Payment successful! You may now exit.");
      onSuccess();
    } catch (error) {
      toast.error("Payment failed", { description: error instanceof Error ? error.message : "Try again" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-t-3xl bg-slate-900 p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Complete payment</h2>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 rounded-2xl bg-white/5 p-5 text-center">
          <p className="text-sm text-slate-400">Amount due</p>
          <p className="mt-1 text-4xl font-bold text-white">{formatCents(priceCents)}</p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setMethod("apple_pay")}
            className={`rounded-xl border py-3 text-sm font-semibold transition ${
              method === "apple_pay"
                ? "border-white bg-white text-black"
                : "border-white/10 bg-white/5 text-white hover:bg-white/10"
            }`}
          >
             Pay
          </button>
          <button
            onClick={() => setMethod("card")}
            className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition ${
              method === "card"
                ? "border-indigo-400 bg-indigo-500/20 text-indigo-100"
                : "border-white/10 bg-white/5 text-white hover:bg-white/10"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Card
          </button>
        </div>

        {method === "card" && (
          <div className="mb-4 space-y-3">
            <Input placeholder="1234 5678 9012 3456" maxLength={19} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="MM / YY" />
              <Input placeholder="CVC" maxLength={3} />
            </div>
          </div>
        )}

        {method === "apple_pay" && (
          <div className="mb-4 rounded-xl bg-white/5 p-4 text-center text-sm text-slate-400">
            Double-click the side button to pay with Face ID / Touch ID.
          </div>
        )}

        <Button className="w-full" onClick={submit} disabled={loading}>
          {loading ? "Processing…" : `Pay ${formatCents(priceCents)}`}
        </Button>
      </div>
    </div>
  );
}
