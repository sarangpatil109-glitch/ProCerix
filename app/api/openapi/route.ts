import { NextResponse } from "next/server";

export async function GET() {
  const openApiSpec = {
    openapi: "3.0.0",
    info: {
      title: "ProCerix Public API",
      version: "v1",
      description: "Developer API for ProCerix Platform Integrations"
    },
    servers: [
      { url: "https://api.procerix.com/api/v1", description: "Production Server" }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer"
        }
      }
    },
    security: [
      { BearerAuth: [] }
    ],
    paths: {
      "/courses": {
        get: {
          summary: "Get Courses",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer" } },
            { name: "offset", in: "query", schema: { type: "integer" } }
          ],
          responses: {
            "200": { description: "Successful response" }
          }
        }
      },
      "/certificates": {
        get: {
          summary: "Get User Certificates",
          parameters: [{ name: "userId", in: "query", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Successful response" } }
        }
      },
      "/internships": {
        get: {
          summary: "Get User Internships",
          parameters: [{ name: "userId", in: "query", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Successful response" } }
        }
      },
      "/resume": {
        get: {
          summary: "Get User Resumes",
          parameters: [{ name: "userId", in: "query", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Successful response" } }
        }
      },
      "/linkedin": {
        get: {
          summary: "Get User LinkedIn Profiles",
          parameters: [{ name: "userId", in: "query", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Successful response" } }
        }
      },
      "/verification": {
        get: {
          summary: "Verify Certificate",
          parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Successful response" } }
        }
      },
      "/payments": {
        get: {
          summary: "Get User Payments",
          parameters: [{ name: "userId", in: "query", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Successful response" } }
        }
      }
    }
  };

  return NextResponse.json(openApiSpec);
}
