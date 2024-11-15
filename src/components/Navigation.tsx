import { useNavigate, Outlet, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Home, Calendar, User, LogOut } from "lucide-react";

const Navigation = () => {
  const navigate = useNavigate();
  const { signOut, user, userDetails } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen">
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {userDetails?.role === "customer" && (
                <Link
                  to="/"
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-900"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Home
                </Link>
              )}
              <Link
                to="/bookings"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-900"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Bookings
              </Link>
              <Link
                to="/profile"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-900"
              >
                <User className="h-5 w-5 mr-2" />
                Profile
              </Link>
            </div>
            <div className="flex items-center">
              <Button
                variant="ghost"
                className="flex items-center"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Navigation;