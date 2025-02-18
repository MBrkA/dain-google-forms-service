import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import axios from "axios";

import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

const createFormConfig: ToolConfig = {
  id: "create-form",
  name: "Create Form",
  description: "Create a new Google Form",
  input: z.object({
    title: z.string().describe("The title of the form"),
    documentTitle: z.string().optional().describe("The document title visible in Drive"),
  }),
  output: z.any(),
  handler: async (
    { title, documentTitle }: { title: string; documentTitle?: string },
    agentInfo,
    { app }
  ) => {
    const tokens = getTokenStore().getToken(agentInfo.id);

    // Handle authentication
    if (!tokens) {
      const authUrl = await app.oauth2?.generateAuthUrl("google", agentInfo.id);
      if (!authUrl) {
        throw new Error("Failed to generate authentication URL");
      }
      const oauthUI = new OAuthUIBuilder()
        .title("Google Authentication")
        .content("Please authenticate with Google to create forms")
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
      const response = await axios.post(
        "https://forms.googleapis.com/v1/forms",
        {
          info: {
            title,
            documentTitle: documentTitle || title,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const cardUI = new CardUIBuilder()
        .title("Form Created")
        .content(`
          Form Title: ${response.data.info.title}
          Form ID: ${response.data.formId}
          Responder URL: ${response.data.responderUri}
        `);

      return {
        text: `Created form with title: ${title}`,
        data: response.data,
        ui: cardUI.build(),
      };
    } catch (error: any) {
      console.error("Error creating form:", error.response?.data || error);

      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message(
          `Failed to create form: ${
            error.response?.data?.error?.message || error.message
          }`
        );

      return {
        text: "Failed to create form",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};

export { createFormConfig };
