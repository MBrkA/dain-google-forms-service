import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import axios from "axios";

import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

const addFormItemConfig: ToolConfig = {
  id: "add-form-item",
  name: "Add Form Item",
  description: "Add a new item (question, text, etc) to a Google Form",
  input: z.object({
    formId: z.string().describe("The ID of the form to add item to"),
    item: z.object({
      title: z.string().describe("Title/question text"),
      description: z.string().optional().describe("Description/help text"),
      questionItem: z.object({
        question: z.object({
          required: z.boolean().optional(),
          choiceQuestion: z.object({
            type: z.enum(["RADIO", "CHECKBOX", "DROP_DOWN"]),
            options: z.array(z.object({
              value: z.string()
            }))
          }).optional(),
          textQuestion: z.object({
            paragraph: z.boolean().optional()
          }).optional(),
          scaleQuestion: z.object({
            low: z.number(),
            high: z.number(),
            lowLabel: z.string().optional(),
            highLabel: z.string().optional()
          }).optional()
        })
      }).optional(),
      pageBreakItem: z.object({}).optional(),
      textItem: z.object({}).optional()
    }),
    location: z.object({
      index: z.number().describe("Index where to insert the item")
    }).optional()
  }),
  output: z.any(),
  handler: async ({ formId, item, location }, agentInfo, { app }) => {
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
            createItem: {
              item,
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
        .title("Item Added")
        .content(`Successfully added new item to form ${formId}`);

      return {
        text: "Form item added successfully",
        data: response.data,
        ui: cardUI.build(),
      };

    } catch (error: any) {
      console.error("Error adding form item:", error.response?.data || error);

      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message(`Failed to add form item: ${error.response?.data?.error?.message || error.message}`);

      return {
        text: "Failed to add form item",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};

export { addFormItemConfig };
