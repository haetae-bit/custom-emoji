import { getPdsAgent } from "@fujocoded/authproto/helpers";
import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import type { Emoji, EmojiSet } from "../utils/emojis";

const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
  "image/gif",
];

export const server = {
  addEmoji: defineAction({
    accept: "form",
    input: z.object({
      collection: z.string(),
      source: z.string().url().optional(),
      setDescription: z.string().optional(),
      shortcode: z.string(),
      image: z.instanceof(File).refine(file => IMAGE_TYPES.includes(file.type), {
        message: "Must be an image file!",
      }),
      alt: z.string(),
      description: z.string().optional(),
      fallback: z.string().emoji({ message: "Should be a valid emoji" }),
    }),
    handler: async ({ collection, source, setDescription, shortcode, image: imageFile, alt, description, fallback }, context) => {
      const loggedInUser = context.locals.loggedInUser;
      if (!loggedInUser) {
        throw new ActionError({
          code: "UNAUTHORIZED",
          message: "You should be logged in to add an emoji!",
        });
      }

      const agent = await getPdsAgent({ loggedInUser });
      if (!agent) {
        throw new ActionError({
          code: "BAD_GATEWAY",
          message: "Failed to connect to your PDS!",
        });
      }
      
      // slugify the collection here to use as rkey

      const blob = await agent.com.atproto.repo.uploadBlob(imageFile);
      if (!blob.success) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Failed to upload image!",
        });
      }

      const emoji: Emoji = {
        $type: "com.fujocoded.astrolabe.emoji",
        shortcode,
        image: {
          // @ts-ignore emoji type is weird here
          image: blob.data.blob,
          alt,
        },
        description,
        fallback,
      };

      let emojis: Emoji[] = [];
      try {
        const findEmojiSet = await agent.com.atproto.repo.getRecord({
          collection: "com.fujocoded.astrolabe.emojiset",
          repo: loggedInUser.did,
          rkey: collection,
        });
        emojis = findEmojiSet.data.value.emojis as any[];
      } catch (error) {
        console.error("just make it up!");
      }
      
      const set: EmojiSet = {
        $type: "com.fujocoded.astrolabe.emojiset",
        emojis: [...(emojis), emoji],
        source,
        description: setDescription,
      }
      
      const response = await agent.com.atproto.repo.putRecord({
        collection: "com.fujocoded.astrolabe.emojiset",
        repo: loggedInUser.did,
        rkey: collection,
        record: set,
      });

      if (!response.success) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Something went wrong with creating a new emoji!"
        });
      }
      
      return response.data.uri;
    },
  }),
}