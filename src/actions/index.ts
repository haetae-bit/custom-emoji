import { getPdsAgent } from "@fujocoded/authproto/helpers";
import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { type Emoji, type EmojiSet, emoji as emojiSchema, emojiSet as emojiSetSchema } from "../utils/emojis";
import { IMAGE_TYPES, safecode } from "../utils/types";
import { isValidRecordKey } from "@atproto/syntax";

export const server = {
  addEmoji: defineAction({
    accept: "form",
    input: z.object({
      collection: z.string().refine(value => isValidRecordKey(value), {
        message: "Not a valid name for emoji set!",
      }),
      source: z.string().url().optional(),
      setDescription: z.string().optional(),
      shortcode: z.string().regex(safecode),
      image: z.instanceof(File).refine(file => IMAGE_TYPES.includes(file.type), {
        message: "Must be an image file!",
      }),
      alt: z.string().optional(),
      description: z.string().optional(),
      fallback: z.string().emoji({ message: "Should be a valid emoji" }).optional(),
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
        embeds: [{
          // @ts-ignore emoji type is weird here
          image: blob.data.blob,
          alt: alt ?? "",
        }],
        description,
        fallback,
      };

      // const checkEmoji = emojiSchema.validate(emoji);
      // if (!checkEmoji.success) {
      //   throw new ActionError({
      //     code: "BAD_REQUEST",
      //     message: "Emoji is not formatted correctly!",
      //   });
      // }

      let emojis: Emoji[] = [];
      let existingEmojiSet;
      try {
        existingEmojiSet = await agent.com.atproto.repo.getRecord({
          collection: "com.fujocoded.astrolabe.emojiset",
          repo: loggedInUser.did,
          rkey: collection,
        });
        emojis = existingEmojiSet.data.value.emojis as any[];
      } catch (error) {
        console.error("just make it up!");
      }
      
      const emojiSet: EmojiSet = {
        $type: "com.fujocoded.astrolabe.emojiset",
        // @ts-ignore for now
        emojis: [...(emojis), emoji],
        sourceUri: source,
        description: setDescription,
      }

      // const checkEmojiSet = emojiSetSchema.validate(emojiSet);
      // if (!checkEmojiSet.success) {
      //   throw new ActionError({
      //     code: "BAD_REQUEST",
      //     message: "Emoji set is not formatted correctly!",
      //   });
      // }
      
      const response = await agent.com.atproto.repo.putRecord({
        repo: loggedInUser.did,
        collection: emojiSetSchema.json.id,
        rkey: collection,
        record: emojiSet,
      });

      // const response = await agent.com.atproto.repo.applyWrites({
      //   repo: loggedInUser.did,
      //   writes: [
      //     {
      //       $type: "com.atproto.repo.applyWrites#create",
      //       collection: emojiSchema.json.id,
      //       value: emoji
      //     },
      //     {
      //       $type: (existingEmojiSet) ? "com.atproto.repo.applyWrites#update" : "com.atproto.repo.applyWrites#create",
      //       collection: emojiSetSchema.json.id,
      //       rkey: collection,
      //       value: emojiSet,
      //     }
      //   ]
      // });

      if (!response.success) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Something went wrong with creating a new emoji!"
        });
      }
      
      return response.data.uri;
      // return response.data.results;
    },
  }),
}