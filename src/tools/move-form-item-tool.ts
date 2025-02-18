import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import axios from "axios";

import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

const moveFormItemConfig: ToolConfig = {
  id: "move-form-item",
  name: "Move Form Item",
  description: "Move an item to a new position in a Google Form",
  input: z.object({
    formId: z.string().describe("The ID of the form"),
    originalLocation: z.object({
      index: z.number().describe("Current index of the item")
    }),
    newLocation: z.object({
      index: z.number().describe("New index for the item")
    })
  }),
  output: z.any(),
  handler: async ({ formId, originalLocation, newLocation }, agentInfo, { app }) => {
    const tokens = getTokenStore().getToken(agentInfo.id);

    if (!tokens) {
      const authUrl = await app.oauth2?.generateAuthUrl("google", agentInfo.id);
      if (!authUrl) {
        throw new Error("Failed to generate authentication URL");
      }
      const oauthUI = new OAuthUIBuilder()
        .title("Google Authentication")
        .content("Please authenticate with Google to modify forms")
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
      const response = await axios.post(
        `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`,
        {
          requests: [{
            moveItem: {
              originalLocation,
              newLocation
            }
          }]
        },
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const cardUI = new CardUIBuilder()
        .title("Item Moved")
        .content(`Successfully moved item from index ${originalLocation.index} to ${newLocation.index}`);

      return {
        text: "Form item moved successfully",
        data: response.data,
        ui: cardUI.build(),
      };

    } catch (error: any) {
      console.error("Error moving form item:", error.response?.data || error);

      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message(`Failed to move form item: ${error.response?.data?.error?.message || error.message}`);

      return {
        text: "Failed to move form item",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};

export { moveFormItemConfig };
