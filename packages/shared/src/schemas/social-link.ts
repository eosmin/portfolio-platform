import { z } from 'zod';
import { SOCIAL_PLATFORMS } from '../constants/index.js';
import { idSchema, orderSchema, shortTextSchema } from './common.js';

export const socialPlatformSchema = z.enum(SOCIAL_PLATFORMS).meta({ id: 'SocialPlatform' });

// EMAIL links are stored as mailto: URLs, so url cannot be http(s)-only.
const socialUrlSchema = z.union([
  z.url({ protocol: /^https?$/, hostname: z.regexes.domain }),
  z.url({ protocol: /^mailto$/ }),
]);

export const socialLinkSchema = z
  .object({
    id: idSchema,
    platform: socialPlatformSchema,
    url: socialUrlSchema,
    label: shortTextSchema.nullable(),
    icon: shortTextSchema.nullable(),
    order: orderSchema,
    visible: z.boolean(),
  })
  .meta({ id: 'SocialLink' });

export const socialLinkInputSchema = socialLinkSchema
  .omit({ id: true })
  .meta({ id: 'SocialLinkInput' });

export const socialLinkUpdateSchema = socialLinkInputSchema
  .partial()
  .meta({ id: 'SocialLinkUpdate' });
