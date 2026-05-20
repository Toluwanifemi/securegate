"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/auth",
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={handleSignOut}
      id="logout-action-button"
    >
      Log Out
    </Button>
  );
}

export default SignOutButton;
