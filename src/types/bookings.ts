import { Tables } from "@/integrations/supabase/types";
import { Agent, Customer } from "./database";

export type Appointment = {
  id: string;
  agent_id: string | null;
  customer_id: string | null;
  requested_date: string;
  requested_time: string;
  status: string | null;
  created_at: string;
  payment_status: string | null;
  agent: Agent;
  customer: Customer;
  escrow_payment?: Tables<"escrow_payments">;
};