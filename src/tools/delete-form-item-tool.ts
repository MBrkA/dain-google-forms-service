import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import axios from "axios";

import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

const deleteFormItemConfig: ToolConfig = {
  id: "delete-form-item",
  name: "Delete Form Item",
  description: "Delete an item from a Google Form",
  input: z.object({
    formId: z.string().describe("The ID of the form"),
    location: z.object({
      index: z.number().describe("Index of the item to delete")
    })
  }),
  output: z.any(),
  handler: async ({ formId, location }, agentInfo, { app }) => {
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
            deleteItem: {
              location
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
        .title("Item Deleted")
        .content(`Successfully deleted item at index ${location.index} from form ${formId}`);

      return {
        text: "Form item deleted successfully",
        data: response.data,
        ui: cardUI.build(),
      };

    } catch (error: any) {
      console.error("Error deleting form item:", error.response?.data || error);

      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message(`Failed to delete form item: ${error.response?.data?.error?.message || error.message}`);

      return {
        text: "Failed to delete form item",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};

export { deleteFormItemConfig };
