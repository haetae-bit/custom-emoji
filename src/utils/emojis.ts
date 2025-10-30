import { lx, type Infer } from "prototypey";

export const emoji = lx.lexicon("com.fujocoded.astrolabe.emoji", {
  main: lx.object({
    image: lx.object({
      image: lx.blob({
        accept: ["image/*"],
        maxSize: 100000,
        required: true,
      }),
      alt: lx.string({ required: true }),
    }),
    shortcode: lx.string({ required: true }),
    description: lx.string(),
    fallback: lx.string({ required: true }),
  }),
});

export const emojiSet = lx.lexicon("com.fujocoded.astrolabe.emojiset", {
  main: lx.record({
    key: "self",
    record: lx.object({
      emojis: lx.array(lx.ref(emoji.json.id)),
      source: lx.string(),
      description: lx.string(),
    }),
  }),
});

export type Emoji = Infer<typeof emoji>;
export type EmojiSet = Infer<typeof emojiSet>;