import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type Agent = Tables<"users">;

const Home = () => {
  const { userDetails } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [workingHours, setWorkingHours] = useState<string>();
  const [workingDays, setWorkingDays] = useState<string>();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const { data: agents } = useQuery({
    queryKey: ["agents", workingHours, workingDays],
    queryFn: async () => {
      let query = supabase
        .from("users")
        .select("*")
        .eq("role", "agent");

      if (workingHours) {
        query = query.eq("working_hours", workingHours);
      }
      if (workingDays) {
        query = query.eq("working_days", workingDays);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Agent[];
    },
  });

  const handleBooking = async (agent: Agent) => {
    if (!selectedDate) {
      toast({
        title: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("appointments").insert({
      agent_id: agent.id,
      customer_id: userDetails?.id,
      requested_date: selectedDate.toISOString().split("T")[0],
      requested_time: "09:00:00",
    });

    if (error) {
      toast({
        title: "Failed to book appointment",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Booking request sent",
      description: "The agent will be notified of your request.",
    });
    setSelectedAgent(null);
  };

  if (userDetails?.role !== "customer") {
    return <div>Access denied. Only customers can view this page.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Select onValueChange={setWorkingHours}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Working Hours" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="9 to 5">9 to 5</SelectItem>
            <SelectItem value="flexible hours">Flexible Hours</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={setWorkingDays}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Working Days" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="working days">Working Days</SelectItem>
            <SelectItem value="weekends">Weekends</SelectItem>
            <SelectItem value="full week">Full Week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents?.map((agent) => (
          <div
            key={agent.id}
            className="border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold">{agent.full_name}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Region: {agent.region}</p>
              <p>District: {agent.district}</p>
              <p>Charges: {agent.charges} ETH</p>
              <p>Working Hours: {agent.working_hours}</p>
              <p>Working Days: {agent.working_days}</p>
              <p className="text-gray-700">{agent.about_me}</p>
            </div>
            <Dialog
              open={selectedAgent?.id === agent.id}
              onOpenChange={(open) => {
                if (!open) setSelectedAgent(null);
                else setSelectedAgent(agent);
              }}
            >
              <DialogTrigger asChild>
                <Button className="w-full">Book Now</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Book Appointment with {agent.full_name}</DialogTitle>
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
                    onClick={() => handleBooking(agent)}
                    disabled={!selectedDate}
                  >
                    Confirm Booking
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;