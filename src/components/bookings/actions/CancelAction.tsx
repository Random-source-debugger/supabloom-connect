import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Appointment } from "@/types/bookings";
import { supabase } from "@/integrations/supabase/client";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/integrations/ethereum/contract";

interface CancelActionProps {
  appointment: Appointment;
  onCancel: (appointment: Appointment) => Promise<void>;
}

export const CancelAction = ({ appointment, onCancel }: CancelActionProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      console.log("Cancelling appointment:", appointment.id);
      
      // If there's a pending payment in escrow, initiate refund
      if (appointment.payment_status === "pending") {
        if (!window.ethereum) {
          throw new Error("Please install MetaMask to process refund");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        const tx = await contract.refundPayment(appointment.id);
        console.log("Refund transaction initiated:", tx.hash);
        const receipt = await tx.wait();
        console.log("Refund confirmed:", receipt.hash);

        // Update escrow payment record
        const { error: escrowError } = await supabase
          .from("escrow_payments")
          .update({
            status: "refunded",
            released_at: new Date().toISOString()
          })
          .eq("appointment_id", appointment.id);

        if (escrowError) throw escrowError;
      }

      // Update appointment status
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "cancelled",
          payment_status: appointment.payment_status === "pending" ? "refunded" : "cancelled"
        })
        .eq("id", appointment.id);

      if (error) throw error;

      await onCancel(appointment);
      toast({
        title: "Appointment cancelled successfully",
        description: appointment.payment_status === "pending" ? "Your payment has been refunded" : undefined,
      });
    } catch (error) {
      console.error("Cancel error:", error);
      toast({
        title: "Failed to cancel appointment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="destructive"
      className="w-full"
      onClick={handleCancel}
      disabled={isLoading}
    >
      Cancel
    </Button>
  );
};