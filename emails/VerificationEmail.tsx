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

interface VerificationEmailProps {
  name: string;
  verificationUrl: string;
}

export function VerificationEmail({ name, verificationUrl }: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your SecureGate account</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: "480px", margin: "0 auto", padding: "32px" }}>
          <Heading style={{ fontSize: "20px", color: "#111111", margin: "0 0 16px" }}>
            Verify your email address
          </Heading>
          <Text style={{ color: "#555555", margin: "0 0 24px", lineHeight: "1.6" }}>
            Hi {name}, you&apos;re almost in. Click below to verify your account.
            This link expires in <strong>24 hours</strong>.
          </Text>
          <Section>
            <Button
              href={verificationUrl}
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
              Verify email address
            </Button>
          </Section>
          <Text style={{ color: "#999999", fontSize: "12px", marginTop: "32px" }}>
            If you did not create a SecureGate account, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
export default VerificationEmail;
