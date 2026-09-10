import { useState, useEffect } from 'react';
import {
  Calendar,
  ShieldAlert,
  Bell,
  BarChart3,
  Database,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Send,
  ShoppingBag,
  TrendingUp,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Users,
  ChevronRight,
  Layers,
  Star,
  Zap,
  Check
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  profile: 'SALON' | 'CLINIC' | 'FIELD_SERVICE' | 'B2B_DISTRIBUTOR';
  is_hipaa_compliant: boolean;
  currency: string;
}

const ORGANIZATIONS: Organization[] = [
  {
    id: 'org-salon-101',
    name: 'Aura Luxury Spa & Salon',
    slug: 'aura-salon',
    profile: 'SALON',
    is_hipaa_compliant: false,
    currency: 'USD'
  },
  {
    id: 'org-clinic-202',
    name: 'Apex Health Dental & Medical Practice',
    slug: 'apex-health',
    profile: 'CLINIC',
    is_hipaa_compliant: true,
    currency: 'USD'
  },
  {
    id: 'org-field-303',
    name: 'ProFlow Plumbing & HVAC Services',
    slug: 'proflow-hvac',
    profile: 'FIELD_SERVICE',
    is_hipaa_compliant: false,
    currency: 'USD'
  },
  {
    id: 'org-b2b-404',
    name: 'Vanguard Industrial Wholesale & Supply',
    slug: 'vanguard-wholesale',
    profile: 'B2B_DISTRIBUTOR',
    is_hipaa_compliant: false,
    currency: 'USD'
  }
];

export function App() {
  const [activeOrg, setActiveOrg] = useState<Organization>(ORGANIZATIONS[0]);
  const [activeTab, setActiveTab] = useState<'appointments' | 'b2b' | 'reminders' | 'rls' | 'analytics'>('appointments');

  // Appointment Form State
  const [bookingStaff, setBookingStaff] = useState('stf-101');
  const [bookingTime, setBookingTime] = useState('2026-09-15T14:00:00Z');
  const [bookingNotes, setBookingNotes] = useState('Patient requested gentle cleaning and sensitive tooth check.');
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  // B2B Order Form State
  const [b2bQuantity, setB2bQuantity] = useState(50);
  const [b2bPaymentTerms, setB2bPaymentTerms] = useState<'NET_TERMS' | 'CREDIT_CARD'>('NET_TERMS');
  const [b2bOrderResult, setB2bOrderResult] = useState<any>(null);
  const [isB2bLoading, setIsB2bLoading] = useState(false);

  // Reminder State
  const [reminderAptId] = useState('apt-101');
  const [reminderResult, setReminderResult] = useState<any>(null);
  const [isReminderLoading, setIsReminderLoading] = useState(false);

  // Analytics & Logs State
  const [revenueData, setRevenueData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    if (activeOrg.profile === 'SALON') setBookingStaff('stf-101');
    else if (activeOrg.profile === 'CLINIC') setBookingStaff('stf-201');
    else if (activeOrg.profile === 'FIELD_SERVICE') setBookingStaff('stf-301');

    fetchRevenueData();
    fetchAuditLogs();
  }, [activeOrg]);

  const fetchRevenueData = async () => {
    try {
      const res = await fetch('/api/v1/reports/revenue', {
        headers: { 'x-organization-id': activeOrg.id }
      });
      const data = await res.json();
      if (data.success) setRevenueData(data.data);
    } catch (e) {
      setRevenueData({
        summary: {
          gross_revenue: activeOrg.profile === 'B2B_DISTRIBUTOR' ? 124500 : 45200,
          net_revenue: activeOrg.profile === 'B2B_DISTRIBUTOR' ? 118275 : 42940,
          total_appointments: 142,
          no_show_rate_percent: 2.8,
          b2b_wholesale_revenue: activeOrg.profile === 'B2B_DISTRIBUTOR' ? 82000 : 0
        },
        breakdown: [
          { label: 'Services & Appointments', amount: 42500 },
          { label: 'B2B Wholesale Orders', amount: activeOrg.profile === 'B2B_DISTRIBUTOR' ? 82000 : 2700 }
        ]
      });
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/v1/audit-logs', {
        headers: { 'x-organization-id': activeOrg.id }
      });
      const data = await res.json();
      if (data.success) setAuditLogs(data.data);
    } catch (e) {
      setAuditLogs([
        {
          id: 'log-101',
          organization_id: activeOrg.id,
          user_id: 'usr-system',
          action: activeOrg.is_hipaa_compliant ? 'READ_HIPAA_RECORD' : 'CREATE_APPOINTMENT',
          entity_type: 'APPOINTMENT',
          entity_id: 'apt-202',
          ip_address: '192.168.1.1',
          timestamp: new Date().toISOString(),
          details: 'Verified RLS tenant isolation policy for current request session.'
        }
      ]);
    }
  };

  const handleCreateAppointment = async (testConflict = false) => {
    setIsBookingLoading(true);
    setBookingResult(null);

    const payload = {
      location_id: 'loc-primary',
      client_id: 'cli-001',
      staff_id: bookingStaff,
      service_id: activeOrg.profile === 'SALON' ? 'srv-101' : activeOrg.profile === 'CLINIC' ? 'srv-201' : 'srv-301',
      start_time: testConflict ? '2026-09-15T14:00:00Z' : bookingTime,
      notes: bookingNotes
    };

    try {
      const res = await fetch('/api/v1/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': activeOrg.id
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setBookingResult(data);
      fetchAuditLogs();
    } catch (err) {
      if (testConflict) {
        setBookingResult({
          success: false,
          error: { code: 'SLOT_UNAVAILABLE', message: 'The requested staff member is not available during this time slot.' }
        });
      } else {
        setBookingResult({
          success: true,
          data: {
            id: `apt-${Date.now()}`,
            organization_id: activeOrg.id,
            status: 'CONFIRMED',
            start_time: bookingTime,
            deposit_amount: 30.0,
            reminders_scheduled: 1,
            created_at: new Date().toISOString()
          }
        });
      }
    } finally {
      setIsBookingLoading(false);
    }
  };

  const handleCreateB2BOrder = async (forceOverCredit = false) => {
    setIsB2bLoading(true);
    setB2bOrderResult(null);

    const qty = forceOverCredit ? 250 : b2bQuantity;
    const payload = {
      b2b_customer_id: 'b2b-cust-101',
      items: [{ product_id: 'prod-101', quantity: qty }],
      payment_method: b2bPaymentTerms
    };

    try {
      const res = await fetch('/api/v1/b2b/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': 'org-b2b-404'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setB2bOrderResult(data);
      fetchAuditLogs();
    } catch (err) {
      if (forceOverCredit) {
        setB2bOrderResult({
          success: false,
          error: {
            code: 'CREDIT_LIMIT_EXCEEDED',
            message: 'Order total ($27,500.00) exceeds available credit ($18,500.00).',
            details: { credit_limit: 25000.0, available_credit: 18500.0 }
          }
        });
      } else {
        setB2bOrderResult({
          success: true,
          data: {
            order_id: `ord-${Date.now()}`,
            status: 'APPROVED',
            total_amount: qty * 95.0,
            payment_terms: 'Net 30',
            invoice_id: `inv-${Date.now()}`,
            remaining_credit: 18500.0 - qty * 95.0,
            due_date: '2026-10-10'
          }
        });
      }
    } finally {
      setIsB2bLoading(false);
    }
  };

  const handleSendReminder = async () => {
    setIsReminderLoading(true);
    setReminderResult(null);

    try {
      const res = await fetch('/api/v1/reminders/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': activeOrg.id
        },
        body: JSON.stringify({ appointment_id: reminderAptId, channel: 'SMS', immediate: true })
      });
      const data = await res.json();
      setReminderResult(data);
      fetchAuditLogs();
    } catch (e) {
      setReminderResult({
        success: true,
        data: {
          reminder_id: `rem-${Date.now()}`,
          channel: 'SMS',
          status: 'SENT',
          external_message_id: `SM${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          sent_at: new Date().toISOString()
        }
      });
    } finally {
      setIsReminderLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. HEADER NAVIGATION (WHITESPACE FIGMA TEMPLATE STYLE) */}
      <header className="header-nav">
        <div className="container header-container">
          <a href="#" className="logo-brand">
            <div style={{ width: '36px', height: '36px', background: '#4F9CF9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
              <Layers size={22} />
            </div>
            whitespace
          </a>

          <nav>
            <ul className="nav-links">
              <li><a href="#features">Products</a></li>
              <li><a href="#solutions">Solutions</a></li>
              <li><a href="#demo">Live SaaS Demo</a></li>
              <li><a href="#pricing">Pricing</a></li>
            </ul>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn btn-yellow" style={{ padding: '10px 20px', fontSize: '0.88rem' }}>Login</button>
            <a href="#demo" className="btn btn-blue" style={{ padding: '10px 20px', fontSize: '0.88rem' }}>
              Try Whitespace free <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION (NAVY BLUE WITH WAVE GRADIENT & DASHBOARD MOCKUP) */}
      <section className="bg-navy" style={{ padding: '100px 0 120px 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '48px', alignItems: 'center' }}>
          <div>
            <span className="pill-badge pill-badge-yellow" style={{ marginBottom: '20px' }}>
              <Sparkles size={14} /> Vertical SaaS Platform 2026
            </span>
            <h1 style={{ fontSize: '3.6rem', lineHeight: 1.15, color: '#ffffff', marginBottom: '24px' }}>
              Get More Done with <span style={{ color: '#4F9CF9' }}>whitespace</span>
            </h1>
            <p style={{ fontSize: '1.15rem', color: '#b0c4de', marginBottom: '40px', maxWidth: '540px' }}>
              Project & workflow management software that enables appointment businesses, clinics, and wholesale distributors to collaborate, schedule, analyze, and automate everyday operations.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <a href="#demo" className="btn btn-blue" style={{ padding: '16px 32px', fontSize: '1rem' }}>
                Try Whitespace free <ArrowRight size={18} />
              </a>
              <a href="#pricing" className="btn btn-outline-white" style={{ padding: '16px 32px', fontSize: '1rem' }}>
                View Pricing Tiers
              </a>
            </div>
          </div>

          {/* Hero Illustration / Dashboard Preview Graphic */}
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 30px 60px rgba(0,0,0,0.4)', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></span>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></span>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>app.whitespace.com/dashboard</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ background: '#084996', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '0.8rem', color: '#93c5fd' }}>Gross Revenue (MTD)</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>$124,500.00</div>
                <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={14} /> +18.4% no-show reduction
                </div>
              </div>

              <div style={{ background: '#084996', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#93c5fd' }}>Available Credit</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFE492', marginTop: '4px' }}>$18,500</div>
                <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>Net 30 Active</span>
              </div>
            </div>

            {/* Vector Illustration Mockup Cards */}
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#dbeafe', padding: '10px', borderRadius: '10px', color: '#1d4ed8' }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', display: 'block' }}>Oral Exam & Digital X-Rays</strong>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Apex Health Dental • Dr. James Wilson</span>
                </div>
              </div>
              <span className="pill-badge pill-badge-emerald">CONFIRMED</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE LIVE SAAS PLATFORM DEMO WORKSPACE */}
      <section id="demo" className="bg-light-blue" style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px auto' }}>
            <span className="pill-badge pill-badge-blue" style={{ marginBottom: '12px' }}>
              <Zap size={14} /> Interactive Product Sandbox
            </span>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--navy-dark)', marginBottom: '16px' }}>
              Try the Multi-Tenant Engine Live
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)' }}>
              Switch vertical profiles to test real-time appointment slot concurrency, B2B wholesale credit gating, HIPAA SMS reminder redactions, and PostgreSQL RLS policies.
            </p>
          </div>

          {/* DEMO CONTAINER */}
          <div className="whitespace-card" style={{ padding: '32px', border: '2px solid var(--blue-primary)', boxShadow: '0 20px 40px rgba(4, 56, 115, 0.08)' }}>
            {/* VERTICAL PROFILE SWITCHER HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid var(--border-light)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Building2 size={24} color="var(--blue-primary)" />
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Select Tenant Profile Context:
                  </label>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-dark)' }}>
                    {activeOrg.name}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {ORGANIZATIONS.map(org => (
                  <button
                    key={org.id}
                    onClick={() => setActiveOrg(org)}
                    className={`btn ${activeOrg.id === org.id ? 'btn-blue' : 'btn-outline-dark'}`}
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    {org.profile === 'SALON' && '💅 Salon'}
                    {org.profile === 'CLINIC' && '🏥 Clinic (HIPAA)'}
                    {org.profile === 'FIELD_SERVICE' && '🛠️ Field Service'}
                    {org.profile === 'B2B_DISTRIBUTOR' && '📦 B2B Wholesale'}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', overflowX: 'auto' }}>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`btn ${activeTab === 'appointments' ? 'btn-blue' : 'btn-outline-dark'}`}
                style={{ padding: '10px 18px', fontSize: '0.88rem' }}
              >
                <Calendar size={16} /> Appointments & Booking
              </button>
              <button
                onClick={() => setActiveTab('b2b')}
                className={`btn ${activeTab === 'b2b' ? 'btn-blue' : 'btn-outline-dark'}`}
                style={{ padding: '10px 18px', fontSize: '0.88rem' }}
              >
                <ShoppingBag size={16} /> B2B Credit Engine
              </button>
              <button
                onClick={() => setActiveTab('reminders')}
                className={`btn ${activeTab === 'reminders' ? 'btn-blue' : 'btn-outline-dark'}`}
                style={{ padding: '10px 18px', fontSize: '0.88rem' }}
              >
                <Bell size={16} /> SMS Reminders & HIPAA
              </button>
              <button
                onClick={() => setActiveTab('rls')}
                className={`btn ${activeTab === 'rls' ? 'btn-blue' : 'btn-outline-dark'}`}
                style={{ padding: '10px 18px', fontSize: '0.88rem' }}
              >
                <Database size={16} /> PostgreSQL RLS & Audit
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`btn ${activeTab === 'analytics' ? 'btn-blue' : 'btn-outline-dark'}`}
                style={{ padding: '10px 18px', fontSize: '0.88rem' }}
              >
                <BarChart3 size={16} /> Financial Analytics
              </button>
            </div>

            {/* TAB 1: APPOINTMENTS */}
            {activeTab === 'appointments' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--navy-dark)', marginBottom: '16px' }}>Book Appointment Slot</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Practitioner:</label>
                      <select value={bookingStaff} onChange={(e) => setBookingStaff(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <option value="stf-101">Sophia Martinez (Master Stylist)</option>
                        <option value="stf-201">Dr. James H. Wilson, DDS (Dental Lead)</option>
                        <option value="stf-301">Robert Miller (HVAC Master Tech)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Time Slot:</label>
                      <input type="datetime-local" value={bookingTime.substring(0, 16)} onChange={(e) => setBookingTime(new Date(e.target.value).toISOString())} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Notes {activeOrg.is_hipaa_compliant && '(Encrypted as PHI)'}:</label>
                      <textarea rows={2} value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                      <button onClick={() => handleCreateAppointment(false)} disabled={isBookingLoading} className="btn btn-blue" style={{ flex: 1 }}>
                        {isBookingLoading ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Book Slot
                      </button>
                      <button onClick={() => handleCreateAppointment(true)} disabled={isBookingLoading} className="btn btn-yellow">
                        <AlertTriangle size={16} /> Test Conflict
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#043873', borderRadius: '12px', padding: '20px', color: '#ffffff' }}>
                  <h3 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '12px' }}>API Response & Redlock Status</h3>
                  {bookingResult ? (
                    <pre style={{ background: '#02244c', padding: '14px', borderRadius: '8px', fontSize: '0.78rem', color: '#38bdf8', overflowX: 'auto' }}>
                      {JSON.stringify(bookingResult, null, 2)}
                    </pre>
                  ) : (
                    <div style={{ padding: '40px 10px', textAlign: 'center', color: '#b0c4de', fontSize: '0.85rem' }}>
                      Click "Book Slot" to test slot availability, Redis Redlock concurrency, and deposit handling.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: B2B CREDIT ENGINE */}
            {activeTab === 'b2b' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--navy-dark)', marginBottom: '16px' }}>B2B Account & Net 30 Order</h3>
                  <div style={{ background: '#F7F9FC', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '0.95rem' }}>Apex Construction Corp</strong>
                      <span className="pill-badge pill-badge-blue">PLATINUM TIER</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                      <span>Credit Limit: <strong>$25,000.00</strong></span>
                      <span>Available: <strong style={{ color: '#059669' }}>$18,500.00</strong></span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Product SKU Quantity (VALVE-HEAVY-200 @ $95/unit):</label>
                      <input type="number" min={1} value={b2bQuantity} onChange={(e) => setB2bQuantity(parseInt(e.target.value) || 1)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Payment Terms:</label>
                      <select value={b2bPaymentTerms} onChange={(e) => setB2bPaymentTerms(e.target.value as any)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <option value="NET_TERMS">Net 30 Payment Terms (Invoice Generated)</option>
                        <option value="CREDIT_CARD">Credit Card Instant Charge</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleCreateB2BOrder(false)} disabled={isB2bLoading} className="btn btn-blue" style={{ flex: 1 }}>
                        {isB2bLoading ? <RefreshCw className="animate-spin" size={16} /> : <ShoppingBag size={16} />} Submit Order (Net 30)
                      </button>
                      <button onClick={() => handleCreateB2BOrder(true)} disabled={isB2bLoading} className="btn btn-yellow">
                        <AlertTriangle size={16} /> Force Over Limit (422)
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#043873', borderRadius: '12px', padding: '20px', color: '#ffffff' }}>
                  <h3 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '12px' }}>Credit Limit & Invoice Result</h3>
                  {b2bOrderResult ? (
                    <pre style={{ background: '#02244c', padding: '14px', borderRadius: '8px', fontSize: '0.78rem', color: '#38bdf8', overflowX: 'auto' }}>
                      {JSON.stringify(b2bOrderResult, null, 2)}
                    </pre>
                  ) : (
                    <div style={{ padding: '40px 10px', textAlign: 'center', color: '#b0c4de', fontSize: '0.85rem' }}>
                      Submit a wholesale order to evaluate volume discount tiering and Net 30 credit capacity limits.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: REMINDERS & HIPAA */}
            {activeTab === 'reminders' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--navy-dark)', marginBottom: '16px' }}>Automated SMS & Email Dispatcher</h3>
                  <div style={{ background: activeOrg.is_hipaa_compliant ? 'rgba(16, 185, 129, 0.1)' : 'rgba(79, 156, 249, 0.1)', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
                    <strong style={{ fontSize: '0.9rem', color: activeOrg.is_hipaa_compliant ? '#059669' : 'var(--blue-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {activeOrg.is_hipaa_compliant ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
                      {activeOrg.is_hipaa_compliant ? 'HIPAA PHI Redaction Active' : 'Standard Salon/Field Mode'}
                    </strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {activeOrg.is_hipaa_compliant
                        ? 'Strips treatment details and diagnosis notes to comply with strict HIPAA privacy standards.'
                        : 'Includes full appointment service names and practitioner details.'}
                    </p>
                  </div>

                  <button onClick={handleSendReminder} disabled={isReminderLoading} className="btn btn-blue" style={{ width: '100%' }}>
                    {isReminderLoading ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />} Dispatch Twilio SMS Sequence
                  </button>
                </div>

                <div style={{ background: '#043873', borderRadius: '12px', padding: '20px', color: '#ffffff' }}>
                  <h3 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '12px' }}>Twilio Message Payload Preview</h3>
                  {reminderResult ? (
                    <div>
                      <span className="pill-badge pill-badge-emerald" style={{ marginBottom: '12px' }}>SMS DISPATCHED</span>
                      <div style={{ background: '#02244c', padding: '14px', borderRadius: '8px', fontSize: '0.85rem', color: '#ffffff', fontFamily: 'monospace' }}>
                        {activeOrg.is_hipaa_compliant
                          ? 'HIPAA SAFE: Appointment at Apex Health on Sep 16 at 10:00 AM. Reply 1 to Confirm. [No PHI]'
                          : 'Reminder: Your Signature Facial appointment at Aura Salon is tomorrow at 2:00 PM. Reply 1 to Confirm.'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '40px 10px', textAlign: 'center', color: '#b0c4de', fontSize: '0.85rem' }}>
                      Trigger a reminder to view Twilio outbound message payloads and HIPAA PHI redactions.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: RLS & AUDIT */}
            {activeTab === 'rls' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--navy-dark)', marginBottom: '12px' }}>PostgreSQL Row-Level Security</h3>
                  <pre style={{ background: '#043873', color: '#38bdf8', padding: '16px', borderRadius: '12px', fontSize: '0.78rem', overflowX: 'auto' }}>
{`-- Enforce active tenant context
SET LOCAL app.current_organization_id = '${activeOrg.id}';

-- RLS Isolation Policy
CREATE POLICY tenant_isolation ON appointments
  FOR ALL USING (
    organization_id = NULLIF(
      current_setting('app.current_organization_id', true), ''
    )::uuid
  );`}
                  </pre>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--navy-dark)', marginBottom: '12px' }}>HIPAA Compliance Audit Trail</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                    {auditLogs.map((log, i) => (
                      <div key={i} style={{ background: '#F7F9FC', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--navy-dark)' }}>
                          <span>{log.action}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.details}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: ANALYTICS */}
            {activeTab === 'analytics' && revenueData && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div className="whitespace-card">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Gross Revenue (MTD)</span>
                  <strong style={{ fontSize: '1.8rem', color: 'var(--navy-dark)' }}>${revenueData.summary.gross_revenue.toLocaleString()}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#059669', marginTop: '4px', display: 'block' }}>+18.4% vs last month</span>
                </div>
                <div className="whitespace-card">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>No-Show Rate</span>
                  <strong style={{ fontSize: '1.8rem', color: 'var(--blue-primary)' }}>{revenueData.summary.no_show_rate_percent}%</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Down from 25% average</span>
                </div>
                <div className="whitespace-card">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Wholesale B2B Revenue</span>
                  <strong style={{ fontSize: '1.8rem', color: 'var(--navy-dark)' }}>${revenueData.summary.b2b_wholesale_revenue.toLocaleString()}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '4px', display: 'block' }}>Powered by Net Terms</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. FEATURE SECTION 1 ("Project & Workflow Management") */}
      <section id="features" className="bg-white" style={{ padding: '100px 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '64px', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2.8rem', color: 'var(--navy-dark)', marginBottom: '24px', lineHeight: 1.2 }}>
              Project & Appointment <span className="underline-accent">Management</span>
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', marginBottom: '32px' }}>
              Eliminate disconnected tools. FlowBase combines service scheduling, client reminders, POS checkout, and B2B wholesale ordering into one unified, multi-tenant platform.
            </p>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.98rem', fontWeight: 600, color: 'var(--navy-dark)' }}>
                <div style={{ background: '#dbeafe', padding: '6px', borderRadius: '50%', color: '#1d4ed8' }}><Check size={16} /></div>
                20–30% lower no-show rates through dynamic SMS/Email reminders
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.98rem', fontWeight: 600, color: 'var(--navy-dark)' }}>
                <div style={{ background: '#dbeafe', padding: '6px', borderRadius: '50%', color: '#1d4ed8' }}><Check size={16} /></div>
                B2B Net Terms & real-time credit limit evaluation for wholesalers
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.98rem', fontWeight: 600, color: 'var(--navy-dark)' }}>
                <div style={{ background: '#dbeafe', padding: '6px', borderRadius: '50%', color: '#1d4ed8' }}><Check size={16} /></div>
                HIPAA & PCI-DSS compliant architecture with PostgreSQL RLS
              </li>
            </ul>

            <a href="#demo" className="btn btn-blue">
              Get Started <ArrowRight size={18} />
            </a>
          </div>

          {/* Feature Illustration */}
          <div style={{ background: '#F7F9FC', borderRadius: '24px', padding: '40px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', background: '#4F9CF9', padding: '20px', borderRadius: '20px', color: '#ffffff', marginBottom: '24px' }}>
              <Users size={48} />
            </div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--navy-dark)', marginBottom: '12px' }}>Team & Resource Collaboration</h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
              Coordinate staff schedules, room availability, equipment prerequisites, and client communications across multiple locations in real time.
            </p>
          </div>
        </div>
      </section>

      {/* 5. FEATURE SECTION 2 ("Work Together Anywhere") */}
      <section className="bg-light-blue" style={{ padding: '100px 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '64px', alignItems: 'center' }}>
          {/* Circular Connected Network Illustration */}
          <div style={{ background: '#ffffff', borderRadius: '24px', padding: '40px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)', textAlign: 'center', position: 'relative' }}>
            <div style={{ width: '120px', height: '120px', background: 'var(--navy-dark)', borderRadius: '50%', margin: '0 auto 24px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: '0 10px 30px rgba(4,56,115,0.3)' }}>
              <Layers size={48} />
            </div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--navy-dark)', marginBottom: '8px' }}>Connected Ecosystem</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Synchronized across Mobile, Web, POS, and Third-Party APIs</p>
          </div>

          <div>
            <h2 style={{ fontSize: '2.8rem', color: 'var(--navy-dark)', marginBottom: '24px', lineHeight: 1.2 }}>
              Work <span className="underline-accent">together</span> seamlessly
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', marginBottom: '32px' }}>
              With FlowBase, share appointment schedules, invoices, client notes, and B2B credit approvals across your entire organization. Ensure every staff member has access to the exact data they need.
            </p>
            <a href="#demo" className="btn btn-blue">
              Try it now <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* 6. FEATURE SECTION 3 ("Customise it to your needs") */}
      <section id="solutions" className="bg-navy" style={{ padding: '100px 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '64px', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2.8rem', color: '#ffffff', marginBottom: '24px', lineHeight: 1.2 }}>
              Customise it to <span style={{ color: '#FFE492' }}>your needs</span>
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#b0c4de', marginBottom: '32px' }}>
              Every industry is unique. FlowBase provides vertical configuration profiles that instantly customize system defaults, compliance rules, and payment terms to match your exact business model.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }}>
              <div style={{ background: '#084996', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <strong style={{ color: '#ffffff', fontSize: '0.95rem', display: 'block', marginBottom: '4px' }}>💅 Salon Mode</strong>
                <span style={{ fontSize: '0.8rem', color: '#93c5fd' }}>Commission rules & tip POS</span>
              </div>
              <div style={{ background: '#084996', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <strong style={{ color: '#ffffff', fontSize: '0.95rem', display: 'block', marginBottom: '4px' }}>🏥 Clinic Mode</strong>
                <span style={{ fontSize: '0.8rem', color: '#93c5fd' }}>HIPAA PHI & NPI tracking</span>
              </div>
              <div style={{ background: '#084996', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <strong style={{ color: '#ffffff', fontSize: '0.95rem', display: 'block', marginBottom: '4px' }}>🛠️ Field Service</strong>
                <span style={{ fontSize: '0.8rem', color: '#93c5fd' }}>Dispatch & offline mobile</span>
              </div>
              <div style={{ background: '#084996', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <strong style={{ color: '#ffffff', fontSize: '0.95rem', display: 'block', marginBottom: '4px' }}>📦 B2B Wholesale</strong>
                <span style={{ fontSize: '0.8rem', color: '#93c5fd' }}>Net 30 & credit gating</span>
              </div>
            </div>

            <a href="#demo" className="btn btn-blue">
              Explore Vertical Profiles <ChevronRight size={18} />
            </a>
          </div>

          <div style={{ background: '#084996', borderRadius: '24px', padding: '40px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: 'var(--shadow-dark)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <ShieldAlert size={36} color="#FFE492" />
              <div>
                <h3 style={{ fontSize: '1.2rem', color: '#ffffff' }}>100% Security & Compliance</h3>
                <span style={{ fontSize: '0.85rem', color: '#93c5fd' }}>HIPAA • PCI-DSS • GDPR • CCPA</span>
              </div>
            </div>
            <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              Rest easy knowing your patient records, card payments, and corporate data are protected with AES-256 encryption, PostgreSQL Row-Level Security, and automated audit logging.
            </p>
          </div>
        </div>
      </section>

      {/* 7. PRICING SECTION ("Choose Your Plan") */}
      <section id="pricing" className="bg-white" style={{ padding: '100px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 64px auto' }}>
            <span className="pill-badge pill-badge-blue" style={{ marginBottom: '12px' }}>Flat-Rate Pricing</span>
            <h2 style={{ fontSize: '2.8rem', color: 'var(--navy-dark)', marginBottom: '16px' }}>
              Choose <span className="underline-accent">Your Plan</span>
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)' }}>
              Transparent flat-rate monthly pricing. Zero revenue-share fees, zero hidden setup costs.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'center' }}>
            {/* PLAN 1: STARTER */}
            <div className="pricing-card pricing-card-standard">
              <div>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--navy-dark)', marginBottom: '8px' }}>Starter</h3>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--navy-dark)', marginBottom: '16px' }}>
                  $49 <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>/month</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  Ideal for solo practitioners, boutique salons, and small service contractors.
                </p>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', fontSize: '0.9rem' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#4F9CF9" /> 1 Location & 5 Staff Slots</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#4F9CF9" /> 100 Automated SMS/mo</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#4F9CF9" /> POS & Card Processing</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#4F9CF9" /> Standard Email Reminders</li>
                </ul>
              </div>

              <button className="btn btn-outline-dark" style={{ width: '100%' }}>Select Starter</button>
            </div>

            {/* PLAN 2: PROFESSIONAL (FEATURED NAVY CARD) */}
            <div className="pricing-card pricing-card-featured">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.4rem', color: '#ffffff' }}>Professional</h3>
                  <span className="pill-badge pill-badge-yellow">MOST POPULAR</span>
                </div>
                <div style={{ fontSize: '2.8rem', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>
                  $149 <span style={{ fontSize: '1rem', fontWeight: 500, color: '#93c5fd' }}>/month</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#b0c4de', marginBottom: '24px' }}>
                  For growing practices, clinics, and wholesalers needing Net Terms & multi-location.
                </p>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', fontSize: '0.9rem', color: '#ffffff' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#FFE492" /> Up to 5 Locations & 25 Staff</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#FFE492" /> B2B Net Terms & Credit Limit Engine</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#FFE492" /> 1,000 Automated SMS/mo</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#FFE492" /> QuickBooks & Xero Sync</li>
                </ul>
              </div>

              <button className="btn btn-yellow" style={{ width: '100%' }}>Start Free Trial</button>
            </div>

            {/* PLAN 3: ENTERPRISE */}
            <div className="pricing-card pricing-card-standard">
              <div>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--navy-dark)', marginBottom: '8px' }}>Enterprise</h3>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--navy-dark)', marginBottom: '16px' }}>
                  $399 <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>/month</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  For multi-location medical clinics, dental groups, and large wholesale networks.
                </p>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', fontSize: '0.9rem' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#4F9CF9" /> Full HIPAA Compliance Mode & BAA</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#4F9CF9" /> Unlimited Locations & Staff</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#4F9CF9" /> Unlimited SMS Credits</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#4F9CF9" /> Dedicated Account Manager & SLA</li>
                </ul>
              </div>

              <button className="btn btn-outline-dark" style={{ width: '100%' }}>Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. SPONSORS / INTEGRATIONS BAR */}
      <section className="bg-light-blue" style={{ padding: '60px 0', borderTop: '1px solid var(--border-light)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px', display: 'block' }}>
            Trusted by modern tools & integrations
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '48px', flexWrap: 'wrap', opacity: 0.75 }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy-dark)' }}>Microsoft</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy-dark)' }}>Slack</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy-dark)' }}>Google</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy-dark)' }}>Stripe</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy-dark)' }}>Twilio</span>
          </div>
        </div>
      </section>

      {/* 9. TESTIMONIALS SECTION */}
      <section className="bg-white" style={{ padding: '100px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 64px auto' }}>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--navy-dark)', marginBottom: '16px' }}>
              What Our Clients Say
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            <div className="whitespace-card">
              <div style={{ display: 'flex', gap: '4px', color: '#f59e0b', marginBottom: '16px' }}>
                <Star size={18} fill="#f59e0b" /><Star size={18} fill="#f59e0b" /><Star size={18} fill="#f59e0b" /><Star size={18} fill="#f59e0b" /><Star size={18} fill="#f59e0b" />
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-dark)', marginBottom: '24px', fontStyle: 'italic' }}>
                "Our dental clinic reduced appointment no-shows from 24% down to under 3% within 60 days using FlowBase's automated SMS reminders and HIPAA mode."
              </p>
              <div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--navy-dark)', display: 'block' }}>Dr. Sarah Jenkins, DDS</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Apex Health Practice</span>
              </div>
            </div>

            <div className="whitespace-card">
              <div style={{ display: 'flex', gap: '4px', color: '#f59e0b', marginBottom: '16px' }}>
                <Star size={18} fill="#f59e0b" /><Star size={18} fill="#f59e0b" /><Star size={18} fill="#f59e0b" /><Star size={18} fill="#f59e0b" /><Star size={18} fill="#f59e0b" />
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-dark)', marginBottom: '24px', fontStyle: 'italic' }}>
                "The B2B Net Terms credit check engine automated our wholesale invoicing completely. We approved $250K in customer orders without manual review friction."
              </p>
              <div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--navy-dark)', display: 'block' }}>Marcus Vance</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>VP Operations, Vanguard Wholesale</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="bg-navy" style={{ padding: '80px 0 40px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '64px' }}>
            <div>
              <a href="#" className="logo-brand" style={{ marginBottom: '16px', display: 'inline-flex' }}>
                <Layers size={22} color="#4F9CF9" /> whitespace
              </a>
              <p style={{ fontSize: '0.88rem', color: '#b0c4de' }}>
                All-in-one SaaS platform for appointment services, clinics, and B2B wholesale distributors.
              </p>
            </div>

            <div>
              <strong style={{ fontSize: '0.95rem', color: '#ffffff', display: 'block', marginBottom: '16px' }}>Product</strong>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#b0c4de' }}>
                <li><a href="#demo" style={{ color: 'inherit', textDecoration: 'none' }}>Appointment Booking</a></li>
                <li><a href="#demo" style={{ color: 'inherit', textDecoration: 'none' }}>B2B Wholesale Net Terms</a></li>
                <li><a href="#demo" style={{ color: 'inherit', textDecoration: 'none' }}>HIPAA Compliance Engine</a></li>
                <li><a href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing Tiers</a></li>
              </ul>
            </div>

            <div>
              <strong style={{ fontSize: '0.95rem', color: '#ffffff', display: 'block', marginBottom: '16px' }}>Solutions</strong>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#b0c4de' }}>
                <li>Salons & Spas</li>
                <li>Medical & Dental Clinics</li>
                <li>HVAC & Field Contractors</li>
                <li>Wholesale Distributors</li>
              </ul>
            </div>

            <div>
              <strong style={{ fontSize: '0.95rem', color: '#ffffff', display: 'block', marginBottom: '16px' }}>Company</strong>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#b0c4de' }}>
                <li>About Us</li>
                <li>Careers</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px', textAlign: 'center', fontSize: '0.82rem', color: '#94a3b8' }}>
            © {new Date().getFullYear()} Whitespace SaaS Platform. All rights reserved. Built with React 18 & TypeScript.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
