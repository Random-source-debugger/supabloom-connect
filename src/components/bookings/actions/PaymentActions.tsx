import { Appointment } from "@/types/bookings";
import { PaymentButton } from "./payment/PaymentButton";
import { PaymentConfirmation } from "./payment/PaymentConfirmation";

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
  if (appointment.payment_status === "unpaid") {
    return (
      <PaymentButton
        appointment={appointment}
        onPayment={onPayment}
      />
    );
  }

  if (appointment.payment_status === "pending") {
    return (
      <PaymentConfirmation
        appointment={appointment}
        onPaymentConfirmation={onPaymentConfirmation}
      />
    );
  }

  return null;
};