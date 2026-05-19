const fs = require('fs');

const data = `openapi: 3.1.0
info:
  # Do not change the title, if the title changes, the import paths will be broken
  title: Api
  version: 0.1.0
  description: API specification
servers:
  - url: /api
    description: Base API path
tags:
  - name: health
    description: Health operations
paths:
  /healthz:
    get:
      operationId: healthCheck
      tags: [health]
      summary: Health check
      description: Returns server health status
      responses:
        "200":
          description: Healthy
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/HealthStatus"
  /summarize-bodily-recording:
    post:
      operationId: summarizeBodilyRecording
      summary: Summarize bodily symptoms recording
      description: Summarizes user's spoken bodily symptoms for a specific body part using Groq AI
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                bodyPart:
                  type: string
                transcript:
                  type: string
              required:
                - bodyPart
                - transcript
      responses:
        "200":
          description: Summary generated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/SummarizeResponse"
components:
  schemas:
    HealthStatus:
      type: object
      properties:
        status:
          type: string
      required:
        - status
    SummarizeResponse:
      type: object
      properties:
        summary:
          type: string
      required:
        - summary
`;

fs.writeFileSync('lib/api-spec/openapi.yaml', data);
