import { redirect } from "next/navigation";

interface ResetPasswordPageProps {
  searchParams: { token?: string };
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = new URLSearchParams({ mode: "reset-password" });
  if (searchParams.token) {
    params.set("token", searchParams.token);
  }
  redirect(`/auth?${params.toString()}`);
}
