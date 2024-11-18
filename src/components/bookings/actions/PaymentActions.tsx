import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Appointment } from "@/types/bookings";
import { supabase } from "@/integrations/supabase/client";

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
      console.log("Processing payment for appointment:", appointment.id);
      
      const response = await supabase.functions.invoke('escrow-payment', {
        body: { 
          appointment_id: appointment.id, 
          action: 'pay',
          amount: appointment.agent.charges
        }
      });

      console.log("Payment response:", response);

      if (response.error) throw new Error(response.error.message);

      await onPayment(appointment);
      toast({
        title: "Payment processed successfully",
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
      
      const response = await supabase.functions.invoke('escrow-payment', {
        body: {
          appointment_id: appointment.id,
          action: success ? 'complete' : 'refund',
          amount: appointment.agent.charges
        }
      });

      if (response.error) throw new Error(response.error.message);

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