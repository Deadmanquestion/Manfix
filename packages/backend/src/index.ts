import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PortalRole = "customer" | "supplier" | "workshop" | "technician" | "admin";
export type ManHubRole = PortalRole | "super_admin";

export type ManHubProfile = {
  avatar_url: string | null;
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: ManHubRole;
  status: string;
  last_portal_role: PortalRole | null;
};

export type UserRoleMembership = {
  role: ManHubRole;
  status: string;
};

export type PortalRoute = {
  label: string;
  path: string;
};

export type WorkshopBooking = {
  booking_kind: "service" | "lift";
  estimated_price: number;
  id: string;
  payment_status: string;
  scheduled_at: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  technician_dispatch_expires_at: string | null;
  symptom: string;
  vehicle_label: string;
};

export type RepairJob = {
  booking_kind: "service" | "lift";
  created_at: string;
  customer_name: string;
  diagnosis: string;
  estimated_amount: number;
  final_amount: number | null;
  id: string;
  scheduled_at: string;
  status: "queued" | "in_progress" | "ready" | "completed";
  technician_name: string | null;
  vehicle_label: string;
};

export type RepairJobOffer = {
  created_at: string;
  expires_at: string;
  id: string;
  service_booking_id: string;
  status: "pending" | "accepted" | "declined" | "expired";
  booking: {
    estimated_price: number;
    scheduled_at: string;
    service_type: string;
    symptom: string;
    vehicle_label: string;
  };
};

export type ServiceInvoice = {
  amount: number;
  created_at: string;
  currency: string;
  description: string;
  id: string;
  invoice_number: string;
  payment_method: string | null;
  platform_fee_amount: number;
  status: "Pending" | "Awaiting confirmation" | "Paid" | "Cancelled" | "Refunded";
  vehicle_label: string;
  workshop_net_amount: number;
};

export type MetricQuery = {
  label: string;
  table: string;
  type: "count" | "sum";
  column?: string;
  filter?: Record<string, string | number | boolean>;
};

export type SupplierProduct = {
  active: boolean;
  brand: string;
  category: string;
  cost_price: number;
  created_at: string;
  description: string | null;
  id: string;
  image_url: string | null;
  incoming_stock: number;
  low_stock_threshold: number;
  name: string;
  selling_price: number;
  sku: string | null;
  stock: number;
  supplier_id: string;
  updated_at: string;
  warranty_duration_months: number;
};

export type SupplierProductInput = {
  active: boolean;
  brand: string;
  category: string;
  cost_price: number;
  description: string | null;
  image_url?: string | null;
  incoming_stock: number;
  low_stock_threshold: number;
  name: string;
  selling_price: number;
  sku: string | null;
  stock: number;
  warranty_duration_months: number;
};

export type SupplierOrder = {
  amount: number;
  commission_amount: number;
  commission_rate: number;
  cost_total: number;
  created_at: string;
  customer: string;
  id: string;
  invoice_number: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  settled_at: string | null;
  status: "New" | "Accepted" | "Rejected" | "Preparing" | "Dispatched" | "Delivered" | "Cancelled";
  supplier_net_amount: number;
  supplier_id: string;
  workshop: string;
};

export type VehicleBrand = {
  country: string | null;
  id: string;
  logo_url: string;
  name: string;
};

export type VehicleModel = {
  brand: VehicleBrand;
  brand_id: string;
  body_type: string;
  generation: string;
  id: string;
  image_status?: "missing" | "queued" | "processing" | "cached" | "external" | "failed" | null;
  image_url: string;
  model_name: string;
  production_end_year: number | null;
  production_start_year: number | null;
};

export type VehicleVariant = {
  coolant_capacity: number | null;
  displacement: number | null;
  drivetrain: string;
  engine: string;
  engine_oil_capacity: number | null;
  fuel: string;
  horsepower: number | null;
  id: string;
  torque: number | null;
  transmission: string;
  transmission_oil_capacity: number | null;
  tyre_size: string | null;
  vehicle_model: VehicleModel;
  vehicle_model_id: string;
  year: number;
};

export type CustomerVehicle = {
  created_at: string;
  id: string;
  mileage: number;
  nickname: string | null;
  plate_number: string;
  updated_at: string;
  user_id: string;
  vehicle_variant: VehicleVariant;
  vehicle_variant_id: string;
};

export type CustomerVehicleInput = {
  mileage: number;
  nickname: string | null;
  plate_number: string;
  vehicle_variant_id: string;
};

export type CustomerCartItem = {
  created_at: string;
  id: string;
  product: SupplierProduct;
  quantity: number;
};

export type CustomerOrderItem = {
  created_at: string;
  id: string;
  line_total: number;
  order_id: string;
  product_brand: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  sku: string | null;
  status: "New" | "Accepted" | "Rejected" | "Preparing" | "Dispatched" | "Delivered" | "Cancelled";
  supplier_id: string;
  unit_price: number;
};

export type CustomerOrder = {
  checked_out_at: string;
  created_at: string;
  currency: string;
  customer_id: string;
  id: string;
  items: CustomerOrderItem[];
  order_number: string;
  payment_status: "Pending" | "Paid" | "Cancelled" | "Refunded";
  status: "Pending Supplier Acceptance" | "Processing" | "Partially Rejected" | "Dispatched" | "Completed" | "Cancelled";
  subtotal: number;
  total: number;
  updated_at: string;
};

export type CustomerPayment = {
  amount: number;
  created_at: string;
  currency: string;
  customer_id: string;
  id: string;
  method: string;
  order_id: string;
  paid_at: string | null;
  payment_number: string;
  status: "Pending" | "Paid" | "Cancelled" | "Refunded";
  updated_at: string;
};

export type CustomerWarranty = {
  coverage_type: "Part" | "Service";
  created_at: string;
  duration_months: number;
  expiry_date: string;
  id: string;
  invoice_number: string | null;
  mileage_limit: number | null;
  part_brand: string | null;
  part_name: string | null;
  repair_date: string;
  repair_history: Array<Record<string, unknown>>;
  start_date: string;
  status: "Active" | "Expired" | "Claimed" | "Cancelled";
  supplier_name: string | null;
  vehicle_label: string | null;
  warranty_number: string;
  warranty_terms: string[];
  workshop_name: string | null;
};

export type CustomerWarrantyClaim = {
  description: string;
  id: string;
  inspection_status: string | null;
  status: "Pending Review" | "Approved" | "Rejected" | "Inspection Requested";
  submitted_at: string;
  warranty_id: string;
};

export type ManFixNotification = {
  created_at: string;
  entity_id: string | null;
  entity_type: string | null;
  id: string;
  kind: string;
  message: string;
  read_at: string | null;
  recipient_id: string;
  title: string;
};

export type PlatformWorkshop = {
  address: string;
  brands_supported: string[];
  city: string | null;
  email: string | null;
  id: string;
  name: string;
  operating_hours: string | null;
  owner_id: string;
  phone: string | null;
  rating: number;
  status: string;
};

export type ServiceCatalogItem = {
  description: string | null;
  estimated_duration_minutes: number;
  estimated_price: number;
  id: string;
  name: string;
};

export type SupplierStockHistory = {
  change_type: "Opening" | "Sale" | "Restock" | "Incoming" | "Adjustment";
  created_at: string;
  id: string;
  note: string | null;
  order_id: string | null;
  product_id: string | null;
  product_name: string;
  quantity: number;
  supplier_id: string;
};

export type SupplierCommission = {
  commission_amount: number;
  commission_rate: number;
  created_at: string;
  gross_amount: number;
  id: string;
  invoice_number: string;
  order_id: string;
  settled_at: string | null;
  status: "Pending" | "Settled" | "Reversed";
  supplier_id: string;
  supplier_name: string;
  supplier_net_amount: number;
};

export type SupplierWallet = {
  available_balance: number;
  currency: string;
  pending_balance: number;
  supplier_id: string;
  updated_at: string;
};

export type SupplierWithdrawal = {
  account_number: string;
  amount: number;
  bank: string;
  created_at: string;
  id: string;
  reviewed_at: string | null;
  status: "Pending" | "Approved" | "Rejected" | "Paid";
  supplier_id: string;
};

export type SupplierInvoice = {
  commission_amount: number;
  commission_rate: number;
  id: string;
  invoice_number: string;
  issued_at: string;
  order_id: string | null;
  paid_amount: number;
  parts_subtotal: number;
  pdf_url: string | null;
  status: "Pending" | "Paid" | "Refunded" | "Escrow";
  supplier_id: string;
  supplier_net_amount: number;
  total: number;
};

export type SupplierWarrantyClaim = {
  description: string;
  id: string;
  photos: string[];
  reviewed_at: string | null;
  status: "Pending Review" | "Approved" | "Rejected" | "Inspection Requested";
  submitted_at: string;
  supplier_id: string | null;
  videos: string[];
  warranty_id: string;
};

export type ProductCategory = {
  id: string;
  name: string;
};

export type PartnerApplicationType = "supplier" | "workshop" | "technician";
export type PartnerApplicationStatus = "Pending" | "Approved" | "Rejected";

export type PartnerApplicationRecord = {
  account_user_id: string | null;
  admin_notes: string | null;
  created_at: string;
  email: string;
  id: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  status: PartnerApplicationStatus;
  updated_at: string;
  [key: string]: unknown;
};

export const portalRoles: PortalRole[] = ["customer", "supplier", "workshop", "technician", "admin"];

export const portalLabelByRole: Record<PortalRole, string> = {
  admin: "Admin Dashboard",
  customer: "Customer App",
  supplier: "Supplier Portal",
  technician: "Technician Portal",
  workshop: "Workshop Portal",
};

export const portalHomeByRole: Record<PortalRole, string> = {
  admin: "/admin",
  customer: "/",
  supplier: "/supplier",
  technician: "/",
  workshop: "/workshop",
};

export const portalHostByRole: Record<PortalRole, string> = {
  admin: "admin.manfix.my",
  customer: "app.manfix.my",
  supplier: "supplier.manfix.my",
  technician: "tech.manfix.my",
  workshop: "workshop.manfix.my",
};

const localPortalUrlByRole: Record<PortalRole, string> = {
  admin: "http://localhost:4103",
  customer: "http://localhost:4100",
  supplier: "http://localhost:4101",
  technician: "http://localhost:4105",
  workshop: "http://localhost:4102",
};

const renderPortalUrlByRole: Partial<Record<PortalRole, string>> = {
  admin: "https://manfix-admin.onrender.com",
  customer: "https://manhub-customer.onrender.com",
  supplier: "https://manfix-supplier.onrender.com",
  technician: "https://manfix-tech.onrender.com",
  workshop: "https://manhub-workshop.onrender.com",
};

const portalAliasesByRole: Partial<Record<PortalRole, string[]>> = {
  technician: [
    "https://manfix-technician.onrender.com",
    "https://manfix-tech.onrender.com",
    "https://tech.manfix.my",
    "https://technician.manfix.my",
  ],
};

function cleanUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizeConfiguredPortalUrl(role: PortalRole, value?: string) {
  if (!value) return undefined;
  const normalized = cleanUrl(value);
  if (role === "customer" && normalized === "https://manfix-customer.onrender.com") {
    return renderPortalUrlByRole.customer;
  }
  if (role === "workshop" && normalized === "https://manfix-workshop.onrender.com") {
    return renderPortalUrlByRole.workshop;
  }
  if (role === "supplier" && normalized === "https://manhub-supplier.onrender.com") {
    return renderPortalUrlByRole.supplier;
  }
  return normalized;
}

function normalizeConfiguredAuthUrl(value?: string) {
  if (!value) return undefined;
  const normalized = cleanUrl(value);
  if (normalized === "https://manfix-auth.onrender.com") {
    return "https://manhub-auth.onrender.com";
  }
  return normalized;
}

const MANFIX_AUTH_COOKIE_NAME = "manfix-auth";
const MANFIX_PRODUCTION_DOMAIN = "manfix.my";
const MANFIX_HANDOFF_ACCESS_TOKEN = "manfix_access_token";
const MANFIX_HANDOFF_REFRESH_TOKEN = "manfix_refresh_token";

export function isManHubProductionHost(hostname: string) {
  const normalizedHostname = hostname.toLowerCase();
  return normalizedHostname === MANFIX_PRODUCTION_DOMAIN
    || normalizedHostname.endsWith(`.${MANFIX_PRODUCTION_DOMAIN}`);
}

export function canShareManHubSession(sourceUrl: string, destinationUrl: string) {
  try {
    const source = new URL(sourceUrl);
    const destination = new URL(destinationUrl);

    return source.hostname === destination.hostname
      || (isManHubProductionHost(source.hostname) && isManHubProductionHost(destination.hostname));
  } catch {
    return false;
  }
}

export function createManFixSessionHandoffUrl(
  destinationUrl: string,
  accessToken: string,
  refreshToken: string,
) {
  if (!getPortalRoleForUrl(destinationUrl) && !isAuthAppUrl(destinationUrl)) {
    throw new Error("The requested ManFix portal is not trusted.");
  }

  const url = new URL(destinationUrl);
  url.searchParams.set(MANFIX_HANDOFF_ACCESS_TOKEN, accessToken);
  url.searchParams.set(MANFIX_HANDOFF_REFRESH_TOKEN, refreshToken);
  return url.toString();
}

export function readManFixSessionHandoff(value: string) {
  try {
    const url = new URL(value);
    const accessToken = url.searchParams.get(MANFIX_HANDOFF_ACCESS_TOKEN);
    const refreshToken = url.searchParams.get(MANFIX_HANDOFF_REFRESH_TOKEN);
    if (accessToken && refreshToken) return { accessToken, refreshToken };

    const fragment = new URLSearchParams(url.hash.slice(1));
    const legacyAccessToken = fragment.get(MANFIX_HANDOFF_ACCESS_TOKEN);
    const legacyRefreshToken = fragment.get(MANFIX_HANDOFF_REFRESH_TOKEN);

    if (!legacyAccessToken || !legacyRefreshToken) return null;
    return { accessToken: legacyAccessToken, refreshToken: legacyRefreshToken };
  } catch {
    return null;
  }
}

export function removeManFixSessionHandoff(value: string) {
  const url = new URL(value);
  url.searchParams.delete(MANFIX_HANDOFF_ACCESS_TOKEN);
  url.searchParams.delete(MANFIX_HANDOFF_REFRESH_TOKEN);

  const fragment = new URLSearchParams(url.hash.slice(1));
  fragment.delete(MANFIX_HANDOFF_ACCESS_TOKEN);
  fragment.delete(MANFIX_HANDOFF_REFRESH_TOKEN);
  if (url.hash.includes(MANFIX_HANDOFF_ACCESS_TOKEN) || url.hash.includes(MANFIX_HANDOFF_REFRESH_TOKEN)) {
    url.hash = fragment.toString();
  }
  return url.toString();
}

export function createManHubSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    ?? import.meta.env.VITE_SUPABASE_ANON_KEY
    ?? import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  const hostname = typeof window === "undefined" ? "" : window.location.hostname;
  const productionHost = isManHubProductionHost(hostname);

  return createBrowserClient(url, key, {
    cookieOptions: {
      name: MANFIX_AUTH_COOKIE_NAME,
      path: "/",
      sameSite: "lax",
      secure: productionHost || hostname !== "localhost",
      ...(productionHost ? { domain: `.${MANFIX_PRODUCTION_DOMAIN}` } : {}),
    },
  });
}

export async function getSessionRole(supabase: SupabaseClient): Promise<ManHubRole | null> {
  const profile = await getSessionProfile(supabase);
  return profile?.role ?? null;
}

export async function getSessionRoles(supabase: SupabaseClient): Promise<ManHubRole[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return [];

  const { data, error } = await supabase
    .from("user_roles")
    .select("role,status")
    .eq("user_id", userData.user.id);

  if (error) throw error;

  return ((data ?? []) as UserRoleMembership[])
    .filter((membership) => isManHubRole(membership.role) && isEnabledStatus(membership.status))
    .map((membership) => membership.role);
}

export function getAvailablePortalRoles(roles: readonly ManHubRole[]) {
  if (roles.includes("super_admin")) return [...portalRoles];
  return portalRoles.filter((role) => roles.includes(role));
}

export async function getSessionProfile(supabase: SupabaseClient): Promise<ManHubProfile | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,phone,avatar_url,role,status,last_portal_role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (
    error
    || !data
    || !isManHubRole(data.role)
    || (data.last_portal_role !== null && !isPortalRole(data.last_portal_role))
  ) {
    return null;
  }

  return data as ManHubProfile;
}

export async function routeAfterLogin(supabase: SupabaseClient, nextUrl?: string | null) {
  const [profile, roles] = await Promise.all([
    getSessionProfile(supabase),
    getSessionRoles(supabase),
  ]);
  if (!profile) return getUnauthorizedUrl("missing-profile");
  if (!isProfileEnabled(profile)) return getUnauthorizedUrl("inactive");

  const availablePortals = getAvailablePortalRoles(roles);
  if (availablePortals.length === 0) return getUnauthorizedUrl("missing-role");

  if (nextUrl) {
    const requestedRole = getPortalRoleForUrl(nextUrl);
    if (requestedRole && canOpenPortal(roles, requestedRole)) {
      await rememberPortal(supabase, requestedRole);
      return nextUrl;
    }
    return getUnauthorizedUrl("wrong-role");
  }

  if (availablePortals.length === 1) {
    await rememberPortal(supabase, availablePortals[0]);
    return getPortalDestination(availablePortals[0]);
  }

  return getPortalSelectorUrl();
}

export function canOpenPortal(
  roles: readonly ManHubRole[] | ManHubRole | null,
  portalRole: PortalRole,
) {
  const assignedRoles = Array.isArray(roles) ? roles : roles ? [roles] : [];
  return assignedRoles.includes("super_admin") || assignedRoles.includes(portalRole);
}

export function isProfileEnabled(profile: ManHubProfile | null) {
  if (!profile) return false;
  return isEnabledStatus(profile.status);
}

export function getAuthAppUrl() {
  return normalizeConfiguredAuthUrl(
    import.meta.env.VITE_MANFIX_AUTH_URL
      ?? import.meta.env.VITE_MANHUB_AUTH_URL,
  )
    ?? (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)
      ? "http://localhost:4104"
      : "https://manhub-auth.onrender.com");
}

export function getManFixApiUrl() {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env.VITE_MANFIX_API_URL
      ?? "https://manhub.onrender.com";
  }
  return "https://manhub.onrender.com";
}

export function isAuthAppUrl(value: string) {
  try {
    const fallbackOrigin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
    return new URL(value, fallbackOrigin).origin === new URL(getAuthAppUrl(), fallbackOrigin).origin;
  } catch {
    return false;
  }
}

export function getUnauthorizedUrl(reason = "role") {
  return getAuthRouteUrl("/unauthorized", { reason });
}

export function getLoginUrl(nextUrl?: string) {
  return getAuthRouteUrl("/login", nextUrl ? { next: nextUrl } : undefined);
}

export function getPortalSelectorUrl() {
  return getAuthRouteUrl("/select-portal");
}

export function getLogoutUrl() {
  return getAuthRouteUrl("/logout");
}

function getAuthRouteUrl(path: string, params?: Record<string, string>) {
  const url = new URL("/", getAuthAppUrl());
  const search = new URLSearchParams(params);
  const route = path.startsWith("/") ? path : `/${path}`;
  const query = search.toString();
  url.hash = query ? `${route}?${query}` : route;
  return url.toString();
}

export function getPortalDestination(role: PortalRole) {
  const configured = {
    admin: normalizeConfiguredPortalUrl(
      "admin",
      import.meta.env.VITE_MANFIX_ADMIN_URL
        ?? import.meta.env.VITE_MANHUB_ADMIN_URL,
    ),
    customer: normalizeConfiguredPortalUrl(
      "customer",
      import.meta.env.VITE_MANFIX_CUSTOMER_URL
        ?? import.meta.env.VITE_MANHUB_CUSTOMER_URL,
    ),
    supplier: normalizeConfiguredPortalUrl(
      "supplier",
      import.meta.env.VITE_MANFIX_SUPPLIER_URL
        ?? import.meta.env.VITE_MANHUB_SUPPLIER_URL,
    ),
    technician: normalizeConfiguredPortalUrl(
      "technician",
      import.meta.env.VITE_MANFIX_TECHNICIAN_URL
        ?? import.meta.env.VITE_MANFIX_TECH_URL
        ?? import.meta.env.VITE_MANHUB_TECHNICIAN_URL
        ?? import.meta.env.VITE_MANHUB_TECH_URL,
    ),
    workshop: normalizeConfiguredPortalUrl(
      "workshop",
      import.meta.env.VITE_MANFIX_WORKSHOP_URL
        ?? import.meta.env.VITE_MANHUB_WORKSHOP_URL,
    ),
  } satisfies Partial<Record<PortalRole, string | undefined>>;

  const localHost = typeof window !== "undefined"
    && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  return configured[role]
    ?? (localHost ? localPortalUrlByRole[role] : renderPortalUrlByRole[role])
    ?? localPortalUrlByRole[role];
}

export function getPortalRoleForUrl(value: string): PortalRole | null {
  try {
    const fallbackOrigin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
    const url = new URL(value, fallbackOrigin);
    const authOrigin = new URL(getAuthAppUrl(), fallbackOrigin).origin;

    for (const role of Object.keys(portalHomeByRole) as PortalRole[]) {
      const configuredUrl = getPortalDestination(role);
      const candidates = [
        localPortalUrlByRole[role],
        `https://${portalHostByRole[role]}`,
        ...(renderPortalUrlByRole[role] ? [renderPortalUrlByRole[role]] : []),
        ...(portalAliasesByRole[role] ?? []),
        ...(new URL(configuredUrl, fallbackOrigin).origin === authOrigin ? [] : [configuredUrl]),
      ];

      if (candidates.some((candidate) => new URL(candidate, fallbackOrigin).origin === url.origin)) {
        return role;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function rememberPortal(supabase: SupabaseClient, role: PortalRole) {
  const { error } = await supabase.rpc("manfix_set_last_portal", {
    selected_portal: role,
  });
  if (error) throw error;
  if (typeof window !== "undefined") {
    window.localStorage.setItem("manfix-last-portal", role);
  }
}

export async function upsertCustomerProfile(supabase: SupabaseClient, fullName: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Customer account was created. Please confirm your email before signing in.");

  const { error } = await supabase.from("profiles").upsert({
    email: data.user.email ?? null,
    full_name: fullName,
    id: data.user.id,
    role: "customer",
    status: "Active",
  });

  if (error) throw error;
}

export async function updateCustomerProfile(
  supabase: SupabaseClient,
  values: { full_name: string; phone: string | null; avatar_url?: string | null },
) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Authentication required.");
  const { data, error } = await supabase
    .from("profiles")
    .update(values)
    .eq("id", userData.user.id)
    .select("id,email,full_name,phone,avatar_url,role,status,last_portal_role")
    .single();
  if (error) throw error;
  return data as ManHubProfile;
}

export async function uploadCustomerAvatar(supabase: SupabaseClient, file: File) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Authentication required.");
  const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
  const path = `${userData.user.id}/avatar-${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from("profile-avatars").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });
  if (error) throw error;
  return supabase.storage.from("profile-avatars").getPublicUrl(path).data.publicUrl;
}

export async function listCustomerVehicles(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("user_vehicles")
    .select(`
      id,user_id,vehicle_variant_id,plate_number,mileage,nickname,created_at,updated_at,
      vehicle_variant:vehicle_variants(
        id,vehicle_model_id,year,engine,displacement,fuel,transmission,drivetrain,horsepower,torque,tyre_size,engine_oil_capacity,transmission_oil_capacity,coolant_capacity,
        vehicle_model:vehicle_models(
          id,brand_id,model_name,generation,body_type,image_url,production_start_year,production_end_year,
          brand:brands(id,name,logo_url,country)
        )
      )
    `)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CustomerVehicle[];
}

export async function listVehicleBrands(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("brands")
    .select("id,name,logo_url,country")
    .order("name");
  if (error) throw error;
  return (data ?? []) as VehicleBrand[];
}

export async function listVehicleModels(supabase: SupabaseClient, brandId: string) {
  const select = `
    id,brand_id,model_name,generation,body_type,image_url,production_start_year,production_end_year,
    brand:brands(id,name,logo_url,country)
  `;
  const query = supabase
    .from("vehicle_models")
    .select(select)
    .eq("brand_id", brandId)
    .is("discontinued_at", null)
    .order("model_name")
    .order("generation");
  let { data, error } = await query;
  if (isMissingColumnError(error, "discontinued_at")) {
    const retry = await supabase
      .from("vehicle_models")
      .select(select)
      .eq("brand_id", brandId)
      .order("model_name")
      .order("generation");
    data = retry.data;
    error = retry.error;
  }
  if (error) throw error;
  return (data ?? []) as unknown as VehicleModel[];
}

export async function listVehicleVariants(supabase: SupabaseClient, brandId?: string) {
  let modelIds: string[] | undefined;

  if (brandId) {
    const modelQuery = supabase
      .from("vehicle_models")
      .select("id")
      .eq("brand_id", brandId)
      .is("discontinued_at", null);
    let { data: modelRows, error: modelError } = await modelQuery;
    if (isMissingColumnError(modelError, "discontinued_at")) {
      const retry = await supabase
        .from("vehicle_models")
        .select("id")
        .eq("brand_id", brandId);
      modelRows = retry.data;
      modelError = retry.error;
    }
    if (modelError) throw modelError;

    modelIds = (modelRows ?? []).map((model) => model.id as string);
    if (modelIds.length === 0) return [];
  }

  const select = `
    id,vehicle_model_id,year,engine,displacement,fuel,transmission,drivetrain,horsepower,torque,tyre_size,engine_oil_capacity,transmission_oil_capacity,coolant_capacity,
    vehicle_model:vehicle_models(
      id,brand_id,model_name,generation,body_type,image_url,production_start_year,production_end_year,
      brand:brands(id,name,logo_url,country)
    )
  `;
  let query = supabase
    .from("vehicle_variants")
    .select(select)
    .is("discontinued_at", null)
    .order("vehicle_model_id")
    .order("year", { ascending: false });
  if (modelIds) query = query.in("vehicle_model_id", modelIds);
  let { data, error } = await query;
  if (isMissingColumnError(error, "discontinued_at")) {
    let retryQuery = supabase
      .from("vehicle_variants")
      .select(select)
      .order("vehicle_model_id")
      .order("year", { ascending: false });
    if (modelIds) retryQuery = retryQuery.in("vehicle_model_id", modelIds);
    const retry = await retryQuery;
    data = retry.data;
    error = retry.error;
  }
  if (error) throw error;
  return (data ?? []) as unknown as VehicleVariant[];
}

export async function saveCustomerVehicle(
  supabase: SupabaseClient,
  values: CustomerVehicleInput,
  id?: string,
) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Authentication required.");
  const query = id
    ? supabase.from("user_vehicles").update(values).eq("id", id).eq("user_id", userData.user.id)
    : supabase.from("user_vehicles").insert({ ...values, user_id: userData.user.id });
  const { data, error } = await query.select(`
    id,user_id,vehicle_variant_id,plate_number,mileage,nickname,created_at,updated_at,
    vehicle_variant:vehicle_variants(
      id,vehicle_model_id,year,engine,displacement,fuel,transmission,drivetrain,horsepower,torque,tyre_size,engine_oil_capacity,transmission_oil_capacity,coolant_capacity,
      vehicle_model:vehicle_models(
        id,brand_id,model_name,generation,body_type,image_url,production_start_year,production_end_year,
        brand:brands(id,name,logo_url,country)
      )
    )
  `).single();
  if (error) throw error;
  return data as unknown as CustomerVehicle;
}

export async function deleteCustomerVehicle(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("user_vehicles").delete().eq("id", id);
  if (error) throw error;
}

export async function listCustomerCatalog(supabase: SupabaseClient, vehicleVariantId?: string) {
  let compatibleProductIds: string[] | undefined;

  if (vehicleVariantId) {
    const { data: compatibility, error: compatibilityError } = await queryProductCompatibility(
      supabase,
      vehicleVariantId,
    );
    if (compatibilityError) throw compatibilityError;

    compatibleProductIds = (compatibility ?? []).map(
      (match) => match.product_id as string,
    );
    if (compatibleProductIds.length === 0) return [];
  }

  let query = supabase
    .from("supplier_products")
    .select("*")
    .eq("active", true)
    .gt("stock", 0)
    .order("created_at", { ascending: false });
  if (compatibleProductIds) query = query.in("id", compatibleProductIds);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SupplierProduct[];
}

async function queryProductCompatibility(supabase: SupabaseClient, vehicleVariantId: string) {
  const variantCompatibility = await supabase
    .from("product_vehicle_models")
    .select("product_id")
    .eq("vehicle_variant_id", vehicleVariantId);
  if (!isMissingColumnError(variantCompatibility.error, "vehicle_variant_id")) return variantCompatibility;

  const { data: variant, error: variantError } = await supabase
    .from("vehicle_variants")
    .select("vehicle_model_id")
    .eq("id", vehicleVariantId)
    .maybeSingle();
  if (variantError) return { data: null, error: variantError };
  if (!variant?.vehicle_model_id) return { data: [], error: null };

  return supabase
    .from("product_vehicle_models")
    .select("product_id")
    .eq("vehicle_model_id", variant.vehicle_model_id);
}

function isMissingColumnError(error: unknown, column: string) {
  if (!error || typeof error !== "object") return false;
  const details = [
    "code" in error ? String(error.code) : "",
    "message" in error ? String(error.message) : "",
    "details" in error ? String(error.details) : "",
    "hint" in error ? String(error.hint) : "",
  ].join(" ");
  return (details.includes(column) && (details.includes("PGRST204") || details.includes("42703") || details.includes("schema cache")))
    || details.includes(`column ${column} does not exist`);
}

export async function listCustomerCart(supabase: SupabaseClient) {
  const { data: cart, error: cartError } = await supabase
    .from("shopping_carts")
    .select("id")
    .eq("status", "Active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (cartError) throw cartError;
  if (!cart) return [];
  const { data, error } = await supabase
    .from("shopping_cart_items")
    .select("id,quantity,created_at,product:supplier_products(*)")
    .eq("cart_id", cart.id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as CustomerCartItem[];
}

export async function addCustomerCartItem(supabase: SupabaseClient, productId: string, quantity = 1) {
  const { data, error } = await supabase.rpc("manfix_add_cart_item", {
    target_product_id: productId,
    requested_quantity: quantity,
  });
  if (error) throw error;
  return data as string;
}

export async function setCustomerCartQuantity(supabase: SupabaseClient, itemId: string, quantity: number) {
  const { error } = await supabase.rpc("manfix_set_cart_quantity", {
    target_item_id: itemId,
    requested_quantity: quantity,
  });
  if (error) throw error;
}

export async function checkoutCustomerCart(supabase: SupabaseClient, paymentMethod: string) {
  const { data, error } = await supabase.rpc("manfix_checkout_cart", {
    payment_method: paymentMethod,
  });
  if (error) throw error;
  return data as string;
}

export async function listCustomerOrders(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("customer_orders")
    .select("*,items:customer_order_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CustomerOrder[];
}

export async function listCustomerPayments(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("customer_payments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CustomerPayment[];
}

export async function listCustomerServiceInvoices(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("service_invoices")
    .select("id,invoice_number,vehicle_label,description,amount,platform_fee_amount,workshop_net_amount,currency,payment_method,status,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ServiceInvoice[];
}

export async function chooseCustomerServicePayment(
  supabase: SupabaseClient,
  invoiceId: string,
  paymentMethod: string,
) {
  const { error } = await supabase.rpc("manfix_choose_service_payment", {
    target_invoice_id: invoiceId,
    selected_method: paymentMethod,
  });
  if (error) throw error;
}

export async function updateCustomerPayment(
  supabase: SupabaseClient,
  paymentId: string,
  status: "Paid" | "Cancelled" | "Refunded",
) {
  const { error } = await supabase.rpc("manfix_update_customer_payment", {
    target_payment_id: paymentId,
    next_status: status,
  });
  if (error) throw error;
}

export async function listCustomerWarranties(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("warranties")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CustomerWarranty[];
}

export async function listCustomerWarrantyClaims(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("warranty_claims")
    .select("id,warranty_id,description,status,inspection_status,submitted_at")
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CustomerWarrantyClaim[];
}

export async function submitCustomerWarrantyClaim(
  supabase: SupabaseClient,
  warrantyId: string,
  description: string,
  photos: string[] = [],
  videos: string[] = [],
) {
  const { data, error } = await supabase.rpc("manfix_submit_warranty_claim", {
    photo_paths: photos,
    problem_description: description,
    target_warranty_id: warrantyId,
    video_paths: videos,
  });
  if (error) throw error;
  return data as string;
}

export async function listNotifications(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ManFixNotification[];
}

export async function markNotificationRead(supabase: SupabaseClient, notificationId: string) {
  const { error } = await supabase.rpc("manfix_mark_notification_read", {
    target_notification_id: notificationId,
  });
  if (error) throw error;
}

export function subscribeToNotifications(supabase: SupabaseClient, refresh: () => void) {
  const channel = supabase
    .channel("manfix-notifications")
    .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, refresh)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}

export async function listPlatformWorkshops(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("platform_workshops")
    .select("id,owner_id,name,address,city,phone,email,operating_hours,brands_supported,rating,status")
    .in("status", ["Active", "Approved", "Verified"])
    .order("rating", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PlatformWorkshop[];
}

export async function listServiceCatalog(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("service_catalog")
    .select("id,name,description,estimated_price,estimated_duration_minutes")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return (data ?? []) as ServiceCatalogItem[];
}

export async function createCustomerServiceBooking(
  supabase: SupabaseClient,
  values: {
    customer_notes: string | null;
    estimated_price: number;
    service_catalog_id: string;
    service_date: string;
    service_type: string;
    user_vehicle_id: string;
    workshop_owner_id: string;
  },
) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Authentication required.");
  const { data: vehicle, error: vehicleError } = await supabase
    .from("user_vehicles")
    .select(`
      plate_number,
      vehicle_variant:vehicle_variants(
        year,
        vehicle_model:vehicle_models(
          model_name,brand:brands(name)
        )
      )
    `)
    .eq("id", values.user_vehicle_id)
    .single();
  if (vehicleError) throw vehicleError;
  const variant = vehicle.vehicle_variant as unknown as {
    year: number;
    vehicle_model: {
      brand: { name: string };
      model_name: string;
    };
  };
  const vehicleLabel = `${variant.vehicle_model.brand.name} ${variant.vehicle_model.model_name} ${variant.year} - ${vehicle.plate_number}`;
  const { data, error } = await supabase
    .from("service_bookings")
    .insert({ ...values, user_id: userData.user.id, scheduled_at: values.service_date, vehicle_label: vehicleLabel })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function listCustomerBookings(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("service_bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<Record<string, unknown>>;
}

export async function fetchRows<T>(supabase: SupabaseClient, table: string, select = "*") {
  const { data, error } = await supabase.from(table).select(select);
  if (error) throw error;
  return (data ?? []) as T[];
}

async function getRequiredUserId(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("Authentication required.");
  return data.user.id;
}

async function fetchSupplierRows<T>(supabase: SupabaseClient, table: string, select = "*") {
  const roles = await getSessionRoles(supabase);
  if (roles.includes("super_admin")) return fetchRows<T>(supabase, table, select);

  const userId = await getRequiredUserId(supabase);
  const { data, error } = await supabase.from(table).select(select).eq("supplier_id", userId);
  if (error) throw error;
  return (data ?? []) as T[];
}

export async function updateStatus(supabase: SupabaseClient, table: string, id: string, status: string) {
  const { error } = await supabase.from(table).update({ status }).eq("id", id);
  if (error) throw error;
}

export async function insertRow<T extends Record<string, unknown>>(supabase: SupabaseClient, table: string, values: T) {
  const { data, error } = await supabase.from(table).insert(values).select().single();
  if (error) throw error;
  return data as T;
}

export async function deleteRow(supabase: SupabaseClient, table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

const partnerApplicationTable: Record<PartnerApplicationType, string> = {
  supplier: "supplier_applications",
  technician: "technician_applications",
  workshop: "workshop_applications",
};

export function getPartnerApplicationTable(type: PartnerApplicationType) {
  return partnerApplicationTable[type];
}

export async function submitPartnerApplication(
  supabase: SupabaseClient,
  type: PartnerApplicationType,
  values: Record<string, unknown>,
) {
  const { error } = await supabase
    .from(getPartnerApplicationTable(type))
    .insert(values);

  if (error?.code === "23505") {
    throw new Error("An application for this email is already pending review.");
  }
  if (error) throw error;
}

export async function uploadPartnerApplicationFiles(
  supabase: SupabaseClient,
  type: PartnerApplicationType,
  applicationId: string,
  slot: string,
  files: File[],
) {
  const uploadedPaths: string[] = [];

  for (const [index, file] of files.entries()) {
    const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "bin";
    const path = `${type}/${applicationId}/${slot}-${Date.now()}-${index}.${extension}`;
    const { error } = await supabase.storage
      .from("partner-application-documents")
      .upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (error) throw error;
    uploadedPaths.push(path);
  }

  return uploadedPaths;
}

export async function listPartnerApplications(
  supabase: SupabaseClient,
  type: PartnerApplicationType,
) {
  const { data, error } = await supabase
    .from(getPartnerApplicationTable(type))
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PartnerApplicationRecord[];
}

export async function reviewPartnerApplication(
  supabase: SupabaseClient,
  type: PartnerApplicationType,
  applicationId: string,
  action: "approve" | "reject",
  notes: string,
) {
  const { data, error } = await supabase.functions.invoke("review-partner-application", {
    body: {
      action,
      applicationId,
      applicationType: type,
      notes,
    },
  });
  if (error) throw error;
  if (data?.error) throw new Error(String(data.error));
  return data as { accountUserId?: string; message?: string; status: PartnerApplicationStatus };
}

export async function savePartnerApplicationNotes(
  supabase: SupabaseClient,
  type: PartnerApplicationType,
  applicationId: string,
  notes: string,
) {
  const { error } = await supabase
    .from(getPartnerApplicationTable(type))
    .update({ admin_notes: notes.trim() || null })
    .eq("id", applicationId);
  if (error) throw error;
}

export async function createPartnerDocumentLinks(
  supabase: SupabaseClient,
  paths: string[],
) {
  if (paths.length === 0) return [];

  const { data, error } = await supabase.storage
    .from("partner-application-documents")
    .createSignedUrls(paths, 600);
  if (error) throw error;

  return data.flatMap((item, index) => item.signedUrl ? [{
    name: paths[index]?.split("/").pop() ?? `Document ${index + 1}`,
    path: paths[index],
    url: item.signedUrl,
  }] : []);
}

export async function listWorkshopBookings(supabase: SupabaseClient) {
  const columns = "id,vehicle_label,symptom,scheduled_at,status,payment_status,estimated_price,technician_dispatch_expires_at";
  const [serviceResult, liftResult] = await Promise.all([
    supabase.from("service_bookings").select(columns),
    supabase.from("lift_bookings").select(columns),
  ]);

  const error = serviceResult.error ?? liftResult.error;
  if (error) throw error;

  const serviceRows = (serviceResult.data ?? []).map((row) => ({
    ...row,
    booking_kind: "service" as const,
  }));
  const liftRows = (liftResult.data ?? []).map((row) => ({
    ...row,
    booking_kind: "lift" as const,
  }));

  return [...serviceRows, ...liftRows]
    .filter((row) => !["cancelled", "rejected"].includes(String(row.status)))
    .filter((row) => row.booking_kind === "lift" || row.status !== "pending" || !row.technician_dispatch_expires_at || new Date(row.technician_dispatch_expires_at).getTime() <= Date.now())
    .sort((a, b) => String(a.scheduled_at).localeCompare(String(b.scheduled_at))) as WorkshopBooking[];
}

export async function setWorkshopBookingStatus(
  supabase: SupabaseClient,
  bookingKind: WorkshopBooking["booking_kind"],
  bookingId: string,
  status: "approved" | "cancelled" | "completed",
) {
  const { error } = await supabase.rpc("manfix_workshop_update_booking_status", {
    booking_id: bookingId,
    booking_kind: bookingKind,
    next_status: status,
  });
  if (error) throw error;
}

export async function listRepairJobs(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("repair_jobs")
    .select("id,booking_kind,customer_name,vehicle_label,diagnosis,technician_name,scheduled_at,status,created_at,estimated_amount,final_amount")
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as RepairJob[];
}

export async function listTechnicianRepairOffers(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("repair_job_offers")
    .select("id,service_booking_id,status,expires_at,created_at,booking:service_bookings(vehicle_label,symptom,service_type,scheduled_at,estimated_price)")
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as RepairJobOffer[];
}

export async function respondToRepairOffer(supabase: SupabaseClient, offerId: string, accept: boolean) {
  const { error } = await supabase.rpc("manfix_respond_repair_offer", {
    target_offer_id: offerId,
    accept_offer: accept,
  });
  if (error) throw error;
}

export async function completeWorkshopRepair(supabase: SupabaseClient, repairJobId: string, amount: number) {
  const { data, error } = await supabase.rpc("manfix_workshop_complete_repair", {
    target_repair_job_id: repairJobId,
    charged_amount: amount,
  });
  if (error) throw error;
  return data as string;
}

export async function listWorkshopServiceInvoices(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("service_invoices")
    .select("id,invoice_number,vehicle_label,description,amount,platform_fee_amount,workshop_net_amount,currency,payment_method,status,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ServiceInvoice[];
}

export async function setWorkshopRepairStatus(
  supabase: SupabaseClient,
  repairJobId: string,
  status: RepairJob["status"],
) {
  const { error } = await supabase.rpc("manfix_workshop_update_repair_status", {
    next_status: status,
    repair_job_id: repairJobId,
  });
  if (error) throw error;
}

export async function assignRepairTechnician(
  supabase: SupabaseClient,
  repairJobId: string,
  technicianId: string,
) {
  const { error } = await supabase.rpc("manfix_assign_repair_technician", {
    target_repair_job_id: repairJobId,
    target_technician_id: technicianId,
  });
  if (error) throw error;
}

export function subscribeToWorkshopOperations(
  supabase: SupabaseClient,
  onChange: () => void,
) {
  const channel = supabase
    .channel(`workshop-operations-${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "service_bookings" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "lift_bookings" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "repair_jobs" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "repair_job_offers" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "service_invoices" }, onChange)
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function listSupplierProducts(supabase: SupabaseClient) {
  return fetchSupplierRows<SupplierProduct>(supabase, "supplier_products");
}

export async function saveSupplierProduct(supabase: SupabaseClient, values: SupplierProductInput, id?: string) {
  const userId = await getRequiredUserId(supabase);
  if (id) {
    const editableValues: Partial<SupplierProductInput> = { ...values };
    delete editableValues.incoming_stock;
    delete editableValues.stock;
    const { data, error } = await supabase
      .from("supplier_products")
      .update(editableValues)
      .eq("id", id)
      .eq("supplier_id", userId)
      .select()
      .single();
    if (error) throw error;
    return data as SupplierProduct;
  }

  const { data, error } = await supabase
    .from("supplier_products")
    .insert({ ...values, supplier_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data as SupplierProduct;
}

export async function deleteSupplierProduct(supabase: SupabaseClient, id: string) {
  const userId = await getRequiredUserId(supabase);
  const { error } = await supabase.from("supplier_products").delete().eq("id", id).eq("supplier_id", userId);
  if (error) throw error;
}

export async function uploadSupplierProductImage(supabase: SupabaseClient, productId: string, file: File) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Sign in is required before uploading product images.");

  const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
  const path = `${userData.user.id}/${productId}/${Date.now()}.${extension}`;
  const { error } = await supabase.storage
    .from("supplier-product-images")
    .upload(path, file, { contentType: file.type || "image/jpeg", upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from("supplier-product-images").getPublicUrl(path);
  const imageUrl = data.publicUrl;
  const { error: updateError } = await supabase.from("supplier_products").update({ image_url: imageUrl }).eq("id", productId).eq("supplier_id", userData.user.id);
  if (updateError) throw updateError;
  return imageUrl;
}

export async function listProductCategories(supabase: SupabaseClient) {
  return fetchRows<ProductCategory>(supabase, "product_categories");
}

export async function listSupplierOrders(supabase: SupabaseClient) {
  return fetchSupplierRows<SupplierOrder>(supabase, "supplier_orders");
}

export async function setSupplierOrderStatus(supabase: SupabaseClient, orderId: string, status: SupplierOrder["status"]) {
  const { error } = await supabase.rpc("manhub_supplier_update_order_status", {
    next_status: status,
    target_order_id: orderId,
  });
  if (error) throw error;
}

export async function listSupplierStockHistory(supabase: SupabaseClient) {
  return fetchSupplierRows<SupplierStockHistory>(supabase, "supplier_stock_history");
}

export async function listSupplierCommissions(supabase: SupabaseClient) {
  return fetchSupplierRows<SupplierCommission>(supabase, "supplier_commissions");
}

export async function getSupplierCommissionRate(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("manfix_get_supplier_commission_rate");
  if (error) throw error;
  return Number(data);
}

export async function adjustSupplierStock(
  supabase: SupabaseClient,
  productId: string,
  movementType: Extract<SupplierStockHistory["change_type"], "Incoming" | "Adjustment">,
  quantity: number,
  note: string,
) {
  const { error } = await supabase.rpc("manhub_supplier_adjust_stock", {
    movement_note: note || null,
    movement_quantity: quantity,
    movement_type: movementType,
    target_product_id: productId,
  });
  if (error) throw error;
}

export async function getSupplierWallet(supabase: SupabaseClient) {
  const userId = await getRequiredUserId(supabase);
  const { data, error } = await supabase.from("supplier_wallets").select("*").eq("supplier_id", userId).maybeSingle();
  if (error) throw error;
  return data as SupplierWallet | null;
}

export async function listSupplierWithdrawals(supabase: SupabaseClient) {
  return fetchSupplierRows<SupplierWithdrawal>(supabase, "supplier_withdrawals");
}

export async function submitSupplierWithdrawal(supabase: SupabaseClient, amount: number, bank: string, accountNumber: string) {
  const { data, error } = await supabase.rpc("manhub_supplier_submit_withdrawal", {
    requested_account_number: accountNumber,
    requested_amount: amount,
    requested_bank: bank,
  });
  if (error) throw error;
  return data as string;
}

export async function listSupplierInvoices(supabase: SupabaseClient) {
  return fetchSupplierRows<SupplierInvoice>(supabase, "supplier_invoices");
}

export async function listSupplierWarrantyClaims(supabase: SupabaseClient) {
  const roles = await getSessionRoles(supabase);
  if (roles.includes("super_admin")) return fetchRows<SupplierWarrantyClaim>(supabase, "warranty_claims");

  const userId = await getRequiredUserId(supabase);
  const { data, error } = await supabase.from("warranty_claims").select("*").eq("supplier_id", userId);
  if (error) throw error;
  return (data ?? []) as SupplierWarrantyClaim[];
}

export async function reviewSupplierWarrantyClaim(
  supabase: SupabaseClient,
  claimId: string,
  status: Exclude<SupplierWarrantyClaim["status"], "Pending Review">,
) {
  const { error } = await supabase.rpc("manhub_supplier_review_warranty_claim", {
    next_status: status,
    target_claim_id: claimId,
  });
  if (error) throw error;
}

export async function updateWorkshopWarrantyClaim(
  supabase: SupabaseClient,
  claimId: string,
  inspectionStatus: "Accepted" | "Scheduled" | "Report uploaded" | "Replacement recommended",
  report?: string,
) {
  const { error } = await supabase.rpc("manfix_workshop_update_warranty_claim", {
    next_inspection_status: inspectionStatus,
    report_text: report?.trim() || null,
    target_claim_id: claimId,
  });
  if (error) throw error;
}

export async function resolveMetric(supabase: SupabaseClient, metric: MetricQuery) {
  let query = supabase.from(metric.table).select(metric.column ?? "id", {
    count: metric.type === "count" ? "exact" : undefined,
    head: metric.type === "count",
  });

  Object.entries(metric.filter ?? {}).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const { count, data, error } = await query;
  if (error) throw error;

  if (metric.type === "count") {
    return count ?? 0;
  }

  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
  return rows.reduce((sum, row) => sum + Number(row[metric.column ?? "amount"] ?? 0), 0);
}

export function isPortalRole(role: unknown): role is PortalRole {
  return role === "customer"
    || role === "supplier"
    || role === "workshop"
    || role === "technician"
    || role === "admin";
}

function isManHubRole(role: unknown): role is ManHubRole {
  return isPortalRole(role) || role === "super_admin";
}

function isEnabledStatus(status: string) {
  return status === "Active" || status === "Approved" || status === "Verified";
}
