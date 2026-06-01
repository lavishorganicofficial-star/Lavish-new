import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Heading } from '@react-email/components';

export const CommissionPayout = ({ name, amount, reference }: { name: string, amount: number, reference: string }) => (
  <Html>
    <Head />
    <Body style={{ fontFamily: 'Helvetica,Arial,sans-serif', background: '#FAF7F2', margin: 0, padding: '20px' }}>
      <Container style={{ maxWidth: '500px', margin: '0 auto', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
        <Section style={{ background: '#4A6741', padding: '24px', textAlign: 'center' }}>
          <Heading style={{ color: '#fff', fontSize: '24px', margin: 0, letterSpacing: '2px' }}>LAVISHORGANIC</Heading>
        </Section>
        <Section style={{ padding: '32px' }}>
          <Heading style={{ color: '#2C2C2C', marginTop: 0 }}>Commission Paid! 💰</Heading>
          <Text style={{ color: '#4A4A4A' }}>Hi {name}, your commission has been transferred!</Text>
          <Section style={{ background: '#FAF7F2', borderRadius: '6px', padding: '20px', margin: '24px 0', textAlign: 'center' }}>
            <Text style={{ margin: 0, color: '#6E6E6E', fontSize: '14px' }}>Amount Paid</Text>
            <Text style={{ margin: '8px 0 0', fontSize: '36px', fontWeight: 700, color: '#4A6741' }}>₹{amount.toFixed(2)}</Text>
            <Text style={{ margin: '8px 0 0', color: '#6E6E6E', fontSize: '13px' }}>Reference: {reference}</Text>
          </Section>
          <Text style={{ color: '#6E6E6E', fontSize: '13px' }}>The amount has been transferred to your registered bank account. It may take 1-2 business days to reflect.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default CommissionPayout;
