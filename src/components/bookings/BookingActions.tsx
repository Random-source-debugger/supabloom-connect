import { Appointment } from "@/types/bookings";
import { RescheduleAction } from "./actions/RescheduleAction";
import { CancelAction } from "./actions/CancelAction";
import { PaymentActions } from "./actions/PaymentActions";

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
  const isBookingActive = appointment.status !== "cancelled" && 
                         appointment.status !== "completed";

  return (
    <div className="space-y-2">
      {isBookingActive && (
        <>
          <RescheduleAction
            appointment={appointment}
            onReschedule={onReschedule}
          />
          <CancelAction
            appointment={appointment}
            onCancel={onCancel}
          />
        </>
      )}
      {userRole === "customer" && isBookingActive && (
        <PaymentActions
          appointment={appointment}
          onPayment={onPayment}
          onPaymentConfirmation={onPaymentConfirmation}
        />
      )}
    </div>
  );
};

export default BookingActions;