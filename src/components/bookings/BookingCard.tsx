import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Appointment } from "@/types/bookings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BookingCardProps {
  appointment: Appointment;
  onReschedule: (appointment: Appointment, date: Date) => Promise<void>;
  onCancel: (appointment: Appointment) => Promise<void>;
  onPayment: (appointment: Appointment) => Promise<void>;
  onPaymentConfirmation: (appointment: Appointment, success: boolean) => Promise<void>;
}

const BookingCard = ({
  appointment,
  onReschedule,
  onCancel,
  onPayment,
  onPaymentConfirmation,
}: BookingCardProps) => {
  const { userDetails } = useAuth();
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
      await onReschedule(appointment, selectedDate);
      setIsDialogOpen(false);
      toast({
        title: "Appointment rescheduled successfully",
      });
    } catch (error) {
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
      await onCancel(appointment);
      toast({
        title: "Appointment cancelled successfully",
      });
    } catch (error) {
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
      await onPayment(appointment);
      toast({
        title: "Payment initiated",
        description: "The payment is now in escrow.",
      });
    } catch (error) {
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
      await onPaymentConfirmation(appointment, success);
      toast({
        title: success ? "Payment completed" : "Payment refunded",
        description: success
          ? "The payment has been released to the agent."
          : "The payment has been refunded to your wallet.",
      });
    } catch (error) {
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
    <div className="border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold">
            Appointment with{" "}
            {userDetails?.role === "customer"
              ? appointment.agent?.full_name
              : appointment.customer?.full_name}
          </h3>
          <p className="text-gray-600">
            Date: {format(new Date(appointment.requested_date), "PPP")}
          </p>
          <p className="text-gray-600">Time: {appointment.requested_time}</p>
          <p className="text-gray-600">Status: {appointment.status}</p>
          <p className="text-gray-600">
            Payment Status: {appointment.payment_status}
          </p>
        </div>
        <div className="space-y-2">
          {appointment.status !== "cancelled" &&
            appointment.status !== "completed" && (
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
          {userDetails?.role === "customer" &&
            appointment.status !== "cancelled" &&
            appointment.status !== "completed" &&
            appointment.payment_status === "unpaid" && (
              <Button
                className="w-full"
                onClick={handlePayment}
                disabled={isLoading}
              >
                Pay Now
              </Button>
            )}
          {userDetails?.role === "customer" &&
            appointment.payment_status === "pending" && (
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
        </div>
      </div>
    </div>
  );
};

export default BookingCard;