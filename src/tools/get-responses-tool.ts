import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import axios from "axios";

import {
  AlertUIBuilder,
  TableUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

const getResponsesConfig: ToolConfig = {
  id: "get-responses",
  name: "Get Form Responses", 
  description: "Get all responses for a Google Form",
  input: z.object({
    formId: z.string().describe("The ID of the form to get responses for"),
    pageSize: z.number().optional().describe("Maximum number of responses to return (max 5000)"),
    pageToken: z.string().optional().describe("Page token for pagination"),
    filter: z.string().optional().describe("Filter responses by timestamp")
  }),
  output: z.any(),
  handler: async ({ formId, pageSize, pageToken, filter }, agentInfo, { app }) => {
    const tokens = getTokenStore().getToken(agentInfo.id);

    // Handle authentication
    if (!tokens) {
      const authUrl = await app.oauth2?.generateAuthUrl("google", agentInfo.id);
      if (!authUrl) {
        throw new Error("Failed to generate authentication URL");
      }
      const oauthUI = new OAuthUIBuilder()
        .title("Google Authentication")
        .content("Please authenticate with Google to view form responses")
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
      let url = `https://forms.googleapis.com/v1/forms/${formId}/responses`;
      const params = new URLSearchParams();
      
      if (pageSize) params.append('pageSize', pageSize.toString());
      if (pageToken) params.append('pageToken', pageToken);
      if (filter) params.append('filter', filter);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const responses = response.data.responses || [];

      // Create table UI with responses
      const tableUI = new TableUIBuilder()
        .addColumns([
          { key: "responseId", header: "Response ID", type: "text" },
          { key: "createTime", header: "Created", type: "text" },
          { key: "lastSubmittedTime", header: "Last Submitted", type: "text" },
          { key: "respondentEmail", header: "Email", type: "text" }
        ])
        .rows(responses.map(r => ({
          responseId: r.responseId,
          createTime: new Date(r.createTime).toLocaleString(),
          lastSubmittedTime: new Date(r.lastSubmittedTime).toLocaleString(),
          respondentEmail: r.respondentEmail || 'Anonymous'
        })))
        .build();

      return {
        text: `Retrieved ${responses.length} responses`,
        data: {
          responses,
          nextPageToken: response.data.nextPageToken
        },
        ui: tableUI
      };

    } catch (error: any) {
      console.error("Error getting responses:", error.response?.data || error);

      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message(`Failed to get responses: ${error.response?.data?.error?.message || error.message}`);

      return {
        text: "Failed to get form responses",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};

export { getResponsesConfig };
