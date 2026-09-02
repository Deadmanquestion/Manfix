import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addCustomerCartItem,
  checkoutCustomerCart,
  createCustomerServiceBooking,
  deleteCustomerVehicle,
  getManFixApiUrl,
  listCustomerBookings,
  listCustomerCart,
  listCustomerCatalog,
  listCustomerOrders,
  listCustomerPayments,
  listCustomerWarranties,
  listCustomerWarrantyClaims,
  listCustomerVehicles,
  listNotifications,
  listPlatformWorkshops,
  listServiceCatalog,
  listVehicleBrands,
  listVehicleModels,
  listVehicleVariants,
  markNotificationRead,
  saveCustomerVehicle,
  setCustomerCartQuantity,
  subscribeToNotifications,
  submitCustomerWarrantyClaim,
  updateCustomerPayment,
  updateCustomerProfile,
  uploadCustomerAvatar,
  type CustomerCartItem,
  type CustomerOrder,
  type CustomerPayment,
  type CustomerVehicle,
  type CustomerVehicleInput,
  type CustomerWarranty,
  type CustomerWarrantyClaim,
  type ManFixNotification,
  type ManHubProfile,
  type PlatformWorkshop,
  type ServiceCatalogItem,
  type SupplierProduct,
  type VehicleBrand,
  type VehicleModel,
  type VehicleVariant,
} from "@manhub/backend";
import "./customer-app.css";

type Props = {
  onSignOut: () => Promise<void>;
  onSwitchPortal?: () => Promise<void>;
  profile: ManHubProfile;
  supabase: SupabaseClient;
};

type Notice = { message: string; tone: "success" | "error" } | null;

const money = new Intl.NumberFormat("en-MY", { currency: "MYR", style: "currency" });

function vehicleName(vehicle: CustomerVehicle) {
  const model = vehicle.vehicle_variant.vehicle_model;
  return `${model.brand.name} ${model.model_name}`;
}

function vehicleOptionLabel(vehicle: CustomerVehicle) {
  return `${vehicleName(vehicle)} - ${vehicle.plate_number}`;
}

function variantName(variant: VehicleVariant) {
  return `${variant.vehicle_model.brand.name} ${variant.vehicle_model.model_name}`;
}

function vehicleImageUrl(imageUrl?: string | null) {
  return imageUrl?.trim() || null;
}

function VehicleModelImage({ alt, className = "", imageUrl }: { alt: string; className?: string; imageUrl?: string | null }) {
  const src = vehicleImageUrl(imageUrl);
  if (!src) return <div aria-label="Vehicle image unavailable" className={`vehicle-image-missing ${className}`.trim()}>Image unavailable</div>;
  return <img alt={alt} className={className || undefined} src={src} />;
}

function sortedVehicleVariants(variants: VehicleVariant[]) {
  return [...variants].sort((first, second) => {
    if (second.year !== first.year) return second.year - first.year;
    return [
      first.engine.localeCompare(second.engine),
      first.transmission.localeCompare(second.transmission),
      first.drivetrain.localeCompare(second.drivetrain),
    ].find((result) => result !== 0) ?? 0;
  });
}

function distinctYearVariants(variants: VehicleVariant[], preferredVariantId?: string) {
  const byYear = new Map<number, VehicleVariant>();
  for (const variant of sortedVehicleVariants(variants)) {
    if (!byYear.has(variant.year)) byYear.set(variant.year, variant);
  }
  if (preferredVariantId) {
    const preferred = variants.find((variant) => variant.id === preferredVariantId);
    if (preferred) byYear.set(preferred.year, preferred);
  }
  return Array.from(byYear.values()).sort((first, second) => second.year - first.year);
}

export default function CustomerApp({ onSignOut, onSwitchPortal, profile: initialProfile, supabase }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [notice, setNotice] = useState<Notice>(null);
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    const rows = await listNotifications(supabase);
    setUnread(rows.filter((row) => !row.read_at).length);
  }, [supabase]);

  useEffect(() => {
    void refreshUnread().catch(() => setUnread(0));
    return subscribeToNotifications(supabase, () => void refreshUnread().catch(() => setUnread(0)));
  }, [refreshUnread, supabase]);

  const run = useCallback(async (task: () => Promise<void>, success: string) => {
    try {
      await task();
      setNotice({ message: success, tone: "success" });
    } catch (error) {
      setNotice({ message: getErrorMessage(error), tone: "error" });
    }
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 4_000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <main className="customer-stage">
      <section className="customer-phone">
        <Header unread={unread} />
        {notice && <button className={`customer-notice ${notice.tone}`} onClick={() => setNotice(null)}>{notice.message}</button>}
        <section className="customer-content">
          <Routes>
            <Route path="/" element={<Home supabase={supabase} profile={profile} />} />
            <Route path="/vehicles" element={<Vehicles run={run} supabase={supabase} />} />
            <Route path="/diagnosis" element={<Diagnosis supabase={supabase} />} />
            <Route path="/parts" element={<Parts run={run} supabase={supabase} />} />
            <Route path="/cart" element={<Cart run={run} supabase={supabase} />} />
            <Route path="/orders" element={<Orders supabase={supabase} />} />
            <Route path="/book-service" element={<BookService run={run} supabase={supabase} />} />
            <Route path="/workshops" element={<BookService run={run} supabase={supabase} />} />
            <Route path="/notifications" element={<Notifications onUnreadChange={setUnread} supabase={supabase} />} />
            <Route path="/payments" element={<Payments run={run} supabase={supabase} />} />
            <Route path="/warranty" element={<Warranty run={run} supabase={supabase} />} />
            <Route path="/profile" element={<Profile
              onProfileChange={setProfile}
              onSignOut={onSignOut}
              onSwitchPortal={onSwitchPortal}
              profile={profile}
              run={run}
              supabase={supabase}
            />} />
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        </section>
        <BottomNav unread={unread} />
      </section>
    </main>
  );
}

function Header({ unread }: { unread: number }) {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="customer-header">
      <strong>{time.toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" })}</strong>
      <Link aria-label="Notifications" className="header-alert" to="/notifications">
        <span className="bell-icon" />
        {unread > 0 && <b>{unread > 9 ? "9+" : unread}</b>}
      </Link>
    </header>
  );
}

function Home({ profile, supabase }: { profile: ManHubProfile; supabase: SupabaseClient }) {
  const vehicles = useResource(() => listCustomerVehicles(supabase), [supabase], [] as CustomerVehicle[], "vehicles");
  const products = useResource(() => listCustomerCatalog(supabase), [supabase], [] as SupplierProduct[], "parts catalog");
  const orders = useResource(() => listCustomerOrders(supabase), [supabase], [] as CustomerOrder[], "orders");
  const cart = useResource(() => listCustomerCart(supabase), [supabase], [] as CustomerCartItem[], "cart");
  const firstName = (profile.full_name || profile.email || "Customer").trim().split(/\s+/)[0];
  const vehicle = vehicles.data[0];
  const latestOrder = orders.data[0];
  const orderProgress = getOrderProgress(latestOrder?.status);

  return (
    <section className="home-dashboard">
      <h1>Hi {firstName}</h1>
      <Link className={`home-vehicle-card ${vehicle ? "" : "empty"}`} to="/vehicles">
        <div>
          <strong>{vehicle ? vehicleName(vehicle) : "Add your vehicle"}</strong>
          <span>{vehicle ? [vehicle.plate_number, vehicle.vehicle_variant.year].join(" · ") : "Keep service and ownership details together"}</span>
          <small>{vehicle ? "Mileage" : "Vehicle profile"}</small>
          <b>{vehicle ? `${vehicle.mileage.toLocaleString()} km` : "Get started"}</b>
        </div>
        {vehicle
          ? <VehicleModelImage alt="" className="home-vehicle-image" imageUrl={vehicle.vehicle_variant.vehicle_model.image_url} />
          : <span aria-hidden="true" className="vehicle-visual"><i /><i /></span>}
        <span className="home-chevron">&gt;</span>
      </Link>
      <Link className="home-diagnosis-card" to="/diagnosis">
        <span className="cta-icon" />
        <span>
          <strong>AI Diagnosis</strong>
          <small>Describe your car problem</small>
          <em>Upload photos or record engine noise</em>
        </span>
        <span className="home-chevron">&gt;</span>
      </Link>
      <Link className="home-job-card" to={latestOrder ? "/orders" : "/book-service"}>
        <span className="job-icon" />
        <span>
          <small>{latestOrder ? latestOrder.order_number : "Service booking"}</small>
          <strong>{latestOrder ? latestOrder.status : "Book your next service"}</strong>
          <em>{latestOrder ? `${latestOrder.items.length} item${latestOrder.items.length === 1 ? "" : "s"} · ${money.format(latestOrder.total)}` : "Choose a vehicle, workshop, and service"}</em>
          <i className="job-progress-bar"><b style={{ width: `${orderProgress}%` }} /></i>
        </span>
        <span className="home-chevron">&gt;</span>
      </Link>
      <div className="quick-actions">
        <Link to="/vehicles"><span className="quick-icon car" /><strong>My vehicles</strong><span className="tile-chevron">&gt;</span></Link>
        <Link to="/parts"><span className="quick-icon wheel" /><strong>Spare parts</strong><span className="tile-chevron">&gt;</span></Link>
        <Link to="/orders"><span className="quick-icon document" /><strong>Orders</strong><span className="tile-chevron">&gt;</span></Link>
      </div>
      <div className="home-account-summary">
        <Link to="/cart"><span>Cart</span><strong>{cart.data.reduce((sum, item) => sum + item.quantity, 0)}</strong></Link>
        <Link to="/parts"><span>Available parts</span><strong>{products.data.length}</strong></Link>
        <Link to="/payments"><span>Payments due</span><strong>{orders.data.filter((order) => order.payment_status === "Pending").length}</strong></Link>
      </div>
      <ResourceMessage resources={[vehicles, products, orders, cart]} />
    </section>
  );
}

function getOrderProgress(status?: CustomerOrder["status"]) {
  if (!status) return 0;
  return {
    "Pending Supplier Acceptance": 20,
    Processing: 45,
    "Partially Rejected": 45,
    Dispatched: 75,
    Completed: 100,
    Cancelled: 0,
  }[status];
}

type DiagnosisResult = {
  confidence: number;
  diagnosis: string;
  estimated_cost_range: string;
  possible_causes: string[];
  recommended_actions: string[];
  recommended_parts: string[];
};

function Diagnosis({ supabase }: { supabase: SupabaseClient }) {
  const vehicles = useResource(() => listCustomerVehicles(supabase), [supabase], [] as CustomerVehicle[]);
  const [vehicleId, setVehicleId] = useState("");
  const [symptom, setSymptom] = useState("");
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!vehicleId && vehicles.data[0]) setVehicleId(vehicles.data[0].id); }, [vehicleId, vehicles.data]);
  const vehicle = vehicles.data.find((item) => item.id === vehicleId);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!vehicle) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) throw new Error("Your session has expired. Please sign in again.");
      const response = await fetch(`${getManFixApiUrl().replace(/\/$/, "")}/api/diagnose`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symptom,
          userVehicleId: vehicle.id,
          vehicleVariantId: vehicle.vehicle_variant_id,
        }),
      });
      const payload = await response.json() as DiagnosisResult & { error?: string };
      if (!response.ok) throw new Error(payload.error || "AI diagnosis is unavailable.");
      setResult(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI diagnosis is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="AI diagnosis">
      <ResourceMessage resources={[vehicles]} />
      {vehicles.data.length === 0 ? <Empty text="Add a vehicle before starting a diagnosis." /> : (
        <form className="customer-form" onSubmit={(event) => void submit(event)}>
          <Select label="Vehicle" value={vehicleId} onChange={setVehicleId} options={vehicles.data.map((item) => ({ label: vehicleOptionLabel(item), value: item.id }))} />
          {vehicle && <VehicleIdentity vehicle={vehicle} />}
          <label>Describe the problem<textarea required rows={5} value={symptom} onChange={(event) => setSymptom(event.target.value)} /></label>
          <button className="primary-button" disabled={loading || !symptom.trim()} type="submit">{loading ? "Analysing..." : "Run AI pre-diagnosis"}</button>
        </form>
      )}
      {error && <p className="resource-message error">{error}</p>}
      {result && <article className="record-card diagnosis-result">
        <div><strong>{result.diagnosis}</strong><Status value={`${result.confidence}% confidence`} /></div>
        <dl><div><dt>Cost estimate</dt><dd>{result.estimated_cost_range}</dd></div></dl>
        <ResultList title="Possible causes" values={result.possible_causes} />
        <ResultList title="Recommended actions" values={result.recommended_actions} />
        <ResultList title="Recommended parts" values={result.recommended_parts} />
        <p>This is an AI pre-diagnosis. A certified technician will confirm before final quote.</p>
      </article>}
    </Page>
  );
}

function ResultList({ title, values }: { title: string; values: string[] }) {
  return <section className="result-list"><strong>{title}</strong><ul>{values.map((value) => <li key={value}>{value}</li>)}</ul></section>;
}

function VehicleIdentity({ vehicle }: { vehicle: CustomerVehicle }) {
  const model = vehicle.vehicle_variant.vehicle_model;
  return (
    <div className="vehicle-identity">
      <VehicleModelImage alt={vehicleName(vehicle)} imageUrl={model.image_url} />
      <span>
        <strong>{vehicle.nickname || vehicleName(vehicle)}</strong>
        <small>{vehicle.vehicle_variant.year} · {vehicle.vehicle_variant.engine} · {vehicle.plate_number}</small>
      </span>
    </div>
  );
}

const emptyVehicle: CustomerVehicleInput = {
  mileage: 0,
  nickname: null,
  plate_number: "",
  vehicle_variant_id: "",
};

function Vehicles({ run, supabase }: ActionProps) {
  const vehicles = useResource(() => listCustomerVehicles(supabase), [supabase], [] as CustomerVehicle[], "saved vehicles");
  const brands = useResource(() => listVehicleBrands(supabase), [supabase], [] as VehicleBrand[], "vehicle brands");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerVehicleInput>(emptyVehicle);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const models = useResource(
    () => brandId ? listVehicleModels(supabase, brandId) : Promise.resolve([] as VehicleModel[]),
    [supabase, brandId],
    [] as VehicleModel[],
    "vehicle models",
  );
  const variants = useResource(
    () => brandId ? listVehicleVariants(supabase, brandId) : Promise.resolve([] as VehicleVariant[]),
    [supabase, brandId],
    [] as VehicleVariant[],
    "vehicle variants",
  );

  const modelVariants = useMemo(
    () => variants.data.filter((model) => model.vehicle_model_id === modelId),
    [modelId, variants.data],
  );
  const modelYearOptions = useMemo(
    () => distinctYearVariants(modelVariants, form.vehicle_variant_id),
    [form.vehicle_variant_id, modelVariants],
  );
  const selectedVehicleModel = models.data.find((model) => model.id === modelId);
  const selectedVariant = variants.data.find((model) => model.id === form.vehicle_variant_id);

  const reset = () => {
    setEditing(null);
    setForm(emptyVehicle);
    setBrandId("");
    setModelId("");
    setStep(1);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedVariant) return;
    void run(async () => {
      await saveCustomerVehicle(supabase, {
        ...form,
        nickname: form.nickname?.trim() || null,
        plate_number: form.plate_number.trim().toUpperCase(),
      }, editing ?? undefined);
      reset();
      await vehicles.reload();
    }, editing ? "Vehicle updated." : "Vehicle added.");
  };

  const edit = (vehicle: CustomerVehicle) => {
    setEditing(vehicle.id);
    setForm({
      mileage: vehicle.mileage,
      nickname: vehicle.nickname,
      plate_number: vehicle.plate_number,
      vehicle_variant_id: vehicle.vehicle_variant_id,
    });
    setBrandId(vehicle.vehicle_variant.vehicle_model.brand_id);
    setModelId(vehicle.vehicle_variant.vehicle_model.id);
    setStep(4);
  };

  return (
    <Page title="My vehicles" action={<button className="text-button" onClick={reset}>New</button>}>
      <ResourceMessage resources={brandId ? [vehicles, brands, models, variants] : [vehicles, brands]} />
      <section className="vehicle-selector">
        <ol className="vehicle-steps" aria-label="Vehicle setup progress">
          {["Brand", "Model", "Year", "Details"].map((label, index) => (
            <li className={step === index + 1 ? "active" : step > index + 1 ? "complete" : ""} key={label}>
              <span>{index + 1}</span><small>{label}</small>
            </li>
          ))}
        </ol>

        {step === 1 && <section className="selector-stage">
          <header><span className="eyebrow">Step 1</span><h2>Select brand</h2></header>
          <div className="brand-grid">
            {brands.data.map((brand) => <button key={brand.id} onClick={() => {
              setBrandId(brand.id);
              setModelId("");
              setForm({ ...form, vehicle_variant_id: "" });
              setStep(2);
            }}>
              <img alt="" src={brand.logo_url} />
              <strong>{brand.name}</strong>
            </button>)}
          </div>
        </section>}

        {step === 2 && <section className="selector-stage">
          <header><button aria-label="Back to brands" className="back-button" onClick={() => setStep(1)}>&lsaquo;</button><div><span className="eyebrow">Step 2</span><h2>Select model</h2></div></header>
          <div className="vehicle-model-grid">
            {models.data.map((model) => <button key={model.id} onClick={() => {
              const years = distinctYearVariants(variants.data.filter((item) => item.vehicle_model_id === model.id));
              setModelId(model.id);
              setForm({ ...form, vehicle_variant_id: years[0]?.id ?? "" });
              setStep(3);
            }}>
              <VehicleModelImage alt={`${model.brand.name} ${model.model_name}`} imageUrl={model.image_url} />
              <span><strong>{model.model_name}</strong><small>{[model.generation, model.body_type].filter(Boolean).join(" · ") || "Model catalogue"}</small></span>
            </button>)}
          </div>
          {!models.loading && !models.error && models.data.length === 0 && <Empty text="No vehicle models are available for this brand yet." />}
        </section>}

        {step === 3 && <section className="selector-stage year-stage">
          <header><button aria-label="Back to models" className="back-button" onClick={() => setStep(2)}>&lsaquo;</button><div><span className="eyebrow">Step 3</span><h2>Choose vehicle year</h2></div></header>
          {selectedVehicleModel && <VehicleModelImage alt={`${selectedVehicleModel.brand.name} ${selectedVehicleModel.model_name}`} imageUrl={selectedVehicleModel.image_url} />}
          {modelYearOptions.length > 0
            ? <Select label="Year" value={form.vehicle_variant_id} onChange={(value) => setForm({ ...form, vehicle_variant_id: value })} options={modelYearOptions.map((model) => ({ label: String(model.year), value: model.id }))} />
            : <Empty text="No vehicle variants are available for this model yet." />}
          <button className="primary-button" disabled={!form.vehicle_variant_id} onClick={() => setStep(4)}>Continue</button>
        </section>}

        {step === 4 && selectedVariant && <form className="selector-stage vehicle-confirm" onSubmit={submit}>
          <header><button aria-label="Back to year" className="back-button" type="button" onClick={() => setStep(3)}>&lsaquo;</button><div><span className="eyebrow">Step 4</span><h2>Confirm your vehicle</h2></div></header>
          <VehicleModelImage alt={variantName(selectedVariant)} className="confirm-vehicle-image" imageUrl={selectedVariant.vehicle_model.image_url} />
          <div className="selected-vehicle-heading"><strong>{variantName(selectedVariant)}</strong><span>{selectedVariant.year}</span></div>
          <dl className="vehicle-specs">
            <div><dt>Engine</dt><dd>{selectedVariant.engine}</dd></div>
            <div><dt>Displacement</dt><dd>{selectedVariant.displacement ? `${selectedVariant.displacement.toLocaleString()} cc` : "Not available"}</dd></div>
            <div><dt>Transmission</dt><dd>{selectedVariant.transmission}</dd></div>
            <div><dt>Drivetrain</dt><dd>{selectedVariant.drivetrain}</dd></div>
            <div><dt>Fuel</dt><dd>{selectedVariant.fuel}</dd></div>
            <div><dt>Horsepower</dt><dd>{selectedVariant.horsepower ? `${selectedVariant.horsepower} hp` : "Not available"}</dd></div>
            <div><dt>Torque</dt><dd>{selectedVariant.torque ? `${selectedVariant.torque} Nm` : "Not available"}</dd></div>
          </dl>
          <Input label="Plate number" required value={form.plate_number} onChange={(value) => setForm({ ...form, plate_number: value })} />
          <Input label="Mileage (km)" required type="number" value={form.mileage.toString()} onChange={(value) => setForm({ ...form, mileage: Math.max(0, Number(value) || 0) })} />
          <Input label="Nickname (optional)" value={form.nickname ?? ""} onChange={(value) => setForm({ ...form, nickname: value || null })} />
          <button className="primary-button" disabled={!form.plate_number.trim()} type="submit">{editing ? "Save vehicle" : "Add vehicle"}</button>
        </form>}
      </section>
      <div className="record-list">
        {vehicles.data.map((vehicle) => (
          <article className="record-card saved-vehicle-card" key={vehicle.id}>
            <VehicleModelImage alt={vehicleName(vehicle)} imageUrl={vehicle.vehicle_variant.vehicle_model.image_url} />
            <div><strong>{vehicle.nickname || vehicleName(vehicle)}</strong><span>{vehicle.plate_number}</span></div>
            <dl>
              <div><dt>Vehicle</dt><dd>{vehicleName(vehicle)}</dd></div>
              <div><dt>Year</dt><dd>{vehicle.vehicle_variant.year}</dd></div>
              <div><dt>Mileage</dt><dd>{vehicle.mileage.toLocaleString()} km</dd></div>
              <div><dt>Engine</dt><dd>{vehicle.vehicle_variant.engine}</dd></div>
            </dl>
            <div className="card-actions">
              <button onClick={() => edit(vehicle)}>Edit</button>
              <button className="danger" onClick={() => void run(async () => {
                await deleteCustomerVehicle(supabase, vehicle.id);
                await vehicles.reload();
              }, "Vehicle deleted.")}>Delete</button>
            </div>
          </article>
        ))}
        {!vehicles.loading && vehicles.data.length === 0 && <Empty text="No vehicles have been added." />}
      </div>
    </Page>
  );
}

function Parts({ run, supabase }: ActionProps) {
  const vehicles = useResource(() => listCustomerVehicles(supabase), [supabase], [] as CustomerVehicle[]);
  const [vehicleVariantId, setVehicleVariantId] = useState("");
  const didSelectDefaultVehicle = useRef(false);
  const products = useResource(() => listCustomerCatalog(supabase, vehicleVariantId || undefined), [supabase, vehicleVariantId], [] as SupplierProduct[]);
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (!didSelectDefaultVehicle.current && vehicles.data[0]) {
      didSelectDefaultVehicle.current = true;
      setVehicleVariantId(vehicles.data[0].vehicle_variant_id);
    }
  }, [vehicles.data]);
  const selectedVehicle = vehicles.data.find((item) => item.vehicle_variant_id === vehicleVariantId);
  const visible = products.data.filter((product) => `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <Page title="Spare parts" action={<Link className="text-button" to="/cart">Cart</Link>}>
      {vehicles.data.length > 0 && <Select label="Fit for vehicle" value={vehicleVariantId} onChange={setVehicleVariantId} options={[
        { label: "Browse all parts", value: "" },
        ...vehicles.data.map((item) => ({ label: `${vehicleName(item)} ${item.vehicle_variant.year}`, value: item.vehicle_variant_id })),
      ]} />}
      {selectedVehicle && <VehicleIdentity vehicle={selectedVehicle} />}
      <input className="search-input" placeholder="Search products" value={query} onChange={(event) => setQuery(event.target.value)} />
      <ResourceMessage resources={[vehicles, products]} />
      <div className="product-grid">
        {visible.map((product) => (
          <article className="product-card" key={product.id}>
            {product.image_url ? <img alt={product.name} src={product.image_url} /> : <div className="product-image-empty">No image</div>}
            <span className="eyebrow">{product.category}</span>
            <h2>{product.brand} {product.name}</h2>
            <p>{product.description || "No product description supplied."}</p>
            <small>{product.stock} in stock - {product.warranty_duration_months} month warranty</small>
            <footer><strong>{money.format(product.selling_price)}</strong><button onClick={() => void run(async () => {
              await addCustomerCartItem(supabase, product.id);
            }, `${product.name} added to cart.`)}>Add</button></footer>
          </article>
        ))}
        {!products.loading && visible.length === 0 && <Empty text={vehicleVariantId ? "No compatible in-stock products are listed for this vehicle yet." : "No matching in-stock products."} />}
      </div>
    </Page>
  );
}

function Cart({ run, supabase }: ActionProps) {
  const cart = useResource(() => listCustomerCart(supabase), [supabase], [] as CustomerCartItem[]);
  const [method, setMethod] = useState("Online banking");
  const navigate = useNavigate();
  const total = cart.data.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
  const change = (item: CustomerCartItem, quantity: number) => void run(async () => {
    await setCustomerCartQuantity(supabase, item.id, quantity);
    await cart.reload();
  }, quantity <= 0 ? "Item removed." : "Cart updated.");
  return (
    <Page title="Shopping cart" action={<Link className="text-button" to="/parts">Shop</Link>}>
      <ResourceMessage resources={[cart]} />
      <div className="record-list">
        {cart.data.map((item) => (
          <article className="cart-row" key={item.id}>
            <div><strong>{item.product.brand} {item.product.name}</strong><span>{money.format(item.product.selling_price)} each</span></div>
            <div className="quantity-control">
              <button aria-label="Decrease quantity" onClick={() => change(item, item.quantity - 1)}>-</button>
              <strong>{item.quantity}</strong>
              <button aria-label="Increase quantity" disabled={item.quantity >= item.product.stock} onClick={() => change(item, item.quantity + 1)}>+</button>
            </div>
          </article>
        ))}
      </div>
      {!cart.loading && cart.data.length === 0 && <Empty text="Your cart is empty." />}
      {cart.data.length > 0 && (
        <section className="checkout-panel">
          <label>Payment method<select value={method} onChange={(event) => setMethod(event.target.value)}>
            <option>Online banking</option><option>Touch &apos;n Go eWallet</option><option>Card</option><option>Pay at workshop</option>
          </select></label>
          <div><span>Total</span><strong>{money.format(total)}</strong></div>
          <button className="primary-button" onClick={() => void run(async () => {
            await checkoutCustomerCart(supabase, method);
            await cart.reload();
            navigate("/orders");
          }, "Order created and sent to the supplier.")}>Place order</button>
        </section>
      )}
    </Page>
  );
}

function Orders({ supabase }: { supabase: SupabaseClient }) {
  const orders = useResource(() => listCustomerOrders(supabase), [supabase], [] as CustomerOrder[]);
  return (
    <Page title="Orders" action={<Link className="text-button" to="/payments">Payments</Link>}>
      <ResourceMessage resources={[orders]} />
      <div className="record-list">
        {orders.data.map((order) => (
          <article className="record-card" key={order.id}>
            <div><strong>{order.order_number}</strong><Status value={order.status} /></div>
            <span>{new Date(order.created_at).toLocaleString("en-MY")}</span>
            <div className="order-items">
              {order.items.map((item) => <p key={item.id}><span>{item.quantity} x {item.product_brand} {item.product_name}</span><b>{item.status}</b></p>)}
            </div>
            <dl><div><dt>Payment</dt><dd>{order.payment_status}</dd></div><div><dt>Total</dt><dd>{money.format(order.total)}</dd></div></dl>
          </article>
        ))}
        {!orders.loading && orders.data.length === 0 && <Empty text="No orders have been placed." />}
      </div>
    </Page>
  );
}

function BookService({ run, supabase }: ActionProps) {
  const vehicles = useResource(() => listCustomerVehicles(supabase), [supabase], [] as CustomerVehicle[]);
  const workshops = useResource(() => listPlatformWorkshops(supabase), [supabase], [] as PlatformWorkshop[]);
  const services = useResource(() => listServiceCatalog(supabase), [supabase], [] as ServiceCatalogItem[]);
  const bookings = useResource(() => listCustomerBookings(supabase), [supabase], [] as Array<Record<string, unknown>>);
  const [vehicleId, setVehicleId] = useState("");
  const [workshopId, setWorkshopId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const service = services.data.find((item) => item.id === serviceId);
  const selectedVehicle = vehicles.data.find((item) => item.id === vehicleId);

  useEffect(() => { if (!vehicleId && vehicles.data[0]) setVehicleId(vehicles.data[0].id); }, [vehicleId, vehicles.data]);
  useEffect(() => { if (!workshopId && workshops.data[0]) setWorkshopId(workshops.data[0].owner_id); }, [workshopId, workshops.data]);
  useEffect(() => { if (!serviceId && services.data[0]) setServiceId(services.data[0].id); }, [serviceId, services.data]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!service) return;
    void run(async () => {
      await createCustomerServiceBooking(supabase, {
        customer_notes: notes || null,
        estimated_price: service.estimated_price,
        service_catalog_id: service.id,
        service_date: new Date(date).toISOString(),
        service_type: service.name,
        user_vehicle_id: vehicleId,
        workshop_owner_id: workshopId,
      });
      setNotes(""); setDate("");
      await bookings.reload();
    }, "Booking sent to the workshop.");
  };

  return (
    <Page title="Book a service">
      <ResourceMessage resources={[vehicles, workshops, services, bookings]} />
      {vehicles.data.length === 0 ? <Empty text="Add a vehicle before creating a booking." /> : (
        <form className="customer-form" onSubmit={submit}>
          <Select label="Vehicle" value={vehicleId} onChange={setVehicleId} options={vehicles.data.map((item) => ({ label: vehicleOptionLabel(item), value: item.id }))} />
          {selectedVehicle && <VehicleIdentity vehicle={selectedVehicle} />}
          <Select label="Workshop" value={workshopId} onChange={setWorkshopId} options={workshops.data.map((item) => ({ label: `${item.name}${item.city ? ` - ${item.city}` : ""}`, value: item.owner_id }))} />
          <Select label="Service" value={serviceId} onChange={setServiceId} options={services.data.map((item) => ({ label: `${item.name} - ${money.format(item.estimated_price)}`, value: item.id }))} />
          <Input label="Date and time" required type="datetime-local" value={date} onChange={setDate} />
          <label>Notes<textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
          <button className="primary-button" disabled={!workshopId || !serviceId || !date} type="submit">Send booking</button>
        </form>
      )}
      <div className="record-list">
        {bookings.data.map((booking) => <article className="record-card" key={String(booking.id)}><div><strong>{String(booking.service_type)}</strong><Status value={String(booking.status)} /></div><span>{new Date(String(booking.scheduled_at)).toLocaleString("en-MY")}</span><p>{String(booking.vehicle_label)}</p></article>)}
      </div>
    </Page>
  );
}

function Notifications({ onUnreadChange, supabase }: { onUnreadChange: (count: number) => void; supabase: SupabaseClient }) {
  const notifications = useResource(() => listNotifications(supabase), [supabase], [] as ManFixNotification[]);
  useEffect(() => { onUnreadChange(notifications.data.filter((item) => !item.read_at).length); }, [notifications.data, onUnreadChange]);
  return (
    <Page title="Notifications">
      <ResourceMessage resources={[notifications]} />
      <div className="record-list">
        {notifications.data.map((item) => (
          <button className={`notification-row ${item.read_at ? "read" : ""}`} key={item.id} onClick={() => void (async () => {
            if (!item.read_at) { await markNotificationRead(supabase, item.id); await notifications.reload(); }
          })()}>
            <strong>{item.title}</strong><span>{item.message}</span><small>{new Date(item.created_at).toLocaleString("en-MY")}</small>
          </button>
        ))}
        {!notifications.loading && notifications.data.length === 0 && <Empty text="No notifications yet." />}
      </div>
    </Page>
  );
}

function Payments({ run, supabase }: ActionProps) {
  const payments = useResource(() => listCustomerPayments(supabase), [supabase], [] as CustomerPayment[]);
  return (
    <Page title="Payment history">
      <ResourceMessage resources={[payments]} />
      <div className="record-list">
        {payments.data.map((payment) => (
          <article className="record-card" key={payment.id}>
            <div><strong>{payment.payment_number}</strong><Status value={payment.status} /></div>
            <p>{payment.method}</p><dl><div><dt>Amount</dt><dd>{money.format(payment.amount)}</dd></div><div><dt>Created</dt><dd>{new Date(payment.created_at).toLocaleDateString("en-MY")}</dd></div></dl>
            {payment.status === "Pending" && <div className="card-actions"><button className="danger" onClick={() => void run(async () => { await updateCustomerPayment(supabase, payment.id, "Cancelled"); await payments.reload(); }, "Payment cancelled.")}>Cancel payment</button></div>}
          </article>
        ))}
        {!payments.loading && payments.data.length === 0 && <Empty text="No payment records yet." />}
      </div>
    </Page>
  );
}

function Warranty({ run, supabase }: ActionProps) {
  const warranties = useResource(() => listCustomerWarranties(supabase), [supabase], [] as CustomerWarranty[]);
  const claims = useResource(() => listCustomerWarrantyClaims(supabase), [supabase], [] as CustomerWarrantyClaim[]);
  const [selected, setSelected] = useState<CustomerWarranty | null>(null);
  const [description, setDescription] = useState("");

  return (
    <Page title="Warranty+">
      <ResourceMessage resources={[warranties, claims]} />
      <div className="record-list">
        {warranties.data.map((warranty) => {
          const claim = claims.data.find((item) => item.warranty_id === warranty.id);
          const remaining = Math.max(0, Math.ceil((new Date(warranty.expiry_date).getTime() - Date.now()) / 86400000));
          return <article className="record-card" key={warranty.id}>
            <div><strong>{warranty.part_brand ? `${warranty.part_brand} ` : ""}{warranty.part_name || warranty.coverage_type}</strong><Status value={warranty.status} /></div>
            <span>{warranty.warranty_number}</span>
            <dl>
              <div><dt>Workshop</dt><dd>{warranty.workshop_name || "Not linked"}</dd></div>
              <div><dt>Supplier</dt><dd>{warranty.supplier_name || "Not linked"}</dd></div>
              <div><dt>Remaining</dt><dd>{remaining} days</dd></div>
              <div><dt>Claim</dt><dd>{claim?.status || "Not claimed"}</dd></div>
            </dl>
            <div className="card-actions"><button onClick={() => setSelected(warranty)}>View details</button></div>
          </article>;
        })}
        {!warranties.loading && warranties.data.length === 0 && <Empty text="No warranties have been generated yet. A warranty is created when an eligible ManFix order or repair is completed." />}
      </div>
      {selected && <section className="warranty-detail">
        <header><div><span>Digital warranty</span><h2>{selected.warranty_number}</h2></div><button aria-label="Close warranty details" onClick={() => { setSelected(null); setDescription(""); }}>Close</button></header>
        <dl>
          <div><dt>Vehicle</dt><dd>{selected.vehicle_label || "Not linked"}</dd></div>
          <div><dt>Coverage</dt><dd>{selected.coverage_type}</dd></div>
          <div><dt>Start</dt><dd>{new Date(selected.start_date).toLocaleDateString("en-MY")}</dd></div>
          <div><dt>Expiry</dt><dd>{new Date(selected.expiry_date).toLocaleDateString("en-MY")}</dd></div>
          <div><dt>Duration</dt><dd>{selected.duration_months} months</dd></div>
          <div><dt>Invoice</dt><dd>{selected.invoice_number || "Not applicable"}</dd></div>
        </dl>
        <section className="result-list"><strong>Warranty terms</strong><ul>{selected.warranty_terms.map((term) => <li key={term}>{term}</li>)}</ul></section>
        {selected.status === "Active" && !claims.data.some((item) => item.warranty_id === selected.id && item.status === "Pending Review") && <form className="customer-form" onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            await submitCustomerWarrantyClaim(supabase, selected.id, description);
            setDescription("");
            await claims.reload();
          }, "Warranty claim submitted for review.");
        }}>
          <label>Describe the problem<textarea required rows={4} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <button className="primary-button" type="submit">Submit warranty claim</button>
        </form>}
      </section>}
    </Page>
  );
}

function Profile({ onProfileChange, onSignOut, onSwitchPortal, profile, run, supabase }: ActionProps & {
  onProfileChange: (profile: ManHubProfile) => void;
  onSignOut: () => Promise<void>;
  onSwitchPortal?: () => Promise<void>;
  profile: ManHubProfile;
}) {
  const [name, setName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [avatar, setAvatar] = useState<File | null>(null);
  return (
    <Page title="Profile">
      <section className="profile-identity">
        {profile.avatar_url ? <img alt="Profile" src={profile.avatar_url} /> : <span>{(profile.full_name || profile.email || "U").slice(0, 1).toUpperCase()}</span>}
        <div><strong>{profile.full_name || profile.email}</strong><small>{profile.email}</small></div>
      </section>
      <form className="customer-form" onSubmit={(event) => {
        event.preventDefault();
        void run(async () => {
          let avatarUrl = profile.avatar_url;
          if (avatar) avatarUrl = await uploadCustomerAvatar(supabase, avatar);
          const updated = await updateCustomerProfile(supabase, { full_name: name, phone: phone || null, avatar_url: avatarUrl });
          onProfileChange(updated);
          setAvatar(null);
        }, "Profile saved.");
      }}>
        <Input label="Full name" required value={name} onChange={setName} />
        <Input label="Email" disabled value={profile.email ?? ""} onChange={() => undefined} />
        <Input label="Phone" value={phone} onChange={setPhone} />
        <label>Avatar<input accept="image/jpeg,image/png,image/webp" type="file" onChange={(event) => setAvatar(event.target.files?.[0] ?? null)} /></label>
        <button className="primary-button" type="submit">Save profile</button>
      </form>
      <div className="profile-links">
        <Link to="/payments">Payment history <b>&gt;</b></Link>
        <Link to="/vehicles">My vehicles <b>&gt;</b></Link>
        <Link to="/warranty">Warranty+ <b>&gt;</b></Link>
        <Link to="/diagnosis">AI diagnosis <b>&gt;</b></Link>
        {onSwitchPortal && <button onClick={() => void onSwitchPortal()}>Switch portal <b>&gt;</b></button>}
        <button className="logout" onClick={() => void onSignOut()}>Log out</button>
      </div>
    </Page>
  );
}

function BottomNav({ unread }: { unread: number }) {
  return <nav className="bottom-nav">
    <NavLink to="/"><span className="tab-icon home" />Home</NavLink>
    <NavLink to="/book-service"><span className="tab-icon workshops" />Workshops</NavLink>
    <NavLink to="/parts"><span className="tab-icon parts" />Parts</NavLink>
    <NavLink to="/orders"><span className="tab-icon orders" />Orders</NavLink>
    <NavLink to="/profile"><span className="tab-icon me" />Me{unread > 0 && <b>{unread > 9 ? "9+" : unread}</b>}</NavLink>
  </nav>;
}

function Page({ action, children, title }: { action?: ReactNode; children: ReactNode; title: string }) {
  return <div className="customer-stack"><header className="page-title"><h1>{title}</h1>{action}</header>{children}</div>;
}

function Input({ disabled = false, label, onChange, required = false, type = "text", value }: { disabled?: boolean; label: string; onChange: (value: string) => void; required?: boolean; type?: string; value: string }) {
  return <label>{label}<input disabled={disabled} required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Select({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: Array<{ label: string; value: string }>; value: string }) {
  return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function Status({ value }: { value: string }) {
  const tone = ["Completed", "Paid", "Delivered", "Approved", "Accepted"].includes(value) ? "success" : ["Cancelled", "Rejected", "Refunded"].includes(value) ? "danger" : "pending";
  return <span className={`status ${tone}`}>{value}</span>;
}

function Empty({ text }: { text: string }) { return <p className="empty-state">{text}</p>; }

type Resource<T> = { data: T; error: string | null; loading: boolean; reload: () => Promise<void> };

function useResource<T>(load: () => Promise<T>, dependencies: unknown[], initial: T, label = "data"): Resource<T> {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await load()); } catch (caught) {
      const message = getErrorMessage(caught);
      setError(`Unable to load ${label}: ${message}`);
    }
    finally { setLoading(false); }
  }, dependencies);
  useEffect(() => { void reload(); }, [reload]);
  return { data, error, loading, reload };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    for (const key of ["message", "details", "hint"]) {
      if (typeof record[key] === "string" && record[key]) return record[key];
    }
  }
  return "Unable to load data.";
}

function ResourceMessage({ resources }: { resources: Array<Resource<unknown>> }) {
  if (resources.some((resource) => resource.loading)) return <p className="resource-message">Loading...</p>;
  const error = resources.find((resource) => resource.error)?.error;
  return error ? <p className="resource-message error">{error}</p> : null;
}

type ActionProps = {
  run: (task: () => Promise<void>, success: string) => Promise<void>;
  supabase: SupabaseClient;
};

