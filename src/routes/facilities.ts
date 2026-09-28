import { Router } from "express";
import Facility from "../models/Facility";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const query = search
      ? {
          $or: [
            {
              facility_id: {
                $regex: search,
                $options: "i",
              },
            },
            {
              facility_name: {
                $regex: search,
                $options: "i",
              },
            },
            {
              location: {
                $regex: search,
                $options: "i",
              },
            },
          ],
        }
      : {};

    const facilities = await Facility.find(query).sort({
      created_at: -1,
    });

    return res.status(200).json({
      success: true,
      facilities,
    });
  } catch (error) {
    console.error("Get facilities error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load facilities",
    });
  }
});


router.post("/", async (req, res) => {
  try {
    const {
      facility_id,
      facility_name,
      location,
      contact,
      notes,
    } = req.body;

    if (
      !facility_id ||
      !facility_name ||
      !location ||
      !contact ||
      !notes
    ) {
      return res.status(400).json({
        success: false,
        message:
          "facility_id, facility_name, location, contact and notes are required",
      });
    }

    const existing = await Facility.findOne({
      facility_id,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A facility with this ID already exists",
        facility: existing,
      });
    }

    const facility = await Facility.create({
      facility_id,
      facility_name,
      location,
      contact,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Facility added",
      facility,
    });
  } catch (error) {
    console.error("Create facility error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add facility",
    });
  }
});

export default router;