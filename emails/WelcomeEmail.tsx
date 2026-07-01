import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Heading, Link } from 'react-email/components';

export const WelcomeEmail = ({ name, referralCode }: { name: string, referralCode?: string }) => (
  <Html>
    <Head />
    <Body style={{ fontFamily: 'Helvetica,Arial,sans-serif', background: '#FAF7F2', margin: 0, padding: '20px' }}>
      <Container style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
        <Section style={{ background: '#4A6741', padding: '40px', textAlign: 'center' }}>
          <Heading style={{ color: '#fff', fontSize: '32px', margin: 0, letterSpacing: '2px' }}>LAVISHORGANIC</Heading>
          <Text style={{ color: '#A8BDA3', margin: '8px 0 0' }}>Welcome to the organic family 🌿</Text>
        </Section>
        <Section style={{ padding: '40px' }}>
          <Heading style={{ color: '#2C2C2C' }}>Hello, {name}! 👋</Heading>
          <Text style={{ color: '#4A4A4A', lineHeight: '1.6' }}>Welcome to LavishOrganic! We&apos;re delighted to have you with us. Explore our collection of 100% certified organic skincare products, crafted with love and the purest ingredients from nature.</Text>
          {referralCode && (
            <Section style={{ background: '#FAF7F2', border: '1px solid #A8BDA3', borderRadius: '6px', padding: '16px', margin: '24px 0', textAlign: 'center' }}>
              <Text style={{ margin: 0, color: '#4A6741', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Referral Code</Text>
              <Text style={{ margin: '8px 0 0', fontSize: '24px', fontWeight: 700, color: '#2C2C2C', letterSpacing: '4px' }}>{referralCode}</Text>
              <Text style={{ margin: '8px 0 0', color: '#6E6E6E', fontSize: '13px' }}>Share with friends and earn rewards!</Text>
            </Section>
          )}
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/shop`} style={{ background: '#4A6741', color: '#fff', padding: '14px 32px', borderRadius: '4px', textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>Shop Now</Link>
          </Section>
          <Text style={{ color: '#6E6E6E', fontSize: '13px', textAlign: 'center' }}>Use code <strong>WELCOME10</strong> for 10% off your first order!</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;
