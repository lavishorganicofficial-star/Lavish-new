import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Heading, Link } from '@react-email/components';

export const PasswordReset = ({ resetUrl }: { resetUrl: string }) => (
  <Html>
    <Head />
    <Body style={{ fontFamily: 'Helvetica,Arial,sans-serif', background: '#FAF7F2', margin: 0, padding: '20px' }}>
      <Container style={{ maxWidth: '500px', margin: '0 auto', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
        <Section style={{ background: '#4A6741', padding: '24px', textAlign: 'center' }}>
          <Heading style={{ color: '#fff', fontSize: '24px', margin: 0, letterSpacing: '2px' }}>LAVISHORGANIC</Heading>
        </Section>
        <Section style={{ padding: '32px' }}>
          <Heading style={{ color: '#2C2C2C', marginTop: 0 }}>Reset Your Password</Heading>
          <Text style={{ color: '#4A4A4A' }}>We received a request to reset your LavishOrganic account password. Click the button below to set a new password.</Text>
          <Text style={{ color: '#6E6E6E', fontSize: '14px' }}>This link expires in 1 hour.</Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Link href={resetUrl} style={{ background: '#4A6741', color: '#fff', padding: '14px 32px', borderRadius: '4px', textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>Reset Password</Link>
          </Section>
          <Text style={{ color: '#6E6E6E', fontSize: '13px' }}>If you didn&apos;t request this, you can safely ignore this email. Your password won&apos;t change.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default PasswordReset;
