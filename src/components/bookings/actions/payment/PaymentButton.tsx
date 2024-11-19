import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Appointment } from "@/types/bookings";
import { supabase } from "@/integrations/supabase/client";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/integrations/ethereum/contract";

interface PaymentButtonProps {
  appointment: Appointment;
  onPayment: (appointment: Appointment) => Promise<void>;
}

export const PaymentButton = ({ appointment, onPayment }: PaymentButtonProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      console.log("Releasing payment for appointment:", appointment.id);
      
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to make payments");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.releasePayment(appointment.id);
      console.log("Release payment transaction initiated:", tx.hash);
      const receipt = await tx.wait();
      console.log("Payment release confirmed:", receipt.hash);

      const { error: dbError } = await supabase
        .from("appointments")
        .update({ 
          payment_status: "paid",
          status: "completed"
        })
        .eq("id", appointment.id);

      if (dbError) throw dbError;

      const { error: escrowError } = await supabase
        .from("escrow_payments")
        .update({
          status: "released",
          released_at: new Date().toISOString()
        })
        .eq("appointment_id", appointment.id);

      if (escrowError) throw escrowError;

      await onPayment(appointment);
      toast({
        title: "Payment released successfully",
        description: "The payment has been sent to the agent",
      });
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Failed to release payment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      className="w-full"
      onClick={handlePayment}
      disabled={isLoading}
    >
      Release Payment
    </Button>
  );
};