import express from "express";
import cors from "cors";

import proposalsRoutes from "./routes/proposals.js";
import rfpRoutes from "./routes/rfp.js";
import vendorRoutes from "./routes/vendors.js";
import emailRoutes from "./routes/email.js";
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/proposals", proposalsRoutes);
app.use("/api/rfps", rfpRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/email", emailRoutes);
const PORT = 4000;
app.listen(PORT, () => {
  console.log("🔥 Backend running on port", PORT);
});
