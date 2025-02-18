import { createOAuth2Tool, defineDAINService } from "@dainprotocol/service-sdk";
import { getTokenStore } from "./token-store";
import { createFormConfig } from "./tools/create-form-tool";
import { getFormConfig } from "./tools/get-form-tool";
import { getResponsesConfig } from "./tools/get-responses-tool";
import { updateFormConfig } from "./tools/update-form-tool";
import { addFormItemConfig } from "./tools/add-form-item-tool";
import { deleteFormItemConfig } from "./tools/delete-form-item-tool";
import { moveFormItemConfig } from "./tools/move-form-item-tool";

export const dainService = defineDAINService({
  metadata: {
    title: "Google Forms Service",
    description: "A DAIN service for interacting with Google Forms",
    version: "1.0.0",
    author: "DAIN",
    tags: ["forms", "google"],
  },
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [
    createOAuth2Tool("google"),
    createFormConfig,
    getFormConfig,
    getResponsesConfig,
    updateFormConfig,
    addFormItemConfig,
    deleteFormItemConfig,
    moveFormItemConfig
  ],
  oauth2: {
    baseUrl: process.env.TUNNEL_URL || "http://localhost:2022",
    providers: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scopes: [
          "https://www.googleapis.com/auth/forms.body",
          "https://www.googleapis.com/auth/drive.file",
          "https://www.googleapis.com/auth/forms.responses.readonly",
          "email",
          "profile",
        ],
        onSuccess: async (agentId, tokens) => {
          console.log("Completed OAuth flow for agent", agentId, tokens);
          getTokenStore().setToken(agentId, tokens);
          console.log(`Stored tokens for agent ${agentId}`);
        },
      },
    },
  },
});
