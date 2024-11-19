import { Button } from "@/components/ui/button";
import { Agent } from "@/types/database";

interface AgentCardProps {
  agent: Agent;
  onBookNow: (agent: Agent) => void;
}

const AgentCard = ({ agent, onBookNow }: AgentCardProps) => {
  return (
    <div className="border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold">{agent.full_name}</h3>
      <div className="space-y-2 text-sm text-gray-600">
        <p>Region: {agent.region}</p>
        <p>District: {agent.district}</p>
        <p>Charges: {agent.charges} ETH</p>
        <p>Working Hours: {agent.working_hours}</p>
        <p>Working Days: {agent.working_days}</p>
        <p className="text-gray-700">{agent.about_me}</p>
      </div>
      <Button 
        className="w-full"
        onClick={() => onBookNow(agent)}
      >
        Book Now
      </Button>
    </div>
  );
};

export default AgentCard;