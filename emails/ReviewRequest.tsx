import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Heading, Link } from '@react-email/components';

export const ReviewRequest = ({ orderId, productName }: { orderId: string, productName: string }) => (
  <Html>
    <Head />
    <Body style={{ fontFamily: 'Helvetica,Arial,sans-serif', background: '#FAF7F2', margin: 0, padding: '20px' }}>
      <Container style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
        <Section style={{ background: '#4A6741', padding: '32px', textAlign: 'center' }}>
          <Heading style={{ color: '#fff', fontSize: '28px', margin: 0, letterSpacing: '2px' }}>LAVISHORGANIC</Heading>
        </Section>
        <Section style={{ padding: '32px' }}>
          <Heading style={{ color: '#2C2C2C' }}>How did you like it? ⭐</Heading>
          <Text style={{ color: '#4A4A4A' }}>We hope you&apos;re enjoying your {productName}.</Text>
          <Text style={{ color: '#4A4A4A' }}>Mind leaving a review? Your feedback helps other customers make better choices and motivates our team. 💚</Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${orderId}?review=true`} style={{ background: '#C9A96E', color: '#fff', padding: '14px 32px', borderRadius: '4px', textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>
              ⭐ Write a Review
            </Link>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default ReviewRequest;
