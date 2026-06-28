
# StayGrid TRD (Phase 1)

## Purpose
This document is the Product & Technical Requirements Document (TRD) used as the primary context for AI-assisted development. It defines the scope, modules and business requirements for Phase 1.

# Product Vision
StayGrid is a farmhouse booking marketplace connecting customers with verified farmhouse owners. StayGrid earns through booking commissions, featured listings, advertisements and promotional services.

# Primary Roles
1. Customer (Mobile App)
2. Owner (Web Portal)
3. System Admin (ERP)

# Deliverables
- Mobile App (Android & iOS)
- Web Portal (Owner)
- Web ERP (System Admin)
- Shared Backend
- Shared Design System

# Recommended Stack
## Monorepo
- Turborepo
- pnpm

## Mobile
- React Native + Expo
- Expo Router
- NativeWind
- React Query
- Zustand
- React Hook Form
- Zod

## Web
- Next.js
- Tailwind CSS
- shadcn/ui
- React Query
- TanStack Table

## Backend
- NestJS + Fastify
- PostgreSQL
- Prisma ORM
- Better Auth
- JWT
- RBAC
- BullMQ
- Redis

## Infrastructure
- Backend: Render
- Web: Vercel
- Database: Neon PostgreSQL
- Redis: Upstash
- Storage: Cloudinary
- Push: Firebase Cloud Messaging
- WhatsApp: Meta Cloud API
- Payments: Razorpay

# Customer App Modules
- Authentication
- Home
- Search
- Filters
- Property Details
- Gallery
- Availability Calendar
- Booking
- Payment
- Wishlist
- Refer & Earn
- Coupons
- Notifications
- My Bookings
- Reviews
- Support
- Profile
- Settings

# Owner Portal Modules
- Dashboard
- Farmhouse Management
- Availability Calendar
- Pricing
- Amenities
- Photo Gallery
- Booking Management
- Last Minute Offers
- Promotional Requests
- Earnings
- Analytics
- Reviews
- Support
- Profile

# System Admin Modules
- Dashboard
- User Management
- Owner Management
- Bulk Farmhouse Upload
- Farmhouse Verification
- Booking Management
- Payment Verification
- Commission Tracking
- Refunds
- Coupons
- CRM Kanban
- Homepage CMS
- Featured Listings
- Advertisement Manager
- Push Notifications
- WhatsApp Campaigns
- Reports
- Analytics
- Roles & Permissions
- Audit Logs

# Booking Rules
- User selects property.
- User enters guest details.
- User pays 20% booking token.
- Owner receives booking.
- Admin receives booking.
- Remaining payment collected onsite.
- Owner marks payment received.
- Admin closes booking.

# CRM Pipeline
New Lead -> Viewed Listing -> Viewed Gallery -> Clicked Booking -> Payment Pending -> Coupon Sent -> Sales Call -> Token Paid -> Confirmed -> Completed -> Review -> Referral

# AI Instructions
- Treat this document as the source of truth.
- Do not invent features.
- Build one monorepo.
- Share UI and validation packages.
- Implement RBAC.
- Implement production-ready error handling.
- Include loading, empty and error states for every screen.
- Generate responsive web and mobile interfaces.
- Keep architecture modular and scalable.

# Future Phases
- Loyalty Program
- Dynamic Pricing
- AI Recommendations
- Corporate Bookings
- Vendor Marketplace
- Multi-city Expansion
