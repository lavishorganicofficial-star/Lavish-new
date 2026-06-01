import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Heading, Link } from '@react-email/components';
import type { InfluencerProfile } from '@/types';

export const InfluencerApproved = ({ name, influencer, couponCode }: { name: string, influencer: InfluencerProfile, couponCode: string }) => (
  <Html>
    <Head />
    <Body style={{ fontFamily: 'Helvetica,Arial,sans-serif', background: '#FAF7F2', margin: 0, padding: '20px' }}>
      <Container style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
        <Section style={{ background: '#4A6741', padding: '32px', textAlign: 'center' }}>
          <Heading style={{ color: '#fff', fontSize: '28px', margin: 0, letterSpacing: '2px' }}>LAVISHORGANIC</Heading>
          <Text style={{ color: '#A8BDA3', margin: '8px 0 0' }}>Influencer Partner Program</Text>
        </Section>
        <Section style={{ padding: '32px' }}>
          <Heading style={{ color: '#4A6741' }}>Congratulations, {name}! 🎉</Heading>
          <Text style={{ color: '#4A4A4A' }}>Your influencer application has been <strong>approved</strong>! Welcome to the LavishOrganic influencer family.</Text>
          
          <Section style={{ background: '#FAF7F2', borderRadius: '6px', padding: '20px', margin: '24px 0' }}>
            <Heading as="h3" style={{ color: '#4A6741', marginTop: 0 }}>Your Details</Heading>
            <Text style={{ margin: '4px 0', color: '#4A4A4A' }}><strong>Your Coupon Code:</strong> <span style={{ fontSize: '20px', letterSpacing: '3px', color: '#2C2C2C' }}>{couponCode}</span></Text>
            <Text style={{ margin: '4px 0', color: '#4A4A4A' }}><strong>Commission Rate:</strong> {influencer.commission_rate}% per sale</Text>
          </Section>
          
          <Text style={{ color: '#4A4A4A' }}>Share your unique code with your audience. Every purchase using your code earns you {influencer.commission_rate}% commission, tracked in real-time on your dashboard.</Text>
          
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/account`} style={{ background: '#4A6741', color: '#fff', padding: '14px 32px', borderRadius: '4px', textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>View Your Dashboard</Link>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default InfluencerApproved;
