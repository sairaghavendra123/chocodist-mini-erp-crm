# 📝 ChocoDist Mini ERP-CRM — Technical Limitations & Project Scope

This document outlines genuine technical limitations, simplifying assumptions, and future enhancements for the current version of ChocoDist Mini ERP-CRM.

---

## 1. System Limitations & Simplifications

1. **Third-Party Payment Gateways**:
   - The application manages sales challan dispatches and billing records internally. Live credit card/UPI payment gateways (e.g. Razorpay or Stripe) are not integrated.

2. **Automated SMS & Email Gateways**:
   - Notifications are delivered in real time within the application UI (`GET /api/notifications`). Outbound SMS/WhatsApp dispatch alerts or SMTP email notifications are simplified out of scope.

3. **Multi-Warehouse Location Tracking**:
   - Stock quantities are managed for a single central regional distribution warehouse rather than multi-warehouse location routing.

4. **Batch Expiry & Serial Number Tracking**:
   - Stock movements track inward stock receipts and manual inventory adjustments, but do not track individual physical batch lot barcodes or expiry dates.

5. **Offline Support**:
   - The application requires an active internet connection to communicate with the Neon PostgreSQL database via Render REST APIs. Service worker offline PWA caching is not implemented.

---

## 2. Recommended Future Enhancements

- Integration of GST e-way bill generation for dispatches over ₹50,000.
- Automated email PDF invoice dispatch to customer email addresses upon Sales Challan confirmation.
- Mobile barcode scanning app for rapid warehouse inventory counting.
