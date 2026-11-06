import type { Metadata } from "next";
import { LoginCard } from "../../../components/auth/LoginCard";

export const metadata: Metadata = {
  title: "Anmelden | Kindertagespflege finden",
  description: "Melde Dich an, um auf Dein Betreuungs-Dashboard zuzugreifen.",
};

export default function LoginPage() {
  return <LoginCard />;
}
