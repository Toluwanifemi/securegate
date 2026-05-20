import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
}

export function PasswordResetEmail({ name, resetUrl }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your SecureGate password</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: "480px", margin: "0 auto", padding: "32px" }}>
          <Heading style={{ fontSize: "20px", color: "#111111", margin: "0 0 16px" }}>
            Reset your password
          </Heading>
          <Text style={{ color: "#555555", margin: "0 0 24px", lineHeight: "1.6" }}>
            Hi {name}, we received a request to reset your password. Click below to choose a new
            one. This link expires in <strong>1 hour</strong> and can only be used once.
          </Text>
          <Section>
            <Button
              href={resetUrl}
              style={{
                backgroundColor: "#1a1a2e",
                color: "#ffffff",
                padding: "12px 24px",
                borderRadius: "4px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
                display: "inline-block",
              }}
            >
              Reset password
            </Button>
          </Section>
          <Text style={{ color: "#555555", fontSize: "13px", marginTop: "24px" }}>
            If this link has expired, visit the{" "}
            <a href="/forgot-password" style={{ color: "#1a1a2e" }}>
              forgot password page
            </a>{" "}
            to request a new one.
          </Text>
          <Text style={{ color: "#999999", fontSize: "12px", marginTop: "16px" }}>
            If you did not request this, your password will not change.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
export default PasswordResetEmail;
