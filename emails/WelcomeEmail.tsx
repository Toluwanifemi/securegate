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

interface WelcomeEmailProps {
  name: string;
  loginUrl: string;
}

export function WelcomeEmail({ name, loginUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to SecureGate!</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: "480px", margin: "0 auto", padding: "32px" }}>
          <Heading style={{ fontSize: "20px", color: "#111111", margin: "0 0 16px" }}>
            Welcome to SecureGate
          </Heading>
          <Text style={{ color: "#555555", margin: "0 0 24px", lineHeight: "1.6" }}>
            Hi {name}, your email verification is complete! Your account is now fully active.
            You can access your secure dashboard by signing in below.
          </Text>
          <Section>
            <Button
              href={loginUrl}
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
              Sign In to Your Dashboard
            </Button>
          </Section>
          <Text style={{ color: "#999999", fontSize: "12px", marginTop: "32px" }}>
            Thank you for choosing SecureGate. If you have any questions or feedback, feel free to reply directly to this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
export default WelcomeEmail;
