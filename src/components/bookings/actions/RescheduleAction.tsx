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
import { supabase } from "@/integrations/supabase/client";

interface RescheduleActionProps {
  appointment: Appointment;
  onReschedule: (appointment: Appointment, date: Date) => Promise<void>;
}

export const RescheduleAction = ({ appointment, onReschedule }: RescheduleActionProps) => {
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
      console.log("Rescheduling appointment:", appointment.id, "to date:", selectedDate);
      
      const { error } = await supabase
        .from("appointments")
        .update({
          requested_date: selectedDate.toISOString().split("T")[0],
          status: "rescheduled",
        })
        .eq("id", appointment.id);

      if (error) throw error;

      await onReschedule(appointment, selectedDate);
      setIsDialogOpen(false);
      toast({
        title: "Appointment rescheduled successfully",
      });
    } catch (error) {
      console.error("Reschedule error:", error);
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
  );
};