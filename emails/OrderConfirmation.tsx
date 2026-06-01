import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Heading, Link, Hr } from '@react-email/components';
import type { Order } from '@/types';

export const OrderConfirmation = ({ order }: { order: Order }) => (
  <Html>
    <Head />
    <Body style={{ fontFamily: 'Helvetica,Arial,sans-serif', background: '#FAF7F2', margin: 0, padding: '20px' }}>
      <Container style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
        <Section style={{ background: '#4A6741', padding: '32px', textAlign: 'center' }}>
          <Heading style={{ color: '#fff', fontSize: '28px', margin: 0, letterSpacing: '2px' }}>LAVISHORGANIC</Heading>
          <Text style={{ color: '#A8BDA3', margin: '8px 0 0' }}>100% Organic · Cruelty Free · Made in India</Text>
        </Section>
        <Section style={{ padding: '32px' }}>
          <Heading style={{ color: '#2C2C2C', marginTop: 0 }}>Order Confirmed! 🌿</Heading>
          <Text style={{ color: '#4A4A4A' }}>Thank you for your order. We&apos;re preparing your organic goodies!</Text>
          
          <Section style={{ background: '#FAF7F2', borderRadius: '6px', padding: '16px', margin: '24px 0' }}>
            <Text style={{ margin: 0, color: '#4A6741', fontWeight: 600 }}>Order Number: {order.order_number}</Text>
          </Section>

          <Hr style={{ borderColor: '#4A6741', margin: '16px 0' }} />
          <Text style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '18px', margin: '12px 0 0', color: '#2C2C2C' }}>
            Total <span>₹{order.total.toFixed(2)}</span>
          </Text>

          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${order.id}`} style={{ background: '#4A6741', color: '#fff', padding: '14px 32px', borderRadius: '4px', textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>
              Track Your Order
            </Link>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default OrderConfirmation;
