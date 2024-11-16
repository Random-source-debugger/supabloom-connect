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
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
                    <Button variant="outline" className="w-full">
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
                        onClick={() => {
                          if (selectedDate) {
                            onReschedule(appointment, selectedDate);
                            setIsDialogOpen(false);
                          }
                        }}
                        disabled={!selectedDate}
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
                onClick={() => onPayment(appointment)}
              >
                Pay Now
              </Button>
            )}
          {userDetails?.role === "customer" &&
            appointment.payment_status === "pending" && (
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => onPaymentConfirmation(appointment, true)}
                >
                  Confirm Successful Meeting
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => onPaymentConfirmation(appointment, false)}
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