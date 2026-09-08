import { StrictMode, useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { signOut, SwitchPortalButton, usePortalAuth } from "@manhub/auth";
import {
  createManHubSupabaseClient,
  getLogoutUrl,
  listTechnicianRepairOffers,
  listRepairJobs,
  respondToRepairOffer,
  setWorkshopRepairStatus,
  subscribeToWorkshopOperations,
  type ManHubProfile,
  type RepairJob,
  type RepairJobOffer,
} from "@manhub/backend";
import { technicianRoutes } from "@manhub/platform-config";
import { Button, Card, DataTable, EmptyState, NotificationsPanel, PageHeader, PortalShell, StatGrid } from "@manhub/ui";

type Client = NonNullable<ReturnType<typeof createManHubSupabaseClient>>;

function TechnicianApp() {
  const supabase = useMemo(() => createManHubSupabaseClient(), []);
  const auth = usePortalAuth(supabase, "technician");
  const [notice, setNotice] = useState("Technician operations are connected.");
  const [signingOut, setSigningOut] = useState(false);

  const run = useCallback(async (task: () => Promise<void>, success: string) => {
    try {
      await task();
      setNotice(success);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Action failed.");
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    if (!supabase || signingOut) return;
    setSigningOut(true);
    try {
      await signOut(supabase);
      window.location.replace(getLogoutUrl());
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to log out.");
      setSigningOut(false);
    }
  }, [signingOut, supabase]);

  if (!supabase) {
    return <PortalShell eyebrow="Technician" routes={technicianRoutes} title="ManFix"><EmptyState text="Add Supabase environment variables to run Technician Operations." /></PortalShell>;
  }
  if (auth.loading || auth.redirecting) {
    return <PortalShell eyebrow="Technician" routes={[]} title="ManFix"><EmptyState text={auth.redirecting ? "Redirecting to secure sign-in..." : "Checking technician access..."} /></PortalShell>;
  }
  if (!auth.allowed) {
    return <PortalShell eyebrow="Technician" routes={[]} title="ManFix"><EmptyState text="Approved technician access is required." /></PortalShell>;
  }

  return (
    <PortalShell eyebrow="Technician Operations" routes={technicianRoutes} title="ManFix">
      <PageHeader title={auth.profile?.full_name || "Workshop Floor"}>
        <div className="mh-actions">
          <Button tone="ghost" onClick={auth.refresh}>Refresh</Button>
          <SwitchPortalButton supabase={supabase} />
          <Button tone="danger" onClick={() => void handleSignOut()}>
            {signingOut ? "Logging out..." : "Log out"}
          </Button>
        </div>
      </PageHeader>
      <Card tone="blue"><strong>{notice}</strong></Card>
      <TechnicianOfferPrompt run={run} supabase={supabase} />
      <Routes>
        <Route path="/" element={<Today supabase={supabase} />} />
        <Route path="/orders" element={<IncomingOrders run={run} supabase={supabase} />} />
        <Route path="/jobs" element={<RepairJobs run={run} supabase={supabase} />} />
        <Route path="/schedule" element={<Schedule supabase={supabase} />} />
        <Route path="/notifications" element={<NotificationsPanel supabase={supabase} />} />
        <Route path="/profile" element={<Profile profile={auth.profile} supabase={supabase} />} />
      </Routes>
    </PortalShell>
  );
}

function TechnicianOfferPrompt({ run, supabase }: ActionProps) {
  const [offers, refresh] = useRepairOffers(supabase);
  const offer = offers[0];
  if (!offer) return null;
  return <Card tone="blue">
    <h2 className="mh-card-title">New job — claim now</h2>
    <p><strong>{offer.booking.vehicle_label}</strong> · {offer.booking.service_type} · {formatMoney(offer.booking.estimated_price)}</p>
    <p>{offer.booking.symptom}</p>
    <div className="mh-actions">
      <Button onClick={() => void run(async () => { await respondToRepairOffer(supabase, offer.id, true); await refresh(); }, "You claimed the repair job.")}>Claim job</Button>
      <Button tone="danger" onClick={() => void run(async () => { await respondToRepairOffer(supabase, offer.id, false); await refresh(); }, "Offer passed to other technicians.")}>Pass</Button>
    </div>
  </Card>;
}

function Today({ supabase }: { supabase: Client }) {
  const [offers] = useRepairOffers(supabase);
  const [jobs] = useRepairJobs(supabase);
  const activeJobs = jobs.filter((job) => ["queued", "in_progress"].includes(job.status)).length;
  const readyJobs = jobs.filter((job) => job.status === "ready").length;

  return (
    <>
      <StatGrid items={[
        ["Jobs available", offers.length],
        ["My assigned jobs", jobs.length],
        ["Active Repairs", activeJobs],
        ["Ready for Pickup", readyJobs],
      ]} />
      <div className="mh-grid-2">
        <OfferTable rows={offers} title="Jobs to claim" />
        <JobTable rows={jobs.filter((job) => job.status !== "completed")} title="Workshop Floor" />
      </div>
    </>
  );
}

function IncomingOrders({ run, supabase }: ActionProps) {
  const [rows, refresh] = useRepairOffers(supabase);
  const update = (row: RepairJobOffer, accept: boolean) => {
    void run(async () => {
      await respondToRepairOffer(supabase, row.id, accept);
      await refresh();
    }, accept ? "You claimed the repair job." : "Offer declined. The job remains available to other technicians.");
  };

  return (
    <Card>
      <h2 className="mh-card-title">Incoming Orders</h2>
      <DataTable
        headers={["Vehicle", "Service", "Problem", "Scheduled", "Estimate", "Actions"]}
        rows={rows.map((row) => [
          row.booking.vehicle_label,
          row.booking.service_type,
          row.booking.symptom,
          formatDate(row.booking.scheduled_at),
          formatMoney(row.booking.estimated_price),
          <div className="mh-actions"><Button onClick={() => update(row, true)}>Claim job</Button><Button tone="danger" onClick={() => update(row, false)}>Pass</Button></div>,
        ])}
      />
    </Card>
  );
}

function RepairJobs({ run, supabase }: ActionProps) {
  const [rows, refresh] = useRepairJobs(supabase);
  const update = (id: string, status: RepairJob["status"]) => {
    void run(async () => {
      await setWorkshopRepairStatus(supabase, id, status);
      await refresh();
    }, `Repair job marked ${labelize(status)}.`);
  };

  return (
    <Card>
      <h2 className="mh-card-title">Assigned Repair Jobs</h2>
      <DataTable
        headers={["Customer", "Vehicle", "Diagnosis", "Technician", "Status", "Actions"]}
        rows={rows.map((row) => [
          row.customer_name,
          row.vehicle_label,
          row.diagnosis,
          row.technician_name ?? "Unassigned",
          labelize(row.status),
          <div className="mh-actions">
            {row.status === "queued" && <Button onClick={() => update(row.id, "in_progress")}>Start</Button>}
            {row.status === "in_progress" && <Button onClick={() => update(row.id, "ready")}>Mark ready</Button>}
            {row.status === "ready" && "Waiting for workshop to confirm amount"}
            {row.status === "completed" && "Completed"}
          </div>,
        ])}
      />
    </Card>
  );
}

function OfferTable({ rows, title }: { rows: RepairJobOffer[]; title: string }) {
  return <Card><h2 className="mh-card-title">{title}</h2><DataTable headers={["Vehicle", "Service", "Estimate"]} rows={rows.map((row) => [row.booking.vehicle_label, row.booking.service_type, formatMoney(row.booking.estimated_price)])} /></Card>;
}

function Schedule({ supabase }: { supabase: Client }) {
  const [rows] = useRepairJobs(supabase);
  const scheduled = rows.filter((row) => row.status !== "completed");
  return (
    <Card>
      <h2 className="mh-card-title">Accepted Schedule</h2>
      <DataTable
        headers={["Time", "Type", "Vehicle", "Problem", "Status"]}
        rows={scheduled.map((row) => [
          formatDate(row.scheduled_at),
          labelize(row.booking_kind),
          row.vehicle_label,
          row.diagnosis,
          labelize(row.status),
        ])}
      />
    </Card>
  );
}

function Profile({ profile, supabase }: { profile: ManHubProfile | null; supabase: Client }) {
  return (
    <div className="mh-grid-2">
      <Card>
        <h2 className="mh-card-title">Technician Access</h2>
        <div className="mh-detail-grid">
          <div className="mh-detail"><span>Name</span><strong>{profile?.full_name || profile?.email || "-"}</strong></div>
          <div className="mh-detail"><span>Email</span><strong>{profile?.email || "-"}</strong></div>
          <div className="mh-detail"><span>Status</span><strong>{profile?.status || "-"}</strong></div>
        </div>
      </Card>
      <Card tone="blue">
        <h2 className="mh-card-title">Portal Access</h2>
        <p>Open another assigned ManFix portal without signing out.</p>
        <SwitchPortalButton supabase={supabase} />
      </Card>
    </div>
  );
}

function JobTable({ rows, title }: { rows: RepairJob[]; title: string }) {
  return (
    <Card>
      <h2 className="mh-card-title">{title}</h2>
      <DataTable
        headers={["Vehicle", "Diagnosis", "Status"]}
        rows={rows.map((row) => [row.vehicle_label, row.diagnosis, labelize(row.status)])}
      />
    </Card>
  );
}

function useRepairOffers(supabase: Client) {
  const [rows, setRows] = useState<RepairJobOffer[]>([]);
  const refresh = useCallback(async () => setRows(await listTechnicianRepairOffers(supabase)), [supabase]);
  useEffect(() => {
    void refresh().catch(() => setRows([]));
    const unsubscribe = subscribeToWorkshopOperations(supabase, () => void refresh().catch(() => setRows([])));
    const timer = window.setInterval(() => void refresh().catch(() => setRows([])), 15_000);
    return () => { unsubscribe(); window.clearInterval(timer); };
  }, [refresh, supabase]);
  return [rows, refresh] as const;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(value);
}

function useRepairJobs(supabase: Client) {
  const [rows, setRows] = useState<RepairJob[]>([]);
  const refresh = useCallback(async () => setRows(await listRepairJobs(supabase)), [supabase]);
  useEffect(() => {
    void refresh().catch(() => setRows([]));
    return subscribeToWorkshopOperations(supabase, () => void refresh().catch(() => setRows([])));
  }, [refresh, supabase]);
  return [rows, refresh] as const;
}

function labelize(value: string) {
  return value.split("_").join(" ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(input: string) {
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? input : date.toLocaleString("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type ActionProps = {
  run: (task: () => Promise<void>, success: string) => Promise<void>;
  supabase: Client;
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TechnicianApp />
    </BrowserRouter>
  </StrictMode>,
);
