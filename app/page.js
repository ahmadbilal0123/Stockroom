"use client";
import { useState, useEffect, useMemo } from "react";

const uid = () => Math.random().toString(36).slice(2, 9);
const num = (v) => Number(v) || 0;
function useLS(key, init) {
  const [v, setV] = useState(init);
  const [ready, setReady] = useState(false);
  useEffect(() => { try { const s = localStorage.getItem(key); if (s) setV(JSON.parse(s)); } catch {} setReady(true); }, [key]);
  useEffect(() => { if (ready) try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key, v, ready]);
  return [v, setV];
}
const DEF = { name: "Your Company", address: "Street, City", phone: "", email: "", tax: 10, next: 1 };

export default function Home() {
  const [items, setItems] = useLS("sr_items", []);
  const [invoices, setInvoices] = useLS("sr_invoices", []);
  const [cfg, setCfg] = useLS("sr_cfg", DEF);
  const [view, setView] = useState("dashboard");
  const [splash, setSplash] = useState("in");
  const [open, setOpen] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const money = (n) => `${num(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;

  useEffect(() => {
    const a = setTimeout(() => setSplash("out"), 2400), b = setTimeout(() => setSplash("gone"), 2950);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);

  const stats = useMemo(() => ({
    count: items.length,
    value: items.reduce((s, i) => s + num(i.qty) * num(i.price), 0),
    low: items.filter((i) => num(i.qty) <= num(i.reorder)).length,
    sales: invoices.reduce((s, i) => s + i.total, 0),
  }), [items, invoices]);

  const nav = [["dashboard", "Dashboard"], ["inventory", "Inventory"], ["new", "New invoice"], ["invoices", "Invoices"], ["settings", "Settings"]];

  return (
    <>
      {splash !== "gone" && (
        <div className={"splash " + (splash === "out" ? "out" : "")}>
          <div className="mark">S</div><h1>Stockroom</h1><p>Inventory &amp; invoicing</p>
          <div className="bar"><i /></div>
        </div>
      )}
      <div className="app">
        <aside className="side">
          <div className="side-header">
            <div className="brand"><div className="mark">S</div>Stockroom</div>
            <button className="menu-toggle" type="button" aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <span /><span /><span />
            </button>
          </div>
          {mobileMenuOpen && <button className="mobile-nav-backdrop" type="button" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} />}
          <nav className={"nav-list " + (mobileMenuOpen ? "open" : "")} aria-label="Main navigation">
            {nav.map(([k, l]) => (
              <button key={k} className={"nav " + (view === k ? "on" : "")} onClick={() => { setView(k); setOpen(null); setMobileMenuOpen(false); }}>{l}</button>
            ))}
          </nav>
        </aside>
        <main className="main">
          {view === "dashboard" && <Dashboard stats={stats} items={items} invoices={invoices} money={money} go={(v, inv) => { setView(v); setOpen(inv || null); }} />}
          {view === "inventory" && <Inventory items={items} setItems={setItems} money={money} />}
          {view === "new" && <NewInvoice items={items} setItems={setItems} cfg={cfg} setCfg={setCfg} setInvoices={setInvoices} money={money} done={(inv) => { setView("invoices"); setOpen(inv); }} />}
          {view === "invoices" && (open
            ? <Sheet inv={open} cfg={cfg} money={money} back={() => setOpen(null)} />
            : <Invoices invoices={invoices} setInvoices={setInvoices} money={money} show={setOpen} />)}
          {view === "settings" && <Settings cfg={cfg} setCfg={setCfg} />}
        </main>
      </div>
    </>
  );
}

function Dashboard({ stats, items, invoices, money, go }) {
  const low = items.filter((i) => num(i.qty) <= num(i.reorder));
  return (<>
    <div className="head"><h2>Dashboard</h2></div>
    <div className="stats">
      <div className="stat"><small>Products</small><b>{stats.count}</b></div>
      <div className="stat"><small>Stock value</small><b>{money(stats.value)}</b></div>
      <div className="stat"><small>Needs restocking</small><b>{stats.low}</b></div>
      <div className="stat"><small>Total invoiced</small><b>{money(stats.sales)}</b></div>
    </div>
    <div className="panel"><h3>Low stock</h3>
      {low.length ? <table><tbody>{low.map((i) => <tr key={i.id}><td>{i.name}</td><td className="r"><span className={"tag " + (num(i.qty) === 0 ? "out" : "low")}>{i.qty} left</span></td></tr>)}</tbody></table>
        : <div className="empty">Every product is above its reorder level.</div>}
    </div>
    <div className="panel"><h3>Recent invoices</h3>
      {invoices.length ? <table><tbody>{invoices.slice(0, 5).map((v) => <tr key={v.id}><td>{v.number}</td><td>{v.customer}</td><td className="r">{money(v.total)}</td><td className="r"><button className="btn sm ghost" onClick={() => go("invoices", v)}>Open</button></td></tr>)}</tbody></table>
        : <div className="empty">No invoices yet. Add products, then create your first invoice.</div>}
    </div>
  </>);
}

const blank = { name: "", sku: "", category: "", qty: "", price: "", reorder: 5 };
function Inventory({ items, setItems, money }) {
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null);
  const list = items.filter((i) => (i.name + i.sku + i.category).toLowerCase().includes(q.toLowerCase()));
  const save = () => {
    if (!form.name.trim()) return alert("Enter a product name.");
    const row = { ...form, qty: num(form.qty), price: num(form.price), reorder: num(form.reorder) };
    setItems(form.id ? items.map((i) => (i.id === form.id ? row : i)) : [{ ...row, id: uid() }, ...items]);
    setForm(null);
  };
  const f = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });
  return (<>
    <div className="head"><h2>Inventory</h2>
      <div style={{ display: "flex", gap: 10 }}>
        <input placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 220 }} />
        <button className="btn amber" onClick={() => setForm(blank)}>Add product</button>
      </div></div>
    <div className="panel">
      {list.length ? <table>
        <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th className="r">Price</th><th className="r">Stock</th><th /></tr></thead>
        <tbody>{list.map((i) => (
          <tr key={i.id}><td>{i.name}</td><td>{i.sku}</td><td>{i.category}</td><td className="r">{money(i.price)}</td>
            <td className="r"><span className={"tag " + (i.qty === 0 ? "out" : i.qty <= i.reorder ? "low" : "")}>{i.qty}</span></td>
            <td className="r"><button className="btn sm ghost" onClick={() => setForm(i)}>Edit</button>{" "}
              <button className="btn sm danger" onClick={() => confirm(`Delete ${i.name}?`) && setItems(items.filter((x) => x.id !== i.id))}>Delete</button></td></tr>))}
        </tbody></table>
        : <div className="empty">{items.length ? "No products match your search." : "Your inventory is empty. Add your first product."}</div>}
    </div>
    {form && <div className="modal"><div className="panel">
      <h3>{form.id ? "Edit product" : "Add product"}</h3>
      <div className="grid">
        <label>Name<input {...f("name")} autoFocus /></label><label>SKU<input {...f("sku")} /></label>
        <label>Category<input {...f("category")} /></label><label>Unit price<input type="number" min="0" step="0.01" {...f("price")} /></label>
        <label>Quantity in stock<input type="number" min="0" {...f("qty")} /></label><label>Reorder level<input type="number" min="0" {...f("reorder")} /></label>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
        <button className="btn ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn" onClick={save}>Save product</button></div>
    </div></div>}
  </>);
}

function NewInvoice({ items, setItems, cfg, setCfg, setInvoices, money, done }) {
  const [c, setC] = useState({ customer: "", address: "", email: "", date: new Date().toISOString().slice(0, 10), tax: cfg.tax, discount: 0 });
  const [lines, setLines] = useState([{ id: uid(), item: "", qty: 1 }]);
  const rows = lines.map((l) => { const it = items.find((i) => i.id === l.item); return { ...l, it, amount: it ? it.price * num(l.qty) : 0 }; });
  const sub = rows.reduce((s, r) => s + r.amount, 0);
  const disc = num(c.discount), tax = Math.max(sub - disc, 0) * num(c.tax) / 100, total = Math.max(sub - disc, 0) + tax;
  const upd = (id, p) => setLines(lines.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const save = () => {
    const used = rows.filter((r) => r.it);
    if (!c.customer.trim()) return alert("Enter the customer name.");
    if (!used.length) return alert("Add at least one product.");
    for (const r of used) {
      const need = used.filter((x) => x.item === r.item).reduce((s, x) => s + num(x.qty), 0);
      if (num(r.qty) <= 0 || need > r.it.qty) return alert(`Not enough stock for ${r.it.name} (${r.it.qty} available).`);
    }
    const inv = {
      id: uid(), number: "INV-" + String(cfg.next).padStart(4, "0"), ...c, discount: disc, taxRate: num(c.tax), sub, tax, total,
      lines: used.map((r) => ({ name: r.it.name, sku: r.it.sku, qty: num(r.qty), price: r.it.price, amount: r.amount })),
    };
    setItems(items.map((i) => { const q = used.filter((r) => r.item === i.id).reduce((s, r) => s + num(r.qty), 0); return q ? { ...i, qty: i.qty - q } : i; }));
    setInvoices((p) => [inv, ...p]);
    setCfg({ ...cfg, next: cfg.next + 1 });
    done(inv);
  };
  const f = (k) => ({ value: c[k], onChange: (e) => setC({ ...c, [k]: e.target.value }) });
  return (<>
    <div className="head"><h2>New invoice</h2></div>
    <div className="panel"><h3>Customer</h3><div className="grid">
      <label>Name<input {...f("customer")} /></label><label>Email<input {...f("email")} /></label>
      <label>Address<input {...f("address")} /></label><label>Date<input type="date" {...f("date")} /></label></div></div>
    <div className="panel"><h3>Items</h3>
      {!items.length && <div className="empty">Add products in Inventory before invoicing.</div>}
      {rows.map((r) => (
        <div className="line" key={r.id}>
          <select value={r.item} onChange={(e) => upd(r.id, { item: e.target.value })}>
            <option value="">Select product</option>{items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.qty} in stock)</option>)}</select>
          <input type="number" min="1" value={r.qty} onChange={(e) => upd(r.id, { qty: e.target.value })} />
          <div className="r">{money(r.amount)}</div>
          <button className="btn sm danger" onClick={() => setLines(lines.length > 1 ? lines.filter((l) => l.id !== r.id) : lines)} aria-label="Remove line">×</button>
        </div>))}
      <button className="btn ghost sm" onClick={() => setLines([...lines, { id: uid(), item: "", qty: 1 }])}>Add line</button>
      <div className="tot">
        <div><span>Subtotal</span><span>{money(sub)}</span></div>
        <div><span>Discount</span><input type="number" min="0" style={{ width: 90 }} {...f("discount")} /></div>
        <div><span>Tax %</span><input type="number" min="0" style={{ width: 90 }} {...f("tax")} /></div>
        <div className="g"><span>Total</span><span>{money(total)}</span></div></div>
    </div>
    <button className="btn amber" onClick={save}>Save invoice</button>
  </>);
}

function Invoices({ invoices, setInvoices, money, show }) {
  return (<>
    <div className="head"><h2>Invoices</h2></div>
    <div className="panel">
      {invoices.length ? <table>
        <thead><tr><th>Number</th><th>Customer</th><th>Date</th><th className="r">Total</th><th /></tr></thead>
        <tbody>{invoices.map((v) => <tr key={v.id}><td>{v.number}</td><td>{v.customer}</td><td>{v.date}</td><td className="r">{money(v.total)}</td>
          <td className="r"><button className="btn sm" onClick={() => show(v)}>View &amp; print</button>{" "}
            <button className="btn sm danger" onClick={() => confirm(`Delete ${v.number}? Stock is not restored.`) && setInvoices(invoices.filter((x) => x.id !== v.id))}>Delete</button></td></tr>)}</tbody>
      </table> : <div className="empty">No invoices yet.</div>}
    </div>
  </>);
}

function Sheet({ inv, cfg, money, back }) {
  return (<>
    <div className="head noprint"><button className="btn ghost" onClick={back}>Back to invoices</button><button className="btn amber" onClick={() => window.print()}>Print invoice</button></div>
    <div className="sheet">
      <div className="top">
        <div><h1>{cfg.name}</h1><div>{cfg.address}</div><div>{cfg.phone} {cfg.email}</div></div>
        <div style={{ textAlign: "right" }}><h1>INVOICE</h1><div><b>{inv.number}</b></div><div>{inv.date}</div></div>
      </div>
      <p><b>Bill to</b><br />{inv.customer}<br />{inv.address}<br />{inv.email}</p>
      <table>
        <thead><tr><th>Item</th><th>SKU</th><th className="r">Qty</th><th className="r">Price</th><th className="r">Amount</th></tr></thead>
        <tbody>{inv.lines.map((l, i) => <tr key={i}><td>{l.name}</td><td>{l.sku}</td><td className="r">{l.qty}</td><td className="r">{money(l.price)}</td><td className="r">{money(l.amount)}</td></tr>)}</tbody>
      </table>
      <div className="tot">
        <div><span>Subtotal</span><span>{money(inv.sub)}</span></div>
        {inv.discount > 0 && <div><span>Discount</span><span>-{money(inv.discount)}</span></div>}
        <div><span>Tax ({inv.taxRate}%)</span><span>{money(inv.tax)}</span></div>
        <div className="g"><span>Total</span><span>{money(inv.total)}</span></div>
      </div>
      <p style={{ marginTop: 40, color: "var(--mute)" }}>Thank you for your business.</p>
    </div>
  </>);
}

function Settings({ cfg, setCfg }) {
  const f = (k, n) => ({ value: cfg[k], onChange: (e) => setCfg({ ...cfg, [k]: n ? num(e.target.value) : e.target.value }) });
  return (<>
    <div className="head"><h2>Settings</h2></div>
    <div className="panel"><h3>Company details (printed on invoices)</h3><div className="grid">
      <label>Company name<input {...f("name")} /></label><label>Address<input {...f("address")} /></label>
      <label>Phone<input {...f("phone")} /></label><label>Email<input {...f("email")} /></label>
      <label>Default tax %<input type="number" {...f("tax", 1)} /></label>
      <label>Next invoice number<input type="number" min="1" {...f("next", 1)} /></label></div>
      <p style={{ color: "var(--mute)" }}>Changes save automatically. Data is stored in this browser.</p></div>
  </>);
}
