import { z } from "zod";

const isValidEthereumAddress = (address: string) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const baseSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  region: z.string().min(1, "Region is required"),
  district: z.string().min(1, "District is required"),
  walletId: z.string()
    .min(1, "Wallet ID is required")
    .refine(isValidEthereumAddress, {
      message: "Invalid Ethereum wallet address",
    }),
});

const agentSchema = baseSchema.extend({
  charges: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0.001;
    },
    {
      message: "Charges must be at least 0.001 ETH",
    }
  ),
  aboutMe: z.string().min(10, "About me must be at least 10 characters"),
  workingHours: z.enum(["9 to 5", "flexible hours"]),
  workingDays: z.enum(["working days", "weekends", "full week"]),
});

const customerSchema = baseSchema;

export type CustomerFormData = z.infer<typeof customerSchema>;
export type AgentFormData = z.infer<typeof agentSchema>;
export type FormData = AgentFormData | CustomerFormData;

export { agentSchema, customerSchema };