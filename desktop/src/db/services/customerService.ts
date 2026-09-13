import { db } from '../db';
import type { Customer } from '../../types';
import { logActivity } from './activityService';
import { realtimeSync } from '../../services/realtimeSyncService';

export async function getAllCustomers(): Promise<Customer[]> {
  return await db.customers.toArray();
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  return await db.customers.get(id);
}

export async function createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
  const now = new Date().toISOString();
  const customer: Customer = {
    id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...data,
    tags: data.tags || [],
    createdAt: now,
    updatedAt: now,
    lastActivityAt: now,
  };

  await db.customers.put(customer);
  await logActivity('created_customer', 'customer', `Added new customer "${customer.companyName}"`, customer.id);
  realtimeSync.broadcast('customers', 'create', customer);
  return customer;
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
  const existing = await db.customers.get(id);
  if (!existing) throw new Error(`Customer with ID ${id} not found`);

  const updated: Customer = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await db.customers.put(updated);
  await logActivity('updated_customer', 'customer', `Updated customer details for "${updated.companyName}"`, id);
  realtimeSync.broadcast('customers', 'update', updated);
  return updated;
}

export async function deleteCustomer(id: string): Promise<void> {
  const existing = await db.customers.get(id);
  if (existing) {
    await db.customers.delete(id);
    
    // Unlink dependent deals, invoices, and transactions to maintain relationship integrity
    const deals = await db.deals.where('customerId').equals(id).toArray();
    for (const d of deals) {
      await db.deals.update(d.id, { customerId: undefined, customerName: existing.companyName + ' (Deleted)' });
    }
    const invoices = await db.invoices.where('customerId').equals(id).toArray();
    for (const inv of invoices) {
      await db.invoices.update(inv.id, { customerId: undefined, customerName: existing.companyName + ' (Deleted)' });
    }
    const txs = await db.transactions.where('customerId').equals(id).toArray();
    for (const t of txs) {
      await db.transactions.update(t.id, { customerId: undefined });
    }

    // Cascade delete associated health scores and expansion opportunities
    await db.customerHealthScores.where('customerId').equals(id).delete();
    await db.expansionOpportunities.where('customerId').equals(id).delete();

    await logActivity('deleted_customer', 'customer', `Deleted customer "${existing.companyName}"`, id);
    realtimeSync.broadcast('customers', 'delete', existing);
  }
}
