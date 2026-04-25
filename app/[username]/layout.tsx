import type { ReactNode } from "react";
import { ClientLayoutShell } from "./client-layout-shell";

type Props = {
  children: ReactNode;
  params: Promise<{ username: string }>;
};

export default async function ClientLayout({ children, params }: Props) {
  const { username } = await params;
  return <ClientLayoutShell username={username}>{children}</ClientLayoutShell>;
}
