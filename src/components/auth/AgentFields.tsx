import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { AgentFormData } from "@/types/auth";

interface AgentFieldsProps {
  form: UseFormReturn<AgentFormData>;
}

const AgentFields = ({ form }: AgentFieldsProps) => {
  return (
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
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select working hours" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="9 to 5">9 to 5</SelectItem>
                <SelectItem value="flexible hours">Flexible Hours</SelectItem>
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
            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
  );
};

export default AgentFields;