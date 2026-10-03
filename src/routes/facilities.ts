import { Router } from "express";
import Facility from "../models/Facility";
import {
  advisorAuthMiddleware,
  AdvisorRequest,
} from "../middleware/advisorAuthMiddleware";

const router = Router();

const SUPPORT_TYPES = [
  "medical",
  "legal",
  "psychological",
  "general",
] as const;

/**
 * GET /api/facilities
 *
 * Public facility search.
 *
 * Examples:
 * /api/facilities
 * /api/facilities?search=Addis
 * /api/facilities?location=Bole
 * /api/facilities?support_type=medical
 * /api/facilities?support_type=medical,psychological
 */
router.get("/", async (req, res) => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const location =
      typeof req.query.location === "string"
        ? req.query.location.trim()
        : "";

    const supportTypeParam =
      typeof req.query.support_type === "string"
        ? req.query.support_type.trim()
        : "";

    const supportTypes = supportTypeParam
      ? supportTypeParam
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .filter((value) =>
            SUPPORT_TYPES.includes(
              value as (typeof SUPPORT_TYPES)[number],
            ),
          )
      : [];

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
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
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (location) {
      query.location = {
        $regex: location,
        $options: "i",
      };
    }

    if (supportTypes.length > 0) {
      query.support_types = {
        $in: supportTypes,
      };
    }

    const facilities = await Facility.find(query).sort({
      created_at: -1,
    });

    return res.status(200).json({
      success: true,
      facilities: facilities.map((facility) => ({
        facility_id: facility.facility_id,
        facility_name: facility.facility_name,
        location: facility.location,
        contact: facility.contact,
        support_types:
          facility.support_types?.length > 0
            ? facility.support_types
            : [],
        description:
          facility.description || facility.notes || "",
        added_by: facility.added_by || "",
        created_at: facility.created_at,
        updated_at: facility.updated_at,
      })),
    });
  } catch (error) {
    console.error("Get facilities error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load facilities",
    });
  }
});

/**
 * GET /api/facilities/:facility_id
 */
router.get("/:facility_id", async (req, res) => {
  try {
    const facility = await Facility.findOne({
      facility_id: req.params.facility_id,
    });

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Facility not found",
      });
    }

    return res.status(200).json({
      success: true,
      facility: {
        facility_id: facility.facility_id,
        facility_name: facility.facility_name,
        location: facility.location,
        contact: facility.contact,
        support_types:
          facility.support_types?.length > 0
            ? facility.support_types
            : [],
        description:
          facility.description || facility.notes || "",
        added_by: facility.added_by || "",
        created_at: facility.created_at,
        updated_at: facility.updated_at,
      },
    });
  } catch (error) {
    console.error("Get facility error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load facility",
    });
  }
});

/**
 * POST /api/facilities
 *
 * Advisor only.
 */
router.post(
  "/",
  advisorAuthMiddleware,
  async (req: AdvisorRequest, res) => {
    try {
      const {
        facility_name,
        location,
        contact,
        support_types,
        description,
      } = req.body;

      if (
        !facility_name?.trim() ||
        !location?.trim() ||
        !contact?.trim() ||
        !description?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "facility_name, location, contact and description are required",
        });
      }

      if (
        !Array.isArray(support_types) ||
        support_types.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "At least one support type is required",
        });
      }

      const invalidType = support_types.some(
        (type: string) => !SUPPORT_TYPES.includes(
          type as (typeof SUPPORT_TYPES)[number],
        ),
      );

      if (invalidType) {
        return res.status(400).json({
          success: false,
          message: "Invalid support type",
        });
      }

      const facilityId = `FAC-${Date.now()}`;

      const facility = await Facility.create({
        facility_id: facilityId,
        facility_name: facility_name.trim(),
        location: location.trim(),
        contact: contact.trim(),
        support_types,
        description: description.trim(),
        added_by: req.advisor?.advisor_id || "",
      });

      return res.status(201).json({
        success: true,
        message: "Facility added successfully",
        facility: {
          facility_id: facility.facility_id,
          facility_name: facility.facility_name,
          location: facility.location,
          contact: facility.contact,
          support_types: facility.support_types,
          description: facility.description,
          added_by: facility.added_by,
          created_at: facility.created_at,
          updated_at: facility.updated_at,
        },
      });
    } catch (error) {
      console.error("Create facility error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to add facility",
      });
    }
  },
);

export default router;