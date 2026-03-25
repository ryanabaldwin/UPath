import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCircle } from "lucide-react";
import { toast } from "sonner";

import { useDemoIdentity } from "@/contexts/DemoIdentityContext";
import { patchUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const GRADE_LEVELS = [
  "Middle School",
  "9th Grade",
  "10th Grade",
  "11th Grade",
  "12th Grade",
  "College Freshman",
  "College Sophomore",
  "College Junior",
  "College Senior",
  "Graduate Student",
  "Recent Graduate",
  "Other",
];

const profileSchema = z.object({
  user_first: z.string().min(1, "First name is required"),
  user_last: z.string().min(1, "Last name is required"),
  user_region: z.string().optional(),
  user_img_src: z
    .string()
    .refine((v) => !v || v.startsWith("http"), { message: "Must be a valid URL" })
    .optional(),
  north_star_vision: z.string().optional(),
  definition_of_success: z.string().optional(),
  current_grade_level: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const EditProfile = () => {
  const { user, userId, refetchUsers } = useDemoIdentity();
  const queryClient = useQueryClient();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      user_first: "",
      user_last: "",
      user_region: "",
      user_img_src: "",
      north_star_vision: "",
      definition_of_success: "",
      current_grade_level: "",
    },
  });

  // Populate form when user data arrives or the selected profile changes
  useEffect(() => {
    if (user) {
      form.reset({
        user_first: user.user_first,
        user_last: user.user_last,
        user_region: user.user_region ?? "",
        user_img_src: user.user_img_src ?? "",
        north_star_vision: user.north_star_vision ?? "",
        definition_of_success: user.definition_of_success ?? "",
        current_grade_level: user.current_grade_level ?? "",
      });
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: (data: ProfileFormValues) =>
      patchUser(userId!, {
        ...data,
        // Convert empty strings back to null for optional fields
        user_region: data.user_region || null,
        user_img_src: data.user_img_src || null,
        north_star_vision: data.north_star_vision || null,
        definition_of_success: data.definition_of_success || null,
        current_grade_level: data.current_grade_level || null,
      }),
    onSuccess: () => {
      toast.success("Profile updated");
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
    onError: () => {
      toast.error("Failed to save changes. Please try again.");
    },
  });

  if (!userId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>
        <p className="text-muted-foreground">
          Select a profile to edit.
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <UserCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>
          <p className="text-sm text-muted-foreground">
            Update your personal information and goals.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className="space-y-6"
        >
          {/* ── Basic Information ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="user_first"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="user_last"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="user_region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Los Angeles, CA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="current_grade_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade / Education Level</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GRADE_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="user_img_src"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ── Vision ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your Vision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="north_star_vision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Long-Term Vision</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Where do you see yourself in 5–10 years?"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="definition_of_success"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Definition of Success</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What does success look like to you?"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full rounded-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default EditProfile;
