import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import axios from "axios";

import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

const getFormConfig: ToolConfig = {
  id: "get-form",
  name: "Get Form",
  description: "Get details of a Google Form",
  input: z.object({
    formId: z.string().describe("The ID of the form to retrieve"),
  }),
  output: z.any(),
  handler: async ({ formId }: { formId: string }, agentInfo, { app }) => {
    const tokens = getTokenStore().getToken(agentInfo.id);

    // Handle authentication
    if (!tokens) {
      const authUrl = await app.oauth2?.generateAuthUrl("google", agentInfo.id);
      if (!authUrl) {
        throw new Error("Failed to generate authentication URL");
      }
      const oauthUI = new OAuthUIBuilder()
        .title("Google Authentication")
        .content("Please authenticate with Google to view forms")
        .logo(
          "https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png"
        )
        .url(authUrl)
        .provider("google");

      return {
        text: "Authentication required",
        data: undefined,
        ui: oauthUI.build(),
      };
    }

    try {
      const response = await axios.get(
        `https://forms.googleapis.com/v1/forms/${formId}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const form = response.data;
      const cardUI = new CardUIBuilder()
        .title("Form Details")
        .content(`
          Title: ${form.info.title}
          Description: ${form.info.description || "No description"}
          Number of Items: ${form.items?.length || 0}
          Responder URL: ${form.responderUri}
        `);

      return {
        text: `Retrieved form: ${form.info.title}`,
        data: form,
        ui: cardUI.build(),
      };
    } catch (error: any) {
      console.error("Error getting form:", error.response?.data || error);

      const alertUI = new AlertUIBuilder()
        .withVariant("error")
        .withMessage(
          `Failed to get form: ${
            error.response?.data?.error?.message || error.message
          }`
        );

      return {
        text: "Failed to get form details",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};

export { getFormConfig };
