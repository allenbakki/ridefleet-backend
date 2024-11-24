import { Router } from "express";
import { getRideHistory,getMaintenanceHistory,getVehicleDetails, getVehicleNames, getTotalSpend, addMaintenance, deleteMaintenance } from "../api.js";


const router = Router();

router.get("/ride-history",getRideHistory)
router.get("/maintenance-history",getMaintenanceHistory)
router.get("/vehicle-details",getVehicleDetails)
router.get("/vehicle-names",getVehicleNames)
router.get("/total-spend",getTotalSpend)
router.post("/add-maintenance",addMaintenance)
router.post("/delete-maintenance",deleteMaintenance)


export default router;