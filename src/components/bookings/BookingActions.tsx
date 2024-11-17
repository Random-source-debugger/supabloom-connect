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

  return (
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
              onClick={() => onCancel(appointment)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </>
        )}
      {userRole === "customer" &&
        appointment.status !== "cancelled" &&
        appointment.status !== "completed" &&
        appointment.payment_status === "unpaid" && (
          <Button
            className="w-full"
            onClick={() => onPayment(appointment)}
            disabled={isLoading}
          >
            Pay Now
          </Button>
        )}
      {userRole === "customer" &&
        appointment.payment_status === "pending" && (
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => onPaymentConfirmation(appointment, true)}
              disabled={isLoading}
            >
              Confirm Successful Meeting
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => onPaymentConfirmation(appointment, false)}
              disabled={isLoading}
            >
              Report Unsuccessful Meeting
            </Button>
          </div>
        )}
    </div>
  );
};

export default BookingActions;