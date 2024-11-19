import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Appointment } from "@/types/bookings";
import { supabase } from "@/integrations/supabase/client";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/integrations/ethereum/contract";

interface PaymentActionsProps {
  appointment: Appointment;
  onPayment: (appointment: Appointment) => Promise<void>;
  onPaymentConfirmation: (appointment: Appointment, success: boolean) => Promise<void>;
}

export const PaymentActions = ({
  appointment,
  onPayment,
  onPaymentConfirmation,
}: PaymentActionsProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      console.log("Initiating payment for appointment:", appointment.id);
      
      // Connect to MetaMask
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to make payments");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Initialize contract
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      console.log("Connected to contract at:", CONTRACT_ADDRESS);
      console.log("Agent wallet:", appointment.agent.wallet_id);
      console.log("Payment amount:", appointment.agent.charges);

      // Convert charges to Wei (ETH's smallest unit)
      const paymentAmount = ethers.parseEther(appointment.agent.charges.toString());

      // Make payment through smart contract
      const tx = await contract.depositPayment(
        appointment.agent.wallet_id,
        { value: paymentAmount }
      );
      
      console.log("Payment transaction initiated:", tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log("Payment confirmed:", receipt.hash);

      // Update payment status in database
      const { error: dbError } = await supabase
        .from("appointments")
        .update({ payment_status: "pending" })
        .eq("id", appointment.id);

      if (dbError) throw dbError;

      // Record escrow payment
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

      // Get escrow payment details
      const { data: escrowPayment } = await supabase
        .from("escrow_payments")
        .select("*")
        .eq("appointment_id", appointment.id)
        .single();

      if (!escrowPayment) {
        throw new Error("No escrow payment found for this appointment");
      }

      // Call appropriate smart contract function
      const tx = await contract[success ? "releasePayment" : "refundPayment"](
        escrowPayment.id
      );
      
      console.log("Confirmation transaction initiated:", tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log("Confirmation transaction completed:", receipt.hash);

      // Update database records
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

  if (appointment.payment_status === "unpaid") {
    return (
      <Button
        className="w-full"
        onClick={handlePayment}
        disabled={isLoading}
      >
        Pay Now
      </Button>
    );
  }

  if (appointment.payment_status === "pending") {
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
  }

  return null;
};