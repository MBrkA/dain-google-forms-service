import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import axios from "axios";

import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

const updateFormConfig: ToolConfig = {
  id: "update-form",
  name: "Update Form",
  description: "Update an existing Google Form",
  input: z.object({
    formId: z.string().describe("The ID of the form to update"),
    title: z.string().optional().describe("New title for the form"),
    description: z.string().optional().describe("New description for the form"),
    settings: z.object({
      quizSettings: z.object({
        isQuiz: z.boolean().optional().describe("Whether this form is a quiz")
      }).optional(),
      emailCollectionType: z.enum([
        "DO_NOT_COLLECT",
        "VERIFIED", 
        "RESPONDER_INPUT"
      ]).optional().describe("Email collection settings")
    }).optional()
  }),
  output: z.any(),
  handler: async ({ formId, title, description, settings }, agentInfo, { app }) => {
    const tokens = getTokenStore().getToken(agentInfo.id);

    if (!tokens) {
      const authUrl = await app.oauth2?.generateAuthUrl("google", agentInfo.id);
      if (!authUrl) {
        throw new Error("Failed to generate authentication URL");
      }
      const oauthUI = new OAuthUIBuilder()
        .title("Google Authentication")
        .content("Please authenticate with Google to update forms")
        .logo("https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png")
        .url(authUrl)
        .provider("google");

      return {
        text: "Authentication required",
        data: undefined,
        ui: oauthUI.build(),
      };
    }

    try {
      const updateRequest = {
        requests: [] as any[]
      };

      if (title || description) {
        updateRequest.requests.push({
          updateFormInfo: {
            info: {
              title,
              description
            },
            updateMask: [
              ...(title ? ["title"] : []),
              ...(description ? ["description"] : [])
            ].join(",")
          }
        });
      }

      if (settings) {
        updateRequest.requests.push({
          updateSettings: {
            settings,
            updateMask: Object.keys(settings).join(",")
          }
        });
      }

      const response = await axios.post(
        `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`,
        updateRequest,
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const cardUI = new CardUIBuilder()
        .title("Form Updated")
        .content(`Successfully updated form ${formId}`);

      return {
        text: "Form updated successfully",
        data: response.data,
        ui: cardUI.build(),
      };

    } catch (error: any) {
      console.error("Error updating form:", error.response?.data || error);

      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message(`Failed to update form: ${error.response?.data?.error?.message || error.message}`);

      return {
        text: "Failed to update form",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};

export { updateFormConfig };
