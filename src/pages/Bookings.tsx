import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Appointment } from "@/types/bookings";
import BookingCard from "@/components/bookings/BookingCard";

const Bookings = () => {
  const { userDetails } = useAuth();
  const { toast } = useToast();

  const { data: appointments, refetch, isLoading } = useQuery({
    queryKey: ["appointments", userDetails?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          *,
          agent:agents(*),
          customer:customers(*),
          escrow_payment:escrow_payments(*)
        `
        )
        .or(
          `agent_id.eq.${userDetails?.id},customer_id.eq.${userDetails?.id}`
        );

      if (error) throw error;
      return data as unknown as Appointment[];
    },
  });

  const handleReschedule = async (appointment: Appointment, date: Date) => {
    const { error } = await supabase
      .from("appointments")
      .update({
        requested_date: date.toISOString().split("T")[0],
      })
      .eq("id", appointment.id);

    if (error) {
      throw new Error(error.message);
    }

    refetch();
  };

  const handleCancel = async (appointment: Appointment) => {
    // If there's a pending payment, initiate refund
    if (appointment.payment_status === "pending") {
      try {
        const response = await supabase.functions.invoke('escrow-payment', {
          body: { appointment_id: appointment.id, action: 'refund' }
        });

        if (response.error) throw new Error(response.error.message);
      } catch (error) {
        throw new Error(`Failed to process refund: ${error.message}`);
      }
    } else {
      // If no payment is involved, just cancel the appointment
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "cancelled",
        })
        .eq("id", appointment.id);

      if (error) {
        throw new Error(error.message);
      }
    }

    refetch();
  };

  const handlePayment = async (appointment: Appointment) => {
    try {
      const response = await supabase.functions.invoke('escrow-payment', {
        body: { appointment_id: appointment.id, action: 'pay' }
      });

      if (response.error) throw new Error(response.error.message);

      refetch();
    } catch (error) {
      throw new Error(`Failed to process payment: ${error.message}`);
    }
  };

  const handlePaymentConfirmation = async (
    appointment: Appointment,
    success: boolean
  ) => {
    try {
      const response = await supabase.functions.invoke('escrow-payment', {
        body: {
          appointment_id: appointment.id,
          action: success ? 'complete' : 'refund'
        }
      });

      if (response.error) throw new Error(response.error.message);

      refetch();
    } catch (error) {
      throw new Error(`Failed to process payment confirmation: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Bookings</h2>
      {isLoading ? (
        <div className="text-center py-8">Loading bookings...</div>
      ) : appointments?.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No bookings found. {userDetails?.role === "customer" 
            ? "Book an appointment with an agent to get started!" 
            : "You haven't received any booking requests yet."}
        </div>
      ) : (
        <div className="grid gap-6">
          {appointments?.map((appointment) => (
            <BookingCard
              key={appointment.id}
              appointment={appointment}
              onReschedule={handleReschedule}
              onCancel={handleCancel}
              onPayment={handlePayment}
              onPaymentConfirmation={handlePaymentConfirmation}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookings;