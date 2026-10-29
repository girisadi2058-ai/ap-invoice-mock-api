// Mock backend for the "AP Invoice Block Assistant" case study.
// No dependencies: run with `node server.js` (Node 16+).
//
// Endpoints
//   GET /invoices/{invoice_id}      -> vendor_name, po_amount, invoice_amount, block_reason
//   GET /tolerances/{vendor_name}   -> vendor_name, allowed_tolerance_percent
//   GET /health                     -> { status: "ok" }

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "data.json"), "utf8"));

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);

  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });

  if (parts.length === 1 && parts[0] === "health") return send(res, 200, { status: "ok" });

  if (parts.length === 2 && parts[0] === "invoices") {
    const inv = data.invoices[parts[1]];
    if (!inv) return send(res, 404, { error: `Invoice ${parts[1]} not found` });
    return send(res, 200, { invoice_id: parts[1], ...inv });
  }

  if (parts.length === 2 && parts[0] === "tolerances") {
    const key = Object.keys(data.tolerances).find(
      (v) => v.toLowerCase() === parts[1].toLowerCase()
    );
    if (!key) return send(res, 404, { error: `No tolerance found for vendor ${parts[1]}` });
    return send(res, 200, { vendor_name: key, allowed_tolerance_percent: data.tolerances[key] });
  }

  send(res, 404, { error: "Not found" });
});

server.listen(PORT, () => console.log(`Mock AP API listening on port ${PORT}`));
