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
    const { error } = await supabase.from("escrow_payments").insert({
      appointment_id: appointment.id,
      amount: appointment.agent.charges,
    });

    if (error) {
      toast({
        title: "Failed to process payment",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        payment_status: "pending",
      })
      .eq("id", appointment.id);

    if (updateError) {
      toast({
        title: "Failed to update payment status",
        description: updateError.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Payment initiated",
      description: "The payment is now in escrow.",
    });
    refetch();
  };

  const handlePaymentConfirmation = async (
    appointment: Appointment,
    success: boolean
  ) => {
    const { error } = await supabase
      .from("escrow_payments")
      .update({
        status: success ? "completed" : "refunded",
        released_at: new Date().toISOString(),
      })
      .eq("appointment_id", appointment.id);

    if (error) {
      toast({
        title: "Failed to process payment confirmation",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        payment_status: success ? "paid" : "refunded",
        status: success ? "completed" : "unsuccessful",
      })
      .eq("id", appointment.id);

    if (updateError) {
      toast({
        title: "Failed to update appointment status",
        description: updateError.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: success ? "Payment completed" : "Payment refunded",
      description: success
        ? "The payment has been released to the agent."
        : "The payment has been refunded to your wallet.",
    });
    refetch();
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