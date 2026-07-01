import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Heading, Link } from 'react-email/components';
import type { Order } from '@/types';

export const OrderShipped = ({ order }: { order: Order }) => (
  <Html>
    <Head />
    <Body style={{ fontFamily: 'Helvetica,Arial,sans-serif', background: '#FAF7F2', margin: 0, padding: '20px' }}>
      <Container style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
        <Section style={{ background: '#4A6741', padding: '32px', textAlign: 'center' }}>
          <Heading style={{ color: '#fff', fontSize: '28px', margin: 0, letterSpacing: '2px' }}>LAVISHORGANIC</Heading>
        </Section>
        <Section style={{ padding: '32px' }}>
          <Heading style={{ color: '#2C2C2C' }}>Your order is on its way! 🚚</Heading>
          <Text style={{ color: '#4A4A4A' }}>Great news! Order <strong>{order.order_number}</strong> has been shipped.</Text>
          {order.tracking_number && (
            <Section style={{ background: '#FAF7F2', borderRadius: '6px', padding: '16px', margin: '24px 0' }}>
              <Text style={{ margin: 0, color: '#4A6741', fontWeight: 600 }}>Tracking Number: {order.tracking_number}</Text>
            </Section>
          )}
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            {order.tracking_url ? (
              <Link href={order.tracking_url} style={{ background: '#4A6741', color: '#fff', padding: '14px 32px', borderRadius: '4px', textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>Track Package</Link>
            ) : (
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${order.id}`} style={{ background: '#4A6741', color: '#fff', padding: '14px 32px', borderRadius: '4px', textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>View Order</Link>
            )}
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default OrderShipped;
