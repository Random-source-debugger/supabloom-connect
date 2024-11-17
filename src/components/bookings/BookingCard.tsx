import { useAuth } from "@/hooks/useAuth";
import { Appointment } from "@/types/bookings";
import BookingDetails from "./BookingDetails";
import BookingActions from "./BookingActions";

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

  return (
    <div className="border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <BookingDetails
          fullName={
            userDetails?.role === "customer"
              ? appointment.agent?.full_name
              : appointment.customer?.full_name
          }
          date={appointment.requested_date}
          time={appointment.requested_time}
          status={appointment.status}
          paymentStatus={appointment.payment_status}
        />
        <BookingActions
          appointment={appointment}
          userRole={userDetails?.role}
          onReschedule={onReschedule}
          onCancel={onCancel}
          onPayment={onPayment}
          onPaymentConfirmation={onPaymentConfirmation}
        />
      </div>
    </div>
  );
};

export default BookingCard;