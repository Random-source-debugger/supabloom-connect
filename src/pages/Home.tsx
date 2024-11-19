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
import { useToast } from "@/hooks/use-toast";
import { Agent } from "@/types/database";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/integrations/ethereum/contract";

const Home = () => {
  const { userDetails } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();
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

  const handleBooking = async (agent: Agent) => {
    if (!selectedDate) {
      toast({
        title: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Initiating booking with payment for agent:", agent.id);
      
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to make bookings");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      console.log("Connected to contract at:", CONTRACT_ADDRESS);
      console.log("Agent wallet:", agent.wallet_id);
      console.log("Payment amount:", agent.charges);

      const paymentAmount = ethers.parseEther(agent.charges.toString());
      const tx = await contract.depositPayment(
        agent.wallet_id,
        { value: paymentAmount }
      );
      
      console.log("Payment transaction initiated:", tx.hash);
      const receipt = await tx.wait();
      console.log("Payment confirmed:", receipt.hash);

      // First create the appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          agent_id: agent.id,
          customer_id: userDetails?.id,
          requested_date: selectedDate.toISOString().split("T")[0],
          requested_time: "09:00:00",
          status: "pending",
          payment_status: "pending" // Explicitly set the payment status
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Then create the escrow payment record
      const { error: escrowError } = await supabase
        .from("escrow_payments")
        .insert({
          appointment_id: appointment.id,
          amount: agent.charges,
          status: "pending",
          transaction_hash: receipt.hash
        });

      if (escrowError) throw escrowError;

      toast({
        title: "Booking confirmed",
        description: "Your payment is now in escrow",
      });
      setSelectedAgent(null);
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Failed to process booking",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
      )}
    </div>
  );
};

export default Home;