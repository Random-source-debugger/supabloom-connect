import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Agent } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/integrations/ethereum/contract";

interface BookingFormProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
  userDetails: any;
}

const BookingForm = ({ agent, isOpen, onClose, userDetails }: BookingFormProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const { toast } = useToast();
  
  const handleBooking = async () => {
    if (!selectedDate) {
      toast({
        title: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Initiating booking with payment for agent:", agent.id);
      
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to make bookings");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      console.log("Connected to contract at:", CONTRACT_ADDRESS);
      console.log("Agent wallet:", agent.wallet_id);
      console.log("Payment amount:", agent.charges);

      const paymentAmount = ethers.parseEther(agent.charges.toString());
      const tx = await contract.depositPayment(
        agent.wallet_id,
        { value: paymentAmount }
      );
      
      console.log("Payment transaction initiated:", tx.hash);
      const receipt = await tx.wait();
      console.log("Payment confirmed:", receipt.hash);

      // First create the appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          agent_id: agent.id,
          customer_id: userDetails?.id,
          requested_date: selectedDate.toISOString().split("T")[0],
          requested_time: "09:00:00",
          status: "pending",
          payment_status: "pending"
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Then create the escrow payment record
      const { error: escrowError } = await supabase
        .from("escrow_payments")
        .insert({
          appointment_id: appointment.id,
          amount: agent.charges,
          status: "pending",
          transaction_hash: receipt.hash
        });

      if (escrowError) throw escrowError;

      toast({
        title: "Booking confirmed",
        description: "Your payment is now in escrow",
      });
      onClose();
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Failed to process booking",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book Appointment with {agent.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border mx-auto"
          />
          <Button
            className="w-full"
            onClick={handleBooking}
            disabled={!selectedDate}
          >
            Confirm Booking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingForm;