/** Only display data crosses the server boundary. Never include tokens or email. */
export type CommunitySession = {
  user: {
    id: string;
    user_metadata: { user_name: string; avatar_url?: string };
  };
};
