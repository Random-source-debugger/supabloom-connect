import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const baseSchema = {
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  region: z.string().min(1, "Region is required"),
  district: z.string().min(1, "District is required"),
  walletId: z.string().min(1, "Wallet ID is required"),
};

const agentSchema = {
  ...baseSchema,
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
};

const customerSchema = baseSchema;

const SignUpForm = ({ role }: { role: "customer" | "agent" }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const formSchema = z.object(role === "agent" ? agentSchema : customerSchema);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      region: "",
      district: "",
      walletId: "",
      ...(role === "agent" && {
        charges: "0.001",
        aboutMe: "",
        workingHours: "9 to 5",
        workingDays: "working days",
      }),
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            region: values.region,
            district: values.district,
            wallet_id: values.walletId,
            ...(role === "agent" && {
              charges: values.charges,
              about_me: values.aboutMe,
              working_hours: values.workingHours,
              working_days: values.workingDays,
            }),
          },
          meta: {
            role,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Please check your email to verify your account.",
      });
      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Region</FormLabel>
              <FormControl>
                <Input placeholder="Enter your region" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="district"
          render={({ field }) => (
            <FormItem>
              <FormLabel>District</FormLabel>
              <FormControl>
                <Input placeholder="Enter your district" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="walletId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wallet ID (MetaMask)</FormLabel>
              <FormControl>
                <Input placeholder="Enter your MetaMask wallet ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {role === "agent" && (
          <>
            <FormField
              control={form.control}
              name="charges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Charges (ETH)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      placeholder="Enter your charges in ETH"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aboutMe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About Me</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="workingHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Working Hours</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select working hours" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="9 to 5">9 to 5</SelectItem>
                      <SelectItem value="flexible hours">
                        Flexible Hours
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="workingDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Working Days</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select working days" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="working days">Working Days</SelectItem>
                      <SelectItem value="weekends">Weekends</SelectItem>
                      <SelectItem value="full week">Full Week</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing up..." : "Sign Up"}
        </Button>
      </form>
    </Form>
  );
};

export default SignUpForm;