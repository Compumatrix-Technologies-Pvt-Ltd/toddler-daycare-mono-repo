import express from "express";
import { adminRouter } from "@/routes/admin.routes";
import { caretaterRouter } from "@/routes/caretakers.routes";
import { daycareRouter } from "./routes/daycares.routes";
import cors from "cors";


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(
  "/uploads",
  express.static("src/uploads")
);

//Health Check
app.get("/", (req, res) => {
  res.json({
    sccess: true,
    message: "toddler daycare api is running"
  })
})

//admin routes
app.use("/api", adminRouter)
//caretaker routes
app.use("/api/caretaker/auth", caretaterRouter);
//daycare routes
app.use("/api/caretaker/daycare", daycareRouter);

export default app;