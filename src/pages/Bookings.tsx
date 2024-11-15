import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Appointment } from "@/types/bookings";
import BookingCard from "@/components/bookings/BookingCard";

const Bookings = () => {
  const { userDetails } = useAuth();
  const { toast } = useToast();

  const { data: appointments, refetch } = useQuery({
    queryKey: ["appointments", userDetails?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          *,
          agent:users!appointments_agent_id_fkey(*),
          customer:users!appointments_customer_id_fkey(*),
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
      toast({
        title: "Failed to reschedule appointment",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Appointment rescheduled",
    });
    refetch();
  };

  const handleCancel = async (appointment: Appointment) => {
    const { error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
      })
      .eq("id", appointment.id);

    if (error) {
      toast({
        title: "Failed to cancel appointment",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Appointment cancelled",
    });
    refetch();
  };

  const handlePayment = async (appointment: Appointment) => {
    try {
      const response = await supabase.functions.invoke('escrow-payment', {
        body: { appointment_id: appointment.id, action: 'pay' }
      });

      if (response.error) throw new Error(response.error.message);

      toast({
        title: "Payment initiated",
        description: "The payment is now in escrow.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Failed to process payment",
        description: error.message,
        variant: "destructive",
      });
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

      toast({
        title: success ? "Payment completed" : "Payment refunded",
        description: success
          ? "The payment has been released to the agent."
          : "The payment has been refunded to your wallet.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Failed to process payment confirmation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Bookings</h2>
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
    </div>
  );
};

export default Bookings;