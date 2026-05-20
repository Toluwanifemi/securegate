import { redirect } from "next/navigation";

interface VerifyEmailPageProps {
  searchParams: { token?: string };
}

export default function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = new URLSearchParams({ mode: "verify-email" });
  if (searchParams.token) {
    params.set("token", searchParams.token);
  }
  redirect(`/auth?${params.toString()}`);
}
