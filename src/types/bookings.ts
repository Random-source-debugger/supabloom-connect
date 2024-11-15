import { Tables } from "@/integrations/supabase/types";

export type Appointment = {
  id: string;
  agent_id: string | null;
  customer_id: string | null;
  requested_date: string;
  requested_time: string;
  status: string | null;
  created_at: string;
  payment_status: string | null;
  agent: Tables<"users">;
  customer: Tables<"users">;
  escrow_payment?: Tables<"escrow_payments">;
};