import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import BaseFields from "./BaseFields";
import AgentFields from "./AgentFields";
import { agentSchema, customerSchema, type FormData, type AgentFormData } from "@/types/auth";

const SignUpForm = ({ role }: { role: "customer" | "agent" }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const formSchema = role === "agent" ? agentSchema : customerSchema;

  const form = useForm<FormData>({
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

  const onSubmit = async (values: FormData) => {
    try {
      setIsLoading(true);
      
      // Create the metadata object
      const metadata = {
        full_name: values.fullName,
        region: values.region,
        district: values.district,
        wallet_id: values.walletId,
        role,
        ...(role === "agent" && {
          charges: (values as AgentFormData).charges,
          about_me: (values as AgentFormData).aboutMe,
          working_hours: (values as AgentFormData).workingHours,
          working_days: (values as AgentFormData).workingDays,
        }),
      };

      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Please check your email to verify your account.",
      });
      
      // Redirect agents to profile page, customers to home page
      navigate(role === "agent" ? "/profile" : "/");
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
        <BaseFields form={form} />
        {role === "agent" && <AgentFields form={form as any} />}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing up..." : "Sign Up"}
        </Button>
      </form>
    </Form>
  );
};

export default SignUpForm;