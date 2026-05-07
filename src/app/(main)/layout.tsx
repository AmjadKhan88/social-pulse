// src/app/(main)/layout.tsx
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { MainLayout } from "@/components/layout/MainLayout";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return <MainLayout>{children}</MainLayout>;
}
