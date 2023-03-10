import type { ClientSafeProvider } from "next-auth/react";
import type { Socials } from "server/types";
import { Icon } from "../icon";
import { DiscordIcon } from "./discord";
import { GoogleIcon } from "./google";
import { SpotifyIcon } from "./spotify";

const providerIcons: Record<Socials, (props: Icon) => JSX.Element> = {
  discord: (props) => (
    <DiscordIcon className="h-10 w-10 scale-150 text-white" {...props} />
  ),
  google: (props) => <GoogleIcon className="h-10 w-10" {...props} />,
  spotify: (props) => <SpotifyIcon className="h-10 w-10" {...props} />,
} as const;

export function ensureProvider(provider: ClientSafeProvider["name"]) {
  if (Object.keys(providerIcons).includes(provider)) {
    return provider as Socials;
  } else {
    throw new Error(`The provider ${provider} is not set in NextAuth config.`);
  }
}

interface SocialIconProps extends Icon {
  provider: Socials;
}

export const SocialIcon = ({ provider, ...props }: SocialIconProps) => {
  return <>{providerIcons[provider](props)}</>;
};
