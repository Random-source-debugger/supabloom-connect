import { useAuth } from "@/hooks/useAuth";

const Profile = () => {
  const { userDetails } = useAuth();

  if (!userDetails) return null;

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
        {userDetails.role === "agent" && (
          <>
            <div>
              <label className="text-sm font-medium text-gray-500">Charges</label>
              <p className="mt-1">{userDetails.charges} ETH</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">About Me</label>
              <p className="mt-1">{userDetails.about_me}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Working Hours
              </label>
              <p className="mt-1">{userDetails.working_hours}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Working Days
              </label>
              <p className="mt-1">{userDetails.working_days}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;