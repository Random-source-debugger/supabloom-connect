import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Agent } from "@/types/database";
import AgentCard from "@/components/booking/AgentCard";
import BookingForm from "@/components/booking/BookingForm";

const Home = () => {
  const { userDetails } = useAuth();
  const [workingHours, setWorkingHours] = useState<string>();
  const [workingDays, setWorkingDays] = useState<string>();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const { data: agents, isLoading } = useQuery({
    queryKey: ["agents", workingHours, workingDays],
    queryFn: async () => {
      let query = supabase
        .from("agents")
        .select("*");

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

  if (userDetails?.role !== "customer") {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-gray-500">Access denied. Only customers can view this page.</p>
      </div>
    );
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

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-lg text-gray-500">Loading agents...</p>
        </div>
      ) : agents?.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-lg text-gray-500">
            No agents found matching your criteria. Try adjusting your filters or check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents?.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onBookNow={setSelectedAgent}
            />
          ))}
        </div>
      )}

      {selectedAgent && (
        <BookingForm
          agent={selectedAgent}
          isOpen={!!selectedAgent}
          onClose={() => setSelectedAgent(null)}
          userDetails={userDetails}
        />
      )}
    </div>
  );
};

export default Home;