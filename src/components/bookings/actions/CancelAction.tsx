import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Appointment } from "@/types/bookings";
import { supabase } from "@/integrations/supabase/client";

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
      
      // If there's a pending payment, initiate refund
      if (appointment.payment_status === "pending") {
        console.log("Initiating refund for appointment:", appointment.id);
        const response = await supabase.functions.invoke('escrow-payment', {
          body: { 
            appointment_id: appointment.id, 
            action: 'refund',
            amount: appointment.agent.charges
          }
        });

        if (response.error) throw new Error(response.error.message);
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