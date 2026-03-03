import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getTestDb, cleanupTestDb, closeTestDb, seedTestCustomer } from '@openfsm/db/test-utils';
import { MessageService } from './message.service.js';

describe('MessageService', () => {
  const db = getTestDb();
  const service = new MessageService(db as any);
  let customerId: string;

  beforeEach(async () => {
    await cleanupTestDb();
    const customer = await seedTestCustomer(db);
    customerId = customer.id;
  });

  afterAll(async () => {
    await closeTestDb();
  });

  describe('send', () => {
    it('sends a message from a customer', async () => {
      const message = await service.send({
        customerId,
        content: 'Hello, I need help with my AC',
        isFromCustomer: true,
      });

      expect(message).toBeDefined();
      expect(message.id).toBeDefined();
      expect(message.customerId).toBe(customerId);
      expect(message.content).toBe('Hello, I need help with my AC');
      expect(message.isFromCustomer).toBe(true);
    });

    it('sends a message from the office', async () => {
      const staffUserId = '00000000-0000-0000-0000-000000000001';
      const message = await service.send({
        customerId,
        content: 'We can schedule your repair for tomorrow',
        isFromCustomer: false,
        staffUserId,
      });

      expect(message.isFromCustomer).toBe(false);
      expect(message.staffUserId).toBe(staffUserId);
    });
  });

  describe('getByCustomer', () => {
    it('returns messages for a customer ordered by creation time ascending', async () => {
      await service.send({ customerId, content: 'First message', isFromCustomer: true });
      await service.send({ customerId, content: 'Second message', isFromCustomer: false });
      await service.send({ customerId, content: 'Third message', isFromCustomer: true });

      const messages = await service.getByCustomer(customerId);

      expect(messages).toHaveLength(3);
      expect(messages[0].content).toBe('First message');
      expect(messages[2].content).toBe('Third message');
    });

    it('returns empty array for a customer with no messages', async () => {
      const messages = await service.getByCustomer(customerId);
      expect(messages).toHaveLength(0);
    });

    it('only returns messages for the specified customer', async () => {
      await service.send({ customerId, content: 'Message for customer 1', isFromCustomer: true });

      // Messages for a different customer should not appear
      const messages = await service.getByCustomer('00000000-0000-0000-0000-000000000099');
      expect(messages).toHaveLength(0);
    });
  });

  describe('markRead', () => {
    it('marks a message as read by setting readAt', async () => {
      const message = await service.send({
        customerId,
        content: 'Unread message',
        isFromCustomer: true,
      });

      expect(message.readAt).toBeNull();

      const updated = await service.markRead(message.id);

      expect(updated).toBeDefined();
      expect(updated!.readAt).toBeDefined();
      expect(updated!.readAt).not.toBeNull();
    });
  });

  describe('getUnreadCount', () => {
    it('returns count of unread customer messages', async () => {
      await service.send({ customerId, content: 'Unread 1', isFromCustomer: true });
      await service.send({ customerId, content: 'Unread 2', isFromCustomer: true });

      const count = await service.getUnreadCount();
      expect(count).toBe(2);
    });

    it('does not count messages from the office', async () => {
      await service.send({ customerId, content: 'From customer', isFromCustomer: true });
      await service.send({ customerId, content: 'From office', isFromCustomer: false });

      const count = await service.getUnreadCount();
      expect(count).toBe(1);
    });

    it('does not count read messages', async () => {
      const msg = await service.send({ customerId, content: 'Will be read', isFromCustomer: true });
      await service.send({ customerId, content: 'Still unread', isFromCustomer: true });

      await service.markRead(msg.id);

      const count = await service.getUnreadCount();
      expect(count).toBe(1);
    });

    it('filters by customerId when provided', async () => {
      await service.send({ customerId, content: 'From this customer', isFromCustomer: true });

      const countForCustomer = await service.getUnreadCount(customerId);
      expect(countForCustomer).toBe(1);

      const countForOther = await service.getUnreadCount('00000000-0000-0000-0000-000000000099');
      expect(countForOther).toBe(0);
    });

    it('returns 0 when there are no unread messages', async () => {
      const count = await service.getUnreadCount();
      expect(count).toBe(0);
    });
  });
});
