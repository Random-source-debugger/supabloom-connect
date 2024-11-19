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
      console.log("Initiating payment for appointment:", appointment.id);
      
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to make payments");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      console.log("Connected to contract at:", CONTRACT_ADDRESS);
      console.log("Agent wallet:", appointment.agent.wallet_id);
      console.log("Payment amount:", appointment.agent.charges);

      const paymentAmount = ethers.parseEther(appointment.agent.charges.toString());
      const tx = await contract.depositPayment(
        appointment.agent.wallet_id,
        { value: paymentAmount }
      );
      
      console.log("Payment transaction initiated:", tx.hash);
      const receipt = await tx.wait();
      console.log("Payment confirmed:", receipt.hash);

      const { error: dbError } = await supabase
        .from("appointments")
        .update({ payment_status: "pending" })
        .eq("id", appointment.id);

      if (dbError) throw dbError;

      const { error: escrowError } = await supabase
        .from("escrow_payments")
        .insert({
          appointment_id: appointment.id,
          amount: appointment.agent.charges,
          status: "pending",
          transaction_hash: receipt.hash
        });

      if (escrowError) throw escrowError;

      await onPayment(appointment);
      toast({
        title: "Payment processed successfully",
        description: "Your payment is now in escrow",
      });
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Failed to process payment",
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
      Pay Now
    </Button>
  );
};