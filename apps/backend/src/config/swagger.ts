import swaggerJsdoc from "swagger-jsdoc";
import { Express } from "express";
import swaggerUi from "swagger-ui-express";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Toddler Daycare Platform REST API",
    version: "1.0.0",
    description:
      "Comprehensive REST API documentation for the Toddler Daycare Platform covering Admin Governance, Caretaker Onboarding, Daycare Profile & Document Verification, and Public Parent Search.",
    contact: {
      name: "Toddler Platform Engineering Team",
      url: "http://localhost:3008",
      email: "support@toddler.demohub.tech",
    },
  },
  servers: [
    {
      url: "http://localhost:5000/api/v1",
      description: "Local Development Server (v1)",
    },
    {
      url: "http://localhost:5000/api",
      description: "Local Development Server (Legacy Root)",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your Bearer JWT token generated from login",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Error description" },
        },
      },
      DaycareLocation: {
        type: "object",
        required: ["latitude", "longitude", "street", "houseNumber", "postcode", "city"],
        properties: {
          latitude: { type: "number", example: 20.571046 },
          longitude: { type: "number", example: 74.94637 },
          street: { type: "string", example: "Stargarder Straße" },
          houseNumber: { type: "string", example: "14" },
          postcode: { type: "string", example: "10437" },
          city: { type: "string", example: "Berlin" },
        },
      },
      DaycareOperations: {
        type: "object",
        required: ["visibilityWindow", "operatingHours", "maxCapacity"],
        properties: {
          visibilityWindow: { type: "string", example: "Jan 31, 2027" },
          operatingHours: { type: "string", example: "07:30 – 15:30" },
          maxCapacity: { type: "number", example: 5 },
        },
      },
      DaycareContact: {
        type: "object",
        required: ["email", "phone"],
        properties: {
          email: { type: "string", format: "email", example: "caretaker@toddler.de" },
          website: { type: "string", example: "https://kita-sonnenschein.de" },
          phone: { type: "string", example: "+49 30 4482910" },
        },
      },
      DaycareAdditionalDetails: {
        type: "object",
        required: ["meals", "pets"],
        properties: {
          meals: { type: "string", enum: ["self-cooked", "delivered"], example: "self-cooked" },
          pets: { type: "string", enum: ["have-pets", "no-pets"], example: "no-pets" },
        },
      },
      DaycarePhoto: {
        type: "object",
        properties: {
          _id: { type: "string", example: "6af2c4ca78d4122444570989" },
          url: { type: "string", example: "/uploads/daycare/photos/1794294985528-319945899.png" },
        },
      },
      DaycareWorkPermit: {
        type: "object",
        properties: {
          url: { type: "string", example: "/uploads/daycare/documents/1794296061928-388839073.pdf" },
          fileName: { type: "string", example: "Official_Work_Permit.pdf" },
        },
      },
      Daycare: {
        type: "object",
        properties: {
          _id: { type: "string", example: "6af2c4ca78d4122444570988" },
          caretakerId: { type: "string", example: "6af2b346bf992bf21bfa6941" },
          daycareName: { type: "string", example: "Kita Sonnenschein" },
          caregiverName: { type: "string", example: "Maria Weber" },
          caregiverGender: { type: "string", enum: ["male", "female", "other"], example: "female" },
          status: { type: "string", enum: ["pending", "approved", "rejected"], example: "approved" },
          operations: { $ref: "#/components/schemas/DaycareOperations" },
          contact: { $ref: "#/components/schemas/DaycareContact" },
          additionalDetails: { $ref: "#/components/schemas/DaycareAdditionalDetails" },
          location: { $ref: "#/components/schemas/DaycareLocation" },
          photos: {
            type: "array",
            items: { $ref: "#/components/schemas/DaycarePhoto" },
          },
          workPermit: { $ref: "#/components/schemas/DaycareWorkPermit" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    // -----------------------------------------------------------------------
    // Admin Auth
    // -----------------------------------------------------------------------
    "/admin/register": {
      post: {
        tags: ["Admin Authentication"],
        summary: "Register new platform administrator",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Admin Officer" },
                  email: { type: "string", format: "email", example: "admin@toddler.de" },
                  password: { type: "string", format: "password", example: "AdminSecret123" },
                  role: { type: "string", enum: ["admin", "superadmin"], default: "admin" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Administrator registered successfully" },
          400: { description: "Validation error or admin already exists" },
        },
      },
    },
    "/admin/login": {
      post: {
        tags: ["Admin Authentication"],
        summary: "Authenticate administrator and obtain JWT token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "admin@toddler.de" },
                  password: { type: "string", format: "password", example: "AdminSecret123" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login successful with token and profile returned" },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/admin/profile": {
      get: {
        tags: ["Admin Authentication"],
        summary: "Get currently authenticated administrator profile",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Admin profile details" },
          401: { description: "Unauthorized" },
        },
      },
    },

    // -----------------------------------------------------------------------
    // Admin Daycare Management
    // -----------------------------------------------------------------------
    "/admin/daycares": {
      get: {
        tags: ["Admin Daycare Management"],
        summary: "List all registered daycare applications (pending, approved, rejected)",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "List of all daycare applications",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Daycare" },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/admin/daycares/{id}/status": {
      patch: {
        tags: ["Admin Daycare Management"],
        summary: "Approve or reject a daycare application",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "MongoDB Daycare ObjectId",
            schema: { type: "string", example: "6af2c4ca78d4122444570988" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["pending", "approved", "rejected"],
                    example: "approved",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Daycare status updated successfully" },
          400: { description: "Invalid status parameter" },
          404: { description: "Daycare not found" },
        },
      },
    },

    "/settings": {
      get: {
        tags: ["Platform Settings"],
        summary: "Get current platform settings (including default catchment radius)",
        responses: {
          200: {
            description: "Platform settings configuration",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        defaultCatchmentRadiusKm: { type: "number", example: 3.0 },
                        siteName: { type: "string", example: "Find Toddler Daycare" },
                        contactEmail: { type: "string", example: "admin@toddler-care.de" },
                        autoValidatePermits: { type: "boolean", example: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ["Platform Settings"],
        summary: "Update platform settings (Admin only)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  defaultCatchmentRadiusKm: { type: "number", example: 3.5 },
                  siteName: { type: "string" },
                  contactEmail: { type: "string" },
                  autoValidatePermits: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Settings updated successfully" },
          401: { description: "Unauthorized" },
        },
      },
    },

    // -----------------------------------------------------------------------
    // Caretaker Auth
    // -----------------------------------------------------------------------
    "/caretaker/auth/register": {
      post: {
        tags: ["Caretaker Authentication"],
        summary: "Register new daycare caretaker",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "maria@kita-sonnenschein.de" },
                  password: { type: "string", format: "password", example: "Care12345!" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Caretaker registered successfully" },
          400: { description: "Registration error" },
        },
      },
    },
    "/caretaker/auth/login": {
      post: {
        tags: ["Caretaker Authentication"],
        summary: "Authenticate caretaker and receive JWT token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "maria@kita-sonnenschein.de" },
                  password: { type: "string", format: "password", example: "Care12345!" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login successful with token" },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/caretaker/auth/profile": {
      get: {
        tags: ["Caretaker Authentication"],
        summary: "Get authenticated caretaker account info",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Caretaker account info" },
          401: { description: "Unauthorized" },
        },
      },
    },

    // -----------------------------------------------------------------------
    // Caretaker Daycare Management
    // -----------------------------------------------------------------------
    "/caretaker/daycare": {
      get: {
        tags: ["Caretaker Daycare"],
        summary: "Get authenticated caretaker's daycare profile",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Daycare profile details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Daycare" },
                  },
                },
              },
            },
          },
          404: { description: "Daycare not found" },
        },
      },
      post: {
        tags: ["Caretaker Daycare"],
        summary: "Create initial daycare profile with multipart uploads",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["daycareName", "caregiverName", "caregiverGender", "operations", "contact", "location"],
                properties: {
                  daycareName: { type: "string", example: "Kita Sonnenschein" },
                  caregiverName: { type: "string", example: "Maria Weber" },
                  caregiverGender: { type: "string", enum: ["male", "female", "other"], example: "female" },
                  operations: { type: "string", description: "JSON stringified DaycareOperations object" },
                  contact: { type: "string", description: "JSON stringified DaycareContact object" },
                  additionalDetails: { type: "string", description: "JSON stringified DaycareAdditionalDetails object" },
                  location: { type: "string", description: "JSON stringified DaycareLocation object" },
                  photos: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                    description: "Daycare photo images (PNG/JPG)",
                  },
                  workPermit: {
                    type: "string",
                    format: "binary",
                    description: "Official work permit document (PDF)",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Daycare profile created" },
          400: { description: "Validation error" },
        },
      },
      put: {
        tags: ["Caretaker Daycare"],
        summary: "Update daycare profile, manage photos (add/remove), and replace work permit",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  daycareName: { type: "string", example: "Kita Sonnenschein" },
                  caregiverName: { type: "string", example: "Maria Weber" },
                  caregiverGender: { type: "string", enum: ["male", "female", "other"] },
                  operations: { type: "string", description: "JSON stringified DaycareOperations" },
                  contact: { type: "string", description: "JSON stringified DaycareContact" },
                  additionalDetails: { type: "string", description: "JSON stringified DaycareAdditionalDetails" },
                  location: { type: "string", description: "JSON stringified DaycareLocation" },
                  existingPhotos: {
                    type: "string",
                    description: "JSON array of retained existing photo URLs. Any omitted photos are automatically deleted from DB and uploads folder.",
                    example: '["/uploads/daycare/photos/photo1.png"]',
                  },
                  photos: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                    description: "Newly uploaded photo files to append",
                  },
                  workPermit: {
                    type: "string",
                    format: "binary",
                    description: "Optional replacement work permit PDF document",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Daycare profile updated" },
          400: { description: "Update failed" },
        },
      },
    },
    "/caretaker/daycare/photos/{photoId}": {
      delete: {
        tags: ["Caretaker Daycare"],
        summary: "Delete a single daycare photo from database and disk storage",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "photoId",
            in: "path",
            required: true,
            description: "Photo _id or filename",
            schema: { type: "string", example: "1794294985528-319945899.png" },
          },
        ],
        responses: {
          200: { description: "Photo deleted successfully" },
          404: { description: "Photo not found" },
        },
      },
    },

    // -----------------------------------------------------------------------
    // Public Daycares (Parents Search)
    // -----------------------------------------------------------------------
    "/caretaker/daycare/all": {
      get: {
        tags: ["Public Daycares Search"],
        summary: "Get all active, admin-approved daycares for the Toddler Home Screen and map",
        responses: {
          200: {
            description: "List of active approved daycares",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Daycare" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // -----------------------------------------------------------------------
    // Daycare Inquiries & Email Dispatch
    // -----------------------------------------------------------------------
    "/inquiries": {
      post: {
        tags: ["Inquiries & Email Dispatch"],
        summary: "Submit web inquiry and dispatch email notifications to caretaker and parent",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["childName", "desiredStart", "parentName", "phone", "email"],
                properties: {
                  childName: { type: "string", example: "Lukas Schmidt" },
                  childBirthday: { type: "string", example: "2024-03-15" },
                  desiredStart: { type: "string", example: "August 2026" },
                  estTransition: { type: "string", example: "2-4 Weeks" },
                  careHours: { type: "string", example: "Mon – Fri • 08:00 – 15:00" },
                  preferences: {
                    type: "object",
                    properties: {
                      gender: { type: "string", example: "Female" },
                      food: { type: "string", example: "Self-cooked" },
                      pets: { type: "string", example: "Pets OK" },
                    },
                  },
                  parentName: { type: "string", example: "Maximilian Schmidt" },
                  phone: { type: "string", example: "+49 170 1234567" },
                  email: { type: "string", format: "email", example: "max@example.com" },
                  note: { type: "string", example: "We look forward to an introductory meeting." },
                  scope: { type: "string", enum: ["single", "allMap", "favorites"], example: "single" },
                  caretakerId: { type: "string", example: "6af2b346bf992bf21bfa6941" },
                  caretakerIds: { type: "array", items: { type: "string" } },
                  daycareIds: { type: "array", items: { type: "string" } },
                  daycareNames: { type: "array", items: { type: "string" } },
                  consentMapVisibility: { type: "boolean", example: true },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Inquiry successfully created and emails dispatched",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "object" },
                    meta: {
                      type: "object",
                      properties: {
                        message: { type: "string" },
                        referenceId: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          422: { description: "Validation error" },
        },
      },
      get: {
        tags: ["Inquiries & Email Dispatch"],
        summary: "Get inquiries list (filtered by status or email)",
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "email", in: "query", schema: { type: "string" } },
          { name: "caretakerId", in: "query", schema: { type: "string" }, description: "Filter inquiries for specific caretaker" },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "List of inquiries" },
        },
      },
    },
    "/inquiries/{id}": {
      get: {
        tags: ["Inquiries & Email Dispatch"],
        summary: "Get single inquiry by MongoDB ID or Reference ID",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Inquiry details" },
          404: { description: "Inquiry not found" },
        },
      },
    },
  },
};

const swaggerOptions = {
  swaggerDefinition,
  apis: [], // Defined inline in swaggerDefinition for complete portability & zero TS build drift
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export function setupSwagger(app: Express) {
  // Serve Swagger UI
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: `
        .swagger-ui .topbar { background-color: #1E1B18; border-bottom: 2px solid #A12D3A; }
        .swagger-ui .topbar-wrapper img { content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%23F5A623"><circle cx="12" cy="12" r="9"/></svg>'); }
        .swagger-ui .info h2 { color: #1E1B18; font-weight: 800; }
        .swagger-ui .btn.authorize { background-color: #16A34A; color: white; border-color: #16A34A; }
      `,
      customSiteTitle: "Toddler Platform API Documentation",
    })
  );

  // Serve raw JSON spec
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log("[Swagger] Documentation initialized at http://localhost:5000/api-docs");
}

