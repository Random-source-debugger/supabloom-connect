import { format } from "date-fns";

interface BookingDetailsProps {
  fullName: string;
  date: string;
  time: string;
  status: string;
  paymentStatus: string;
}

const BookingDetails = ({
  fullName,
  date,
  time,
  status,
  paymentStatus,
}: BookingDetailsProps) => {
  return (
    <div>
      <h3 className="text-xl font-semibold">
        Appointment with {fullName}
      </h3>
      <p className="text-gray-600">
        Date: {format(new Date(date), "PPP")}
      </p>
      <p className="text-gray-600">Time: {time}</p>
      <p className="text-gray-600">Status: {status}</p>
      <p className="text-gray-600">
        Payment Status: {paymentStatus}
      </p>
    </div>
  );
};

export default BookingDetails;