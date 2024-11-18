import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Appointment } from "@/types/bookings";
import { supabase } from "@/integrations/supabase/client";

interface BookingActionsProps {
  appointment: Appointment;
  userRole: string;
  onReschedule: (appointment: Appointment, date: Date) => Promise<void>;
  onCancel: (appointment: Appointment) => Promise<void>;
  onPayment: (appointment: Appointment) => Promise<void>;
  onPaymentConfirmation: (appointment: Appointment, success: boolean) => Promise<void>;
}

const BookingActions = ({
  appointment,
  userRole,
  onReschedule,
  onCancel,
  onPayment,
  onPaymentConfirmation,
}: BookingActionsProps) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleReschedule = async () => {
    if (!selectedDate) {
      toast({
        title: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Update appointment in database
      const { error } = await supabase
        .from("appointments")
        .update({
          requested_date: selectedDate.toISOString().split("T")[0],
          status: "rescheduled",
        })
        .eq("id", appointment.id);

      if (error) throw error;

      await onReschedule(appointment, selectedDate);
      setIsDialogOpen(false);
      toast({
        title: "Appointment rescheduled successfully",
      });
    } catch (error) {
      console.error("Reschedule error:", error);
      toast({
        title: "Failed to reschedule appointment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      // If there's a pending payment, initiate refund
      if (appointment.payment_status === "pending") {
        const response = await supabase.functions.invoke('smart-contract', {
          body: { appointment_id: appointment.id, action: 'refund' }
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

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('smart-contract', {
        body: { appointment_id: appointment.id, action: 'deposit' }
      });

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
      const response = await supabase.functions.invoke('smart-contract', {
        body: {
          appointment_id: appointment.id,
          action: success ? 'release' : 'refund'
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

  const isBookingActive = appointment.status !== "cancelled" && 
                         appointment.status !== "completed";

  return (
    <div className="space-y-2">
      {isBookingActive && (
        <>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" disabled={isLoading}>
                Reschedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reschedule Appointment</DialogTitle>
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
                  onClick={handleReschedule}
                  disabled={!selectedDate || isLoading}
                >
                  Confirm Reschedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </>
      )}
      {userRole === "customer" && isBookingActive && (
        <>
          {appointment.payment_status === "unpaid" && (
            <Button
              className="w-full"
              onClick={handlePayment}
              disabled={isLoading}
            >
              Pay Now
            </Button>
          )}
          {appointment.payment_status === "pending" && (
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
          )}
        </>
      )}
    </div>
  );
};

export default BookingActions;