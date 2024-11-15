import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { useToast } from "@/components/ui/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";

type Appointment = Tables<"appointments"> & {
  agent: Tables<"users">;
  customer: Tables<"users">;
  escrow_payment?: Tables<"escrow_payments">;
};

const Bookings = () => {
  const { userDetails } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const { data: appointments, refetch } = useQuery({
    queryKey: ["appointments", userDetails?.id],
    queryFn: async () => {
      const query = supabase
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

      const { data, error } = await query;
      if (error) throw error;
      return data as Appointment[];
    },
  });

  const handleReschedule = async (appointment: Appointment) => {
    if (!selectedDate) {
      toast({
        title: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("appointments")
      .update({
        requested_date: selectedDate.toISOString().split("T")[0],
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
    setSelectedAppointment(null);
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
          <div
            key={appointment.id}
            className="border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold">
                  Appointment with{" "}
                  {userDetails?.role === "customer"
                    ? appointment.agent.full_name
                    : appointment.customer.full_name}
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
                      <Dialog
                        open={selectedAppointment?.id === appointment.id}
                        onOpenChange={(open) => {
                          if (!open) setSelectedAppointment(null);
                          else setSelectedAppointment(appointment);
                        }}
                      >
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
                              onClick={() => handleReschedule(appointment)}
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
                        onClick={() => handleCancel(appointment)}
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
                      onClick={() => handlePayment(appointment)}
                    >
                      Pay Now
                    </Button>
                  )}
                {userDetails?.role === "customer" &&
                  appointment.payment_status === "pending" && (
                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        onClick={() =>
                          handlePaymentConfirmation(appointment, true)
                        }
                      >
                        Confirm Successful Meeting
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() =>
                          handlePaymentConfirmation(appointment, false)
                        }
                      >
                        Report Unsuccessful Meeting
                      </Button>
                    </div>
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Bookings;