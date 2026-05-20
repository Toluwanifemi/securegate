import { redirect } from "next/navigation";

interface LoginPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const params = new URLSearchParams({ mode: "login" });

  if (searchParams.callbackUrl) {
    params.set("callbackUrl", String(searchParams.callbackUrl));
  }

  if (searchParams.error) {
    params.set("error", String(searchParams.error));
  }

  if (searchParams.verified) {
    params.set("verified", String(searchParams.verified));
  }

  redirect(`/auth?${params.toString()}`);
}
