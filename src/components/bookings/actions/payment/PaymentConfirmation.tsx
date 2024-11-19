import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Appointment } from "@/types/bookings";
import { supabase } from "@/integrations/supabase/client";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/integrations/ethereum/contract";

interface PaymentConfirmationProps {
  appointment: Appointment;
  onPaymentConfirmation: (appointment: Appointment, success: boolean) => Promise<void>;
}

export const PaymentConfirmation = ({ 
  appointment, 
  onPaymentConfirmation 
}: PaymentConfirmationProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handlePaymentConfirmation = async (success: boolean) => {
    setIsLoading(true);
    try {
      console.log("Processing payment confirmation:", success, "for appointment:", appointment.id);
      
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to confirm payments");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const { data: escrowPayment } = await supabase
        .from("escrow_payments")
        .select("*")
        .eq("appointment_id", appointment.id)
        .single();

      if (!escrowPayment) {
        throw new Error("No escrow payment found for this appointment");
      }

      const tx = await contract[success ? "releasePayment" : "refundPayment"](
        escrowPayment.id
      );
      
      console.log("Confirmation transaction initiated:", tx.hash);
      const receipt = await tx.wait();
      console.log("Confirmation transaction completed:", receipt.hash);

      const updates = {
        payment_status: success ? "paid" : "refunded",
        status: success ? "completed" : "cancelled"
      };

      const { error: appointmentError } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", appointment.id);

      if (appointmentError) throw appointmentError;

      const { error: escrowError } = await supabase
        .from("escrow_payments")
        .update({
          status: success ? "released" : "refunded",
          released_at: new Date().toISOString()
        })
        .eq("id", escrowPayment.id);

      if (escrowError) throw escrowError;

      await onPaymentConfirmation(appointment, success);
      toast({
        title: success ? "Payment released to agent" : "Payment refunded",
      });
    } catch (error) {
      console.error("Payment confirmation error:", error);
      toast({
        title: "Failed to process payment confirmation",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        onClick={() => handlePaymentConfirmation(true)}
        disabled={isLoading}
      >
        Confirm Successful Meeting
      </Button>
      <Button
        variant="destructive"
        className="w-full"
        onClick={() => handlePaymentConfirmation(false)}
        disabled={isLoading}
      >
        Report Unsuccessful Meeting
      </Button>
    </div>
  );
};