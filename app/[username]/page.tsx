import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function UserHomePage({ params }: Props) {
  const { username } = await params;
  redirect(`/${username}/simulation`);
}
