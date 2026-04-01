import { ClientHome } from "./client-home";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function UserHomePage({ params }: Props) {
  const { username } = await params;
  return <ClientHome username={username} />;
}