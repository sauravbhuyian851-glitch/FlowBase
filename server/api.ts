import { Router, Request, Response } from 'express';
import {
  organizations,
  clients,
  b2bCustomers,
  staffMembers,
  services,
  products,
  appointments,
  orders,
  invoices,
  payments,
  reminders,
  auditLogs,
  Appointment,
  Order,
  Invoice,
  Payment,
  Reminder,
  AuditLog
} from './db.js';

export const apiRouter = Router();

// Middleware: Context / Tenant Isolation Simulation (RLS context)
apiRouter.use((req: Request, res: Response, next) => {
  const tenantIdHeader = req.headers['x-organization-id'] as string;
  const targetOrgId = tenantIdHeader || 'org-salon-101'; // default tenant context
  (req as any).organization_id = targetOrgId;
  next();
});

// Helper for Audit Logging
function logAudit(orgId: string, action: string, entityType: string, entityId: string, details: string) {
  const log: AuditLog = {
    id: `log-${Date.now()}`,
    organization_id: orgId,
    user_id: 'usr-admin-system',
    action,
    entity_type: entityType,
    entity_id: entityId,
    ip_address: '127.0.0.1',
    timestamp: new Date().toISOString(),
    details
  };
  auditLogs.unshift(log);
}

// -----------------------------------------------------------------------------
// 1. POST /api/v1/appointments
// -----------------------------------------------------------------------------
apiRouter.post('/appointments', (req: Request, res: Response) => {
  const orgId = (req as any).organization_id;
  const { location_id, client_id, staff_id, service_id, start_time, deposit_payment_method_id, notes } = req.body;

  if (!service_id || !staff_id || !start_time) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Missing required appointment fields (service_id, staff_id, start_time).' }
    });
  }

  // Check Staff Conflict (Redis Redlock simulation)
  const existingConflict = appointments.find(
    a => a.organization_id === orgId && a.staff_id === staff_id && a.start_time === start_time && a.status !== 'CANCELLED'
  );

  if (existingConflict) {
    return res.status(409).json({
      success: false,
      error: { code: 'SLOT_UNAVAILABLE', message: 'The requested staff member is not available during this time slot.' }
    });
  }

  const srv = services.find(s => s.id === service_id) || { duration_minutes: 30, deposit_required: 25.0 };
  const startDate = new Date(start_time);
  const endDate = new Date(startDate.getTime() + srv.duration_minutes * 60000);

  const org = organizations.find(o => o.id === orgId);
  const isClinic = org?.profile === 'CLINIC';

  const newAppointment: Appointment = {
    id: `apt-${Date.now()}`,
    organization_id: orgId,
    location_id: location_id || 'loc-default',
    client_id: client_id || 'cli-001',
    staff_id,
    service_id,
    start_time: startDate.toISOString(),
    end_time: endDate.toISOString(),
    status: 'CONFIRMED',
    no_show_flag: false,
    deposit_amount: srv.deposit_required,
    phi_encrypted_notes: isClinic && notes ? `AES256GCM_ENCRYPTED[${notes}]` : undefined,
    created_at: new Date().toISOString()
  };

  appointments.push(newAppointment);

  // Auto-schedule Reminder
  const reminderTime = new Date(startDate.getTime() - 24 * 3600 * 1000).toISOString();
  const reminderPayload = isClinic
    ? `HIPAA SAFE: Appointment scheduled for ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString()}. Reply 1 to Confirm. [No PHI]`
    : `Reminder: Your appointment is scheduled for ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString()}. Reply 1 to Confirm.`;

  const newReminder: Reminder = {
    id: `rem-${Date.now()}`,
    organization_id: orgId,
    appointment_id: newAppointment.id,
    channel: 'SMS',
    scheduled_time: reminderTime,
    status: 'SCHEDULED',
    sanitized_payload: reminderPayload,
    created_at: new Date().toISOString()
  };
  reminders.push(newReminder);

  logAudit(orgId, isClinic ? 'CREATE_HIPAA_APPOINTMENT' : 'CREATE_APPOINTMENT', 'APPOINTMENT', newAppointment.id, `Created appointment ${newAppointment.id}`);

  return res.status(201).json({
    success: true,
    data: {
      id: newAppointment.id,
      organization_id: newAppointment.organization_id,
      status: newAppointment.status,
      start_time: newAppointment.start_time,
      end_time: newAppointment.end_time,
      deposit_amount: newAppointment.deposit_amount,
      reminders_scheduled: 1,
      created_at: newAppointment.created_at
    }
  });
});

// -----------------------------------------------------------------------------
// 2. POST /api/v1/reminders/send
// -----------------------------------------------------------------------------
apiRouter.post('/reminders/send', (req: Request, res: Response) => {
  const orgId = (req as any).organization_id;
  const { appointment_id, channel = 'SMS', immediate = true } = req.body;

  const apt = appointments.find(a => a.id === appointment_id && a.organization_id === orgId);
  if (!apt) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Appointment ${appointment_id} not found.` }
    });
  }

  const existingRem = reminders.find(r => r.appointment_id === appointment_id);
  const externalMsgId = `SM${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

  if (existingRem) {
    existingRem.status = 'SENT';
    existingRem.sent_time = new Date().toISOString();
    existingRem.external_message_id = externalMsgId;
  }

  logAudit(orgId, 'DISPATCH_REMINDER', 'REMINDER', appointment_id, `Dispatched ${channel} reminder to client.`);

  return res.status(200).json({
    success: true,
    data: {
      reminder_id: existingRem?.id || `rem-${Date.now()}`,
      channel,
      status: 'SENT',
      external_message_id: externalMsgId,
      sent_at: new Date().toISOString()
    }
  });
});

// -----------------------------------------------------------------------------
// 3. POST /api/v1/b2b/orders
// -----------------------------------------------------------------------------
apiRouter.post('/b2b/orders', (req: Request, res: Response) => {
  const orgId = (req as any).organization_id;
  const { b2b_customer_id, items, payment_method, po_number } = req.body;

  const cust = b2bCustomers.find(c => c.id === b2b_customer_id && c.organization_id === orgId);
  if (!cust) {
    return res.status(404).json({
      success: false,
      error: { code: 'CUSTOMER_NOT_FOUND', message: `B2B Customer ${b2b_customer_id} not found.` }
    });
  }

  let subtotal = 0;
  const calculatedItems = (items || []).map((it: any) => {
    const prod = products.find(p => p.id === it.product_id);
    let unitPrice = prod ? prod.wholesale_price : 100.0;
    // Volume tier pricing check
    if (prod && prod.tier_pricing) {
      const tiers = Object.keys(prod.tier_pricing).map(Number).sort((a, b) => b - a);
      for (const t of tiers) {
        if (it.quantity >= t) {
          unitPrice = prod.tier_pricing[t];
          break;
        }
      }
    }
    const itemTotal = unitPrice * it.quantity;
    subtotal += itemTotal;
    return {
      product_id: it.product_id,
      name: prod?.name || 'Wholesale Product Item',
      quantity: it.quantity,
      unit_price: unitPrice
    };
  });

  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  // Credit Limit Verification
  if (payment_method === 'NET_TERMS' && total > cust.available_credit) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'CREDIT_LIMIT_EXCEEDED',
        message: `Order total ($${total.toFixed(2)}) exceeds available credit ($${cust.available_credit.toFixed(2)}).`,
        details: {
          credit_limit: cust.credit_limit,
          available_credit: cust.available_credit
        }
      }
    });
  }

  const isApproved = total <= cust.auto_approve_threshold;
  const orderStatus = isApproved ? 'APPROVED' : 'PENDING_APPROVAL';

  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    organization_id: orgId,
    b2b_customer_id,
    status: orderStatus,
    subtotal,
    tax_amount: tax,
    shipping_amount: 50.0,
    total_amount: total + 50.0,
    payment_terms_days: cust.net_terms_days,
    items: calculatedItems,
    created_at: new Date().toISOString()
  };
  orders.push(newOrder);

  // Generate Invoice if approved
  let newInvoice: Invoice | undefined;
  if (isApproved && payment_method === 'NET_TERMS') {
    cust.available_credit -= newOrder.total_amount;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + cust.net_terms_days);

    newInvoice = {
      id: `inv-${Date.now()}`,
      organization_id: orgId,
      order_id: newOrder.id,
      b2b_customer_id,
      invoice_number: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'UNPAID',
      subtotal,
      tax,
      total: newOrder.total_amount,
      amount_paid: 0.0,
      due_date: dueDate.toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    invoices.push(newInvoice);
  }

  logAudit(orgId, 'CREATE_B2B_ORDER', 'ORDER', newOrder.id, `Created B2B order ${newOrder.id} with status ${newOrder.status}`);

  return res.status(201).json({
    success: true,
    data: {
      order_id: newOrder.id,
      status: newOrder.status,
      total_amount: newOrder.total_amount,
      payment_terms: `Net ${cust.net_terms_days}`,
      invoice_id: newInvoice?.id,
      remaining_credit: cust.available_credit,
      due_date: newInvoice?.due_date
    }
  });
});

// -----------------------------------------------------------------------------
// 4. POST /api/v1/payments/charge
// -----------------------------------------------------------------------------
apiRouter.post('/payments/charge', (req: Request, res: Response) => {
  const orgId = (req as any).organization_id;
  const { invoice_id, amount, payment_method = 'CREDIT_CARD' } = req.body;

  const inv = invoices.find(i => i.id === invoice_id && i.organization_id === orgId);
  if (!inv) {
    return res.status(404).json({
      success: false,
      error: { code: 'INVOICE_NOT_FOUND', message: `Invoice ${invoice_id} not found.` }
    });
  }

  const chargeAmount = amount || (inv.total - inv.amount_paid);
  inv.amount_paid += chargeAmount;
  if (inv.amount_paid >= inv.total) {
    inv.status = 'PAID';
  } else {
    inv.status = 'PARTIALLY_PAID';
  }

  const payment: Payment = {
    id: `pay-${Date.now()}`,
    organization_id: orgId,
    invoice_id,
    amount: chargeAmount,
    method: payment_method,
    gateway_transaction_id: `ch_${Math.random().toString(36).substring(2, 15)}`,
    status: 'COMPLETED',
    created_at: new Date().toISOString()
  };
  payments.push(payment);

  logAudit(orgId, 'PROCESS_PAYMENT', 'PAYMENT', payment.id, `Charged $${chargeAmount} on invoice ${invoice_id}`);

  return res.status(200).json({
    success: true,
    data: {
      payment_id: payment.id,
      invoice_id,
      amount_charged: chargeAmount,
      invoice_status: inv.status,
      gateway_transaction_id: payment.gateway_transaction_id
    }
  });
});

// -----------------------------------------------------------------------------
// 5. GET /api/v1/reports/revenue
// -----------------------------------------------------------------------------
apiRouter.get('/reports/revenue', (req: Request, res: Response) => {
  const orgId = (req as any).organization_id;
  const org = organizations.find(o => o.id === orgId);

  const tenantAppointments = appointments.filter(a => a.organization_id === orgId);
  const tenantOrders = orders.filter(o => o.organization_id === orgId);

  const serviceRev = tenantAppointments.reduce((acc, a) => acc + (a.status !== 'CANCELLED' ? 150 : 0), 0);
  const wholesaleRev = tenantOrders.reduce((acc, o) => acc + (o.status === 'APPROVED' || o.status === 'FULFILLED' ? o.total_amount : 0), 0);
  const gross = serviceRev + wholesaleRev;

  return res.status(200).json({
    success: true,
    data: {
      organization: org?.name || 'All Tenants',
      profile: org?.profile || 'SALON',
      summary: {
        gross_revenue: gross,
        net_revenue: gross * 0.95,
        total_appointments: tenantAppointments.length,
        no_show_rate_percent: 2.8,
        b2b_wholesale_revenue: wholesaleRev
      },
      breakdown: [
        { label: 'Services & Appointments', amount: serviceRev },
        { label: 'B2B Wholesale Orders', amount: wholesaleRev }
      ]
    }
  });
});

// -----------------------------------------------------------------------------
// GET /api/v1/audit-logs
// -----------------------------------------------------------------------------
apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  const orgId = (req as any).organization_id;
  const logs = auditLogs.filter(l => l.organization_id === orgId);
  return res.json({ success: true, data: logs });
});
