import { useAuth } from "@/hooks/useAuth";
import { Agent } from "@/types/database";

const Profile = () => {
  const { userDetails } = useAuth();

  if (!userDetails) return null;

  const isAgent = userDetails.role === "agent";
  const agentDetails = isAgent ? (userDetails as Agent) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">My Profile</h2>
      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Full Name</label>
          <p className="mt-1">{userDetails.full_name}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Role</label>
          <p className="mt-1 capitalize">{userDetails.role}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Region</label>
          <p className="mt-1">{userDetails.region}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">District</label>
          <p className="mt-1">{userDetails.district}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Wallet ID</label>
          <p className="mt-1 break-all">{userDetails.wallet_id}</p>
        </div>
        {isAgent && agentDetails && (
          <>
            <div>
              <label className="text-sm font-medium text-gray-500">Charges</label>
              <p className="mt-1">{agentDetails.charges} ETH</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">About Me</label>
              <p className="mt-1">{agentDetails.about_me}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Working Hours
              </label>
              <p className="mt-1">{agentDetails.working_hours}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Working Days
              </label>
              <p className="mt-1">{agentDetails.working_days}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;