export interface BaseUser {
  id: string;
  full_name: string;
  region: string;
  district: string;
  wallet_id: string;
  created_at: string;
}

export interface Customer extends BaseUser {}

export interface Agent extends BaseUser {
  charges: number;
  about_me: string | null;
  working_hours: string | null;
  working_days: string | null;
}